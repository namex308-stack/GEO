import { NextRequest, NextResponse } from "next/server";
import {
  extractAmount,
  extractOrderId,
  isPaymentSuccessful,
  parseOrderId,
  verifyWebhookSignature,
} from "@/lib/kashier";
import { mapAmountToPlan, type BillingPeriod, type PlanId } from "@/lib/billing/plans";
import { buildPostPaymentPath } from "@/lib/billing/upgrade-flow";
import { getSupabaseAdmin } from "@/lib/supabase";
import { activateSubscription } from "@/lib/billing/activate-subscription";

type PaidPlan = Exclude<PlanId, "free">;

async function handlePaymentSuccess(
  orderId: string,
  amount: number | null,
  source: "webhook_post" | "redirect_get"
): Promise<boolean> {
  console.info("[webhook/kashier] handlePaymentSuccess start", {
    source,
    orderId,
    amount,
  });

  const fromOrder = parseOrderId(orderId);
  const fromAmount = amount != null ? mapAmountToPlan(amount) : null;

  // Prefer orderId plan; fall back / validate with amount map (199→pro, 499→business).
  let plan: PaidPlan | null = fromOrder?.plan ?? fromAmount?.plan ?? null;
  let period: BillingPeriod | null = fromOrder?.period ?? fromAmount?.period ?? null;
  const userId = fromOrder?.userId ?? null;

  if (fromOrder && fromAmount && fromOrder.plan !== fromAmount.plan) {
    console.warn("[webhook/kashier] amount/plan mismatch — using amount map:", {
      orderId,
      amount,
      orderPlan: fromOrder.plan,
      amountPlan: fromAmount.plan,
    });
    plan = fromAmount.plan;
    period = fromAmount.period;
  }

  if (!plan || !period || !userId) {
    console.error("[webhook/kashier] cannot resolve plan/user:", {
      orderId,
      amount,
      fromOrder,
      fromAmount,
      source,
    });
    return false;
  }

  const sb = getSupabaseAdmin();
  if (!sb) {
    console.error("[webhook/kashier] Supabase admin client unavailable", {
      orderId,
      userId,
      source,
    });
    return false;
  }

  const { data: profile, error: profileLookupError } = await sb
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (profileLookupError) {
    console.error("[webhook/kashier] profile lookup failed:", {
      userId,
      error: profileLookupError.message,
      source,
    });
    return false;
  }

  if (!profile) {
    console.error("[webhook/kashier] user not found:", userId);
    return false;
  }

  const result = await activateSubscription(profile.id, plan, period, orderId);
  console.info("[webhook/kashier] activateSubscription result", {
    source,
    orderId,
    userId,
    plan,
    period,
    activated: result.activated,
    alreadyProcessed: result.alreadyProcessed,
  });
  if (result.alreadyProcessed) {
    console.info("[webhook/kashier] order already processed:", orderId);
  }
  return result.activated;
}

/** Kashier server-to-server webhook — HMAC verify, update subscriptions. */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-kashier-signature") ?? "";

    console.info("[webhook/kashier] POST received", {
      bodyBytes: rawBody.length,
      hasSignature: !!signature,
    });

    // Prefer KASHIER_WEBHOOK_SECRET, then KASHIER_SECRET_KEY (docs), then API key (compat).
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error("[webhook/kashier] invalid signature — HMAC verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.info("[webhook/kashier] HMAC verification passed");

    const event = JSON.parse(rawBody) as Record<string, unknown>;
    const success = isPaymentSuccessful(event);
    const orderId = extractOrderId(event);
    const amount = extractAmount(event);

    console.info("[webhook/kashier] POST payload parsed", {
      success,
      orderId: orderId || null,
      amount,
      topLevelKeys: Object.keys(event),
    });

    if (success) {
      if (!orderId) {
        console.error(
          "[webhook/kashier] payment success but orderId missing — refusing ACK",
          { amount, topLevelKeys: Object.keys(event) }
        );
        // Let Kashier retry; do not silently acknowledge a payment we cannot apply.
        return NextResponse.json(
          { error: "Missing orderId on successful payment" },
          { status: 422 }
        );
      }

      const activated = await handlePaymentSuccess(orderId, amount, "webhook_post");
      if (!activated) {
        return NextResponse.json({ error: "Activation failed" }, { status: 502 });
      }
      console.info("[webhook/kashier] POST activation complete", { orderId });
    } else {
      console.info("[webhook/kashier] POST non-success status — no activation", {
        orderId: orderId || null,
        amount,
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook/kashier] error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

/** Kashier redirect callback (browser return after payment). */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const payload = Object.fromEntries(searchParams.entries()) as Record<string, unknown>;
    const orderId = extractOrderId(payload);
    const amount = extractAmount(payload);
    const success = isPaymentSuccessful(payload);

    console.info("[webhook/kashier] GET redirect callback", {
      success,
      orderId: orderId || null,
      amount,
      queryKeys: [...searchParams.keys()],
    });

    // HPP / Sessions merchantRedirect still activates here for backward compatibility
    // when serverWebhook is delayed or unavailable. Prefer signed POST for entitlement.
    if (orderId && success) {
      const activated = await handlePaymentSuccess(orderId, amount, "redirect_get");
      if (!activated) {
        console.error("[webhook/kashier] GET activation failed", { orderId, amount });
      }
    } else if (success && !orderId) {
      console.error("[webhook/kashier] GET success without orderId — cannot activate");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const parsed = orderId ? parseOrderId(orderId) : null;
    const fromAmount = amount != null ? mapAmountToPlan(amount) : null;
    const plan = parsed?.plan ?? fromAmount?.plan ?? "pro";

    if (success) {
      const dest = buildPostPaymentPath(plan, {
        orderId: orderId || undefined,
        appUrl,
      });
      console.info("[webhook/kashier] redirecting to success", { dest, plan });
      return NextResponse.redirect(dest);
    }

    const failureDest = `${appUrl}/checkout?error=payment_failed`;
    console.info("[webhook/kashier] redirecting to failure", { failureDest });
    return NextResponse.redirect(failureDest);
  } catch (err) {
    console.error("[webhook/kashier] GET callback error:", err);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/checkout?error=payment_failed`);
  }
}
