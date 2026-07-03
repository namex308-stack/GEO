import "server-only";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";

let _client: Paddle | null = null;

export function isPaddleConfigured(): boolean {
  return !!(
    process.env.PADDLE_VENDOR_ID &&
    process.env.PADDLE_VENDOR_AUTH_CODE &&
    process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
  );
}

/**
 * Server-side Paddle SDK client.
 * Returns null if not configured.
 */
export function getPaddle(): Paddle | null {
  const apiKey = process.env.PADDLE_VENDOR_AUTH_CODE;
  if (!apiKey) return null;
  if (!_client) {
    const env = process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox" ? Environment.sandbox : Environment.production;
    _client = new Paddle(apiKey, { environment: env });
  }
  return _client;
}

export interface CheckoutOptions {
  planId: "pro" | "business";
  period: "monthly" | "yearly";
  customerId?: string;
  customerEmail?: string;
  successUrl?: string;
}

export const PADDLE_PRICES: Record<string, { monthly: string; yearly: string }> = {
  // Replace these price IDs with your real Paddle price IDs once configured.
  // These placeholders let the flow run end-to-end in demo mode.
  pro: {
    monthly: "pri_demo_pro_monthly",
    yearly: "pri_demo_pro_yearly",
  },
  business: {
    monthly: "pri_demo_business_monthly",
    yearly: "pri_demo_business_yearly",
  },
};

/**
 * Create a Paddle checkout transaction.
 * Returns a checkout URL the client can redirect to.
 * In demo mode (no Paddle), returns a mock success object.
 */
export async function createCheckout(opts: CheckoutOptions) {
  const client = getPaddle();
  const prices = PADDLE_PRICES[opts.planId];
  const priceId = prices[opts.period];

  if (!client) {
    // Demo mode
    return {
      demo: true,
      url: null,
      priceId,
      message: "Paddle not configured — running in demo mode.",
    };
  }

  try {
    const transaction = await client.transactions.create({
      items: [{ priceId, quantity: 1 }],
      ...(opts.customerEmail ? { customer: { email: opts.customerEmail } } : {}),
      checkout: {
        url: opts.successUrl ? `${opts.successUrl}?status=success` : undefined,
      },
    });

    return {
      demo: false,
      id: transaction.id,
      url: (transaction as any).checkout?.url,
      priceId,
    };
  } catch (err) {
    console.error("[paddle] checkout error:", err);
    return {
      demo: true,
      url: null,
      priceId,
      message: "Paddle checkout failed — demo mode.",
    };
  }
}
