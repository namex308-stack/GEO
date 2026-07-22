import "server-only";
import crypto from "node:crypto";
import type { BillingPeriod, PlanId } from "@/lib/billing/plans";
import type { KashierAllowedMethod } from "@/lib/kashier/methods";

const KASHIER_HPP_BASE = "https://checkout.kashier.io";
const KASHIER_SESSION_API_TEST = "https://test-api.kashier.io/v3/payment/sessions";
const KASHIER_SESSION_API_LIVE = "https://api.kashier.io/v3/payment/sessions";

interface KashierConfig {
  merchantId: string;
  apiKey: string;
  secretKey: string | null;
  mode: "live" | "test";
}

function normalizeKashierMode(raw: string | undefined): "live" | "test" {
  if (raw === "live") return "live";
  // README / dashboard sometimes use "sandbox"; Kashier HPP expects "test".
  return "test";
}

function getConfig(): KashierConfig | null {
  const merchantId =
    process.env.KASHIER_MERCHANT_ID ?? process.env.NEXT_PUBLIC_KASHIER_MERCHANT_ID;
  const apiKey = process.env.KASHIER_API_KEY;
  if (!merchantId || !apiKey) return null;
  const mode = normalizeKashierMode(process.env.KASHIER_MODE);
  // Payment Sessions auth requires the payment secret key — never the webhook secret.
  // Escape `$` as `\$` in .env.local — Next.js dotenv-expand otherwise truncates
  // Kashier secrets (they contain `$`) and the session API returns 401 Invalid token.
  const secretKey = process.env.KASHIER_SECRET_KEY?.trim() || null;
  return { merchantId, apiKey, secretKey, mode };
}

export function isKashierConfigured(): boolean {
  const merchantId =
    process.env.KASHIER_MERCHANT_ID ?? process.env.NEXT_PUBLIC_KASHIER_MERCHANT_ID;
  return !!(merchantId && process.env.KASHIER_API_KEY);
}

export function getKashierMode(): "live" | "test" {
  return normalizeKashierMode(process.env.KASHIER_MODE);
}

/** True when KASHIER_MODE is explicitly set (required in production). */
export function isKashierModeExplicit(): boolean {
  const raw = process.env.KASHIER_MODE?.trim().toLowerCase();
  return raw === "live" || raw === "test" || raw === "sandbox";
}

/**
 * APP_URL used for merchantRedirect / serverWebhook must be publicly reachable
 * in production — localhost callbacks never receive Kashier server webhooks.
 */
