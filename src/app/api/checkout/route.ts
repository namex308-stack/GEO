import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildOrderId,
  createCheckoutUrl,
  getCheckoutEnvironmentError,
  getKashierMode,
  isKashierConfigured,
} from "@/lib/kashier";
import { getAuthUser } from "@/lib/auth/get-user";
import { getCheckoutPrice } from "@/lib/billing/plans";
import { activateSubscription } from "@/lib/billing/activate-subscription";
import { buildPostPaymentPath } from "@/lib/billing/upgrade-flow";
import {
  getKashierAllowedMethod,
  isKashierPaymentMethodId,
  type KashierPaymentMethodId,
} from "@/lib/kashier/methods";

const Body = z.object({
  planId: z.enum(["pro", "business"]),
  period: z.enum(["monthly", "yearly"]),
  paymentMethod: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      console.warn("[api/checkout] invalid request body");
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const user = await getAuthUser();
    if (!user) {
      console.warn("[api/checkout] unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, period, paymentMethod: methodId } = parsed.data;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const amount = getCheckoutPrice(planId, period);
    const orderId = buildOrderId(user.id, planId, period);

    console.info("[api/checkout] start", {
      userId: user.id,
      planId,
      period,
      amount,
      orderId,
      appUrl,
      kashierMode: getKashierMode(),
      methodId: methodId ?? null,
      configured: isKashierConfigured(),
    });

    if (!isKashierConfigured()) {
      // NODE_ENV !== "production" is required in addition to the mode checks below
      // so a stray KASHIER_MODE=test left set in a production environment can never
      // auto-activate a paid plan without payment.
      const allowDemo =
        process.env.NODE_ENV !== "production" &&
        (process.env.NODE_ENV === "development" || process.env.KASHIER_MODE === "test");
      if (allowDemo) {
        console.info("[api/checkout] demo mode activation", { userId: user.id, orderId, planId });
        const demo = await activateSubscription(user.id, planId, period, orderId);
        if (!demo.activated) {
          console.error("[api/checkout] demo activation failed", { orderId });
          return NextResponse.json({ error: "Could not activate demo plan" }, { status: 500 });
        }
        return NextResponse.json({
          url: buildPostPaymentPath(planId, { orderId, appUrl }),
          demoMode: true,
          message: "Kashier not configured — plan activated in demo mode.",
        });
      }
      return NextResponse.json(
        {
          error: "Payment gateway is not configured. Add KASHIER_MERCHANT_ID and KASHIER_API_KEY.",
        },
        { status: 503 }
      );
    }

    const envError = getCheckoutEnvironmentError(appUrl);
    if (envError) {
      console.error("[api/checkout] environment blocked checkout:", envError);
      return NextResponse.json({ error: envError }, { status: 503 });
    }

    if (methodId && !isKashierPaymentMethodId(methodId)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    const kashierMethod = methodId
      ? getKashierAllowedMethod(methodId as KashierPaymentMethodId)
      : undefined;
    // Canonical webhook path (HMAC + amount map 199→pro / 499→business)
    const callbackUrl = `${appUrl.replace(/\/$/, "")}/api/webhook/kashier`;
    const successUrl = buildPostPaymentPath(planId, { orderId, appUrl });
    const failureUrl = `${appUrl.replace(/\/$/, "")}/checkout?plan=${planId}&period=${period}&error=payment_failed`;

    console.info("[api/checkout] creating Kashier URL", {
      orderId,
      callbackUrl,
      webhookUrl: callbackUrl,
      failureUrl,
      successUrl,
    });

    const url = await createCheckoutUrl({
      orderId,
      amount, // pro: 199/1490 · business: 499/3990 (from PLAN_PRICES)
      currency: "EGP",
      customerEmail: user.email ?? "",
      customerName: user.user_metadata?.full_name as string | undefined,
      customerReference: user.id,
      planId,
      period,
      successUrl,
      failureUrl,
      callbackUrl,
      webhookUrl: callbackUrl,
      paymentMethod: kashierMethod,
    });

    if (!url) {
      console.error("[api/checkout] createCheckoutUrl returned null", { orderId });
      return NextResponse.json({ error: "Could not create checkout" }, { status: 500 });
    }

    console.info("[api/checkout] checkout URL ready", {
      orderId,
      amount,
      currency: "EGP",
      urlHost: (() => {
        try {
          return new URL(url).host;
        } catch {
          return "invalid";
        }
      })(),
    });

    return NextResponse.json({ url, orderId, configured: true, amount, currency: "EGP" });
  } catch (err) {
    console.error("[api/checkout] error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