export function isPublicAppUrl(appUrl: string): boolean {
  try {
    const u = new URL(appUrl);
    if (/^(localhost|127\.0\.0\.1)$/i.test(u.hostname)) return false;
    if (process.env.NODE_ENV === "production" && u.protocol !== "https:") return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Production gate for live checkout: public HTTPS APP_URL + explicit KASHIER_MODE.
 * Returns an error message when checkout must be blocked; null when OK.
 */
export function getCheckoutEnvironmentError(appUrl: string): string | null {
  if (process.env.NODE_ENV !== "production") return null;
  if (!isPublicAppUrl(appUrl)) {
    return (
      "NEXT_PUBLIC_APP_URL must be a public HTTPS URL in production " +
      "(not localhost). Kashier webhooks and redirects cannot reach local URLs."
    );
  }
  if (!isKashierModeExplicit()) {
    return (
      "KASHIER_MODE must be set explicitly in production to \"live\" or \"test\". " +
      "Unset mode defaults to test and can mismatch live merchant keys."
    );
  }
  return null;
}

export interface CheckoutParams {
  orderId: string;
  amount: number;
  currency?: string;
  customerEmail: string;
  customerName?: string;
  customerReference?: string;
  planId: string;
  period: BillingPeriod;
  successUrl: string;
  failureUrl: string;
  callbackUrl: string;
  webhookUrl: string;
  /** Kashier allowedMethods value, e.g. card, wallet */
  paymentMethod?: KashierAllowedMethod;
}

/** Build order id without colons (Kashier HPP is sensitive to special chars). */
export function buildOrderId(
  userId: string,
  planId: Exclude<PlanId, "free">,
  period: BillingPeriod
): string {
  return `sp-${planId}-${period}-${userId}-${Date.now()}`;
}

export function parseOrderId(orderId: string): {
  plan: Exclude<PlanId, "free">;
  period: BillingPeriod;
  userId: string;
} | null {
  const modern = /^sp-(pro|business)-(monthly|yearly)-([0-9a-f-]{36})-(\d+)$/.exec(orderId);
  if (modern) {
    return {
      plan: modern[1] as Exclude<PlanId, "free">,
      period: modern[2] as BillingPeriod,
      userId: modern[3],
    };
  }

  const legacy = /^sp:(pro|business):(monthly|yearly):([0-9a-f-]{36}):(\d+)$/.exec(orderId);
  if (legacy) {
    return {
      plan: legacy[1] as Exclude<PlanId, "free">,
      period: legacy[2] as BillingPeriod,
      userId: legacy[3],
    };
  }

  return null;
}

function generateHash(
  config: KashierConfig,
  orderId: string,
  amount: number,
  currency: string
): string {
  const path = `/?payment=${config.merchantId}.${orderId}.${amount}.${currency}`;
  return crypto.createHmac("sha256", config.apiKey).update(path).digest("hex");
}

/** Legacy hosted payment page URL (checkout.kashier.io). */
function createLegacyCheckoutUrl(params: CheckoutParams, config: KashierConfig): string {
  const currency = params.currency ?? "EGP";
  const hash = generateHash(config, params.orderId, params.amount, currency);

  const url = new URL(`${KASHIER_HPP_BASE}/`);
  url.searchParams.set("merchantId", config.merchantId);
  url.searchParams.set("orderId", params.orderId);
  url.searchParams.set("amount", String(params.amount));
  url.searchParams.set("currency", currency);
  url.searchParams.set("hash", hash);
  url.searchParams.set("mode", config.mode);
  url.searchParams.set("merchantRedirect", params.callbackUrl);
  url.searchParams.set("failureRedirect", params.failureUrl);
  // Best-effort: some HPP builds accept serverWebhook; unknown params are ignored.
  // Also configure the same URL in the Kashier dashboard for reliable server-to-server events.
  url.searchParams.set("serverWebhook", params.webhookUrl);
  url.searchParams.set("display", "en");
  url.searchParams.set("type", "external");

  if (params.customerEmail) {
    url.searchParams.set("customer.email", params.customerEmail);
  }
  if (params.customerName) {
    url.searchParams.set("customer.name", params.customerName);
  }
  if (params.paymentMethod) {
    url.searchParams.set("allowedMethods", params.paymentMethod);
    url.searchParams.set("defaultMethod", params.paymentMethod);
  }

  console.info("[kashier] HPP checkout URL built", {
    orderId: params.orderId,
    amount: params.amount,
    mode: config.mode,
    merchantRedirect: params.callbackUrl,
    serverWebhook: params.webhookUrl,
    paymentMethod: params.paymentMethod ?? "default",
  });

  return url.toString();
}

interface PaymentSessionResponse {
  sessionUrl?: string;
  status?: string;
  message?: string;
  _id?: string;
}

/**
 * Kashier Payment Sessions API is IP-whitelisted in the merchant dashboard.
 * After an Unauthorized IP response, skip further session calls this process
 * and use hosted checkout (HPP) instead.
 */
let sessionApiIpBlocked = false;

function shouldUsePaymentSessionsApi(): boolean {
  if (sessionApiIpBlocked) return false;
  // Local/dev IPs are almost never on Kashier's allowlist — use HPP unless forced.
  if (process.env.NODE_ENV === "development") {
    const force = process.env.KASHIER_FORCE_SESSION_API?.trim().toLowerCase();
    return force === "1" || force === "true";
  }
  if (process.env.KASHIER_SKIP_SESSION_API?.trim().toLowerCase() === "true") {
    return false;
  }
  return true;
}

function isUnauthorizedIpError(
  status: number,
  body: PaymentSessionResponse
): boolean {
  if (status !== 403) return false;
  const msg = (body.message ?? "").toLowerCase();
  return msg.includes("unauthorized ip") || msg.includes("ip address");
}

/** Payment Sessions API — preferred when IP-allowed; returns payments.kashier.io URL. */
async function createPaymentSession(
  params: CheckoutParams,
  config: KashierConfig
): Promise<string | null> {
  if (!config.secretKey) {
    console.info("[kashier] skipping Sessions API — KASHIER_SECRET_KEY not set");
    return null;
  }
  if (!shouldUsePaymentSessionsApi()) {
    console.info("[kashier] skipping Sessions API — disabled for this environment");
    return null;
  }

  const apiBase = config.mode === "live" ? KASHIER_SESSION_API_LIVE : KASHIER_SESSION_API_TEST;
  const amount = params.amount.toFixed(2);

  const customer: { email?: string; reference: string } = {
    reference: params.customerReference ?? params.customerEmail ?? params.orderId,
  };
  if (params.customerEmail) {
    customer.email = params.customerEmail;
  }

  // Official docs: failureRedirect is boolean (redirect after first failure), not a URL.
  const body = {
    expireAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    maxFailureAttempts: 3,
    paymentType: "credit",
    amount,
    currency: params.currency ?? "EGP",
    order: params.orderId,
    merchantId: config.merchantId,
    mode: config.mode,
    merchantRedirect: encodeURIComponent(params.callbackUrl),
    display: "en",
    type: "one-time",
    allowedMethods: params.paymentMethod ?? "card,wallet,bank_installments",
    defaultMethod: params.paymentMethod ?? "card",
    failureRedirect: true,
    description: `convaudit ${params.planId} ${params.period}`,
    customer,
    serverWebhook: params.webhookUrl,
    interactionSource: "ECOMMERCE",
    enable3DS: true,
  };

  console.info("[kashier] creating payment session", {
    apiBase,
    orderId: params.orderId,
    amount,
    mode: config.mode,
    serverWebhook: params.webhookUrl,
    merchantRedirect: params.callbackUrl,
    paymentMethod: params.paymentMethod ?? "default",
  });

  try {
    const res = await fetch(apiBase, {
      method: "POST",
      headers: {
        Authorization: config.secretKey,
        "api-key": config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const json = (await res.json()) as PaymentSessionResponse;
    if (!res.ok) {
      if (isUnauthorizedIpError(res.status, json)) {
        sessionApiIpBlocked = true;
        console.warn(
          "[kashier] Payment Sessions API blocked (Unauthorized IP). " +
            "Falling back to HPP. Whitelist this server's IP in the Kashier merchant dashboard, " +
            "and ensure the dashboard webhook points at /api/webhook/kashier."
        );
        return null;
      }
      if (res.status === 401) {
        console.error(
          "[kashier] session API 401 Invalid token — check KASHIER_SECRET_KEY. " +
            "If the key contains `$`, escape it as `\\$` in .env.local and restart the server."
        );
      } else {
        console.error("[kashier] session API failed:", res.status, json);
      }
      return null;
    }

    if (json.sessionUrl) {
      console.info("[kashier] payment session created", {
        status: json.status,
        sessionId: json._id,
        orderId: params.orderId,
      });
      return json.sessionUrl;
    }

    console.error("[kashier] session API OK but missing sessionUrl:", {
      status: json.status,
      keys: Object.keys(json),
      orderId: params.orderId,
    });
  } catch (err) {
    console.error("[kashier] session API error:", err);
  }

  return null;
}

/**
 * Create a Kashier checkout URL.
 * Tries Payment Sessions API when allowed, then falls back to legacy HPP.
 */
export async function createCheckoutUrl(params: CheckoutParams): Promise<string | null> {
  const config = getConfig();
  if (!config) {
    console.error("[kashier] createCheckoutUrl: not configured");
    return null;
  }

  console.info("[kashier] createCheckoutUrl start", {
    orderId: params.orderId,
    planId: params.planId,
    period: params.period,
    amount: params.amount,
    mode: config.mode,
    hasSecretKey: !!config.secretKey,
  });

  const sessionUrl = await createPaymentSession(params, config);
  if (sessionUrl) {
    console.info("[kashier] using Payment Sessions checkout", { orderId: params.orderId });
    return sessionUrl;
  }

  console.warn(
    "[kashier] using hosted checkout (HPP) — configure Kashier dashboard webhook to " +
      `${params.webhookUrl} so server-to-server events still arrive if HPP omits serverWebhook.`
  );
  return createLegacyCheckoutUrl(params, config);
}

/**
 * HMAC secrets to try for webhook verification (first match wins).
 * Prefer dedicated webhook secret, then payment secret key (Kashier docs),
 * then API key for backward compatibility with older dashboard setups.
 */
export function getWebhookHmacSecrets(): string[] {
  const secrets = [
    process.env.KASHIER_WEBHOOK_SECRET?.trim(),
    process.env.KASHIER_SECRET_KEY?.trim(),
    process.env.KASHIER_API_KEY?.trim(),
  ].filter((s): s is string => !!s);
  return [...new Set(secrets)];
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!signature) return false;
  const sig = signature.replace(/^sha256=/i, "").trim();
  const secrets = getWebhookHmacSecrets();
  if (secrets.length === 0) {
    console.error("[kashier] webhook HMAC: no secret configured");
    return false;
  }

  for (const secret of secrets) {
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    try {
      const a = Buffer.from(expected, "utf8");
      const b = Buffer.from(sig, "utf8");
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        return true;
      }
    } catch {
      // length mismatch or encoding error — try next secret
    }
  }
  return false;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstNonEmptyString(candidates: unknown[]): string {
  for (const c of candidates) {
    if (c == null || c === "") continue;
    if (typeof c === "object") continue;
    const s = String(c).trim();
    if (s) return s;
  }
  return "";
}

/** Parse Kashier redirect / webhook payload for payment success. */
export function isPaymentSuccessful(payload: Record<string, unknown>): boolean {
  const data = asRecord(payload.data);
  const transaction = asRecord(payload.transaction);
  const payment = asRecord(payload.payment);
  const status = firstNonEmptyString([
    payload.status,
    payload.paymentStatus,
    payload.transactionStatus,
    data?.status,
    data?.paymentStatus,
    data?.transactionStatus,
    transaction?.status,
    payment?.status,
  ]).toUpperCase();
  return status === "SUCCESS" || status === "CAPTURED" || status === "PAID";
}

export function extractOrderId(payload: Record<string, unknown>): string {
  const data = asRecord(payload.data);
  const transaction = asRecord(payload.transaction);
  const payment = asRecord(payload.payment);
  const orderObj =
    asRecord(payload.order) ?? asRecord(data?.order) ?? asRecord(transaction?.order);

  return firstNonEmptyString([
    payload.orderId,
    payload.order_id,
    typeof payload.order === "string" ? payload.order : null,
    orderObj?.id,
    orderObj?.orderId,
    orderObj?.order_id,
    data?.orderId,
    data?.order_id,
    typeof data?.order === "string" ? data.order : null,
    transaction?.orderId,
    payment?.orderId,
  ]);
}

/** Extract paid amount from Kashier webhook / redirect payload. */
export function extractAmount(payload: Record<string, unknown>): number | null {
  const data = asRecord(payload.data);
  const transaction = asRecord(payload.transaction);
  const payment = asRecord(payload.payment);
  const raw =
    payload.amount ??
    payload.total ??
    payload.value ??
    data?.amount ??
    transaction?.amount ??
    payment?.amount;

  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
