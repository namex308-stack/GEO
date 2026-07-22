import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import type { PlanId } from "@/lib/billing/plans";

type Plan = PlanId;

/**
 * Activate a paid plan after Kashier payment (or demo checkout).
 * Idempotent on orderId — replaying the same webhook/redirect is a no-op.
 * Keeps profiles.plan and subscriptions in lockstep.
 * Fail-closed: returns activated=false when profile or subscription writes fail.
 */
export async function activateSubscription(
  userId: string,
  planId: Plan,
  period: "monthly" | "yearly",
  orderId: string
): Promise<{ activated: boolean; alreadyProcessed: boolean }> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    console.error("[billing] activateSubscription: Supabase admin unavailable", {
      userId,
      orderId,
      planId,
    });
    return { activated: false, alreadyProcessed: false };
  }

  console.info("[billing] activateSubscription start", { userId, planId, period, orderId });

  // Idempotency: same Kashier order already applied
  const { data: byOrder, error: byOrderError } = await sb
    .from("subscriptions")
    .select("id, status")
    .eq("kashier_subscription_id", orderId)
    .maybeSingle();

  if (byOrderError) {
    console.error("[billing] idempotency lookup failed:", byOrderError.message, { orderId });
    return { activated: false, alreadyProcessed: false };
  }

  if (byOrder?.id && byOrder.status === "active") {
    const { error: profileSyncError } = await sb
      .from("profiles")
      .update({ plan: planId, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (profileSyncError) {
      console.error("[billing] profile sync on replay failed:", profileSyncError.message, {
        userId,
        orderId,
      });
      return { activated: false, alreadyProcessed: true };
    }
    console.info("[billing] activateSubscription already processed", { userId, orderId, planId });
    return { activated: true, alreadyProcessed: true };
  }

  const periodDays = period === "yearly" ? 365 : 30;
  const now = new Date();
  const end = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

  const { error: profileError } = await sb
    .from("profiles")
    .update({ plan: planId, updated_at: now.toISOString() })
    .eq("id", userId);

  if (profileError) {
    console.error("[billing] profile plan update failed:", profileError.message, {
      userId,
      planId,
      orderId,
    });
    return { activated: false, alreadyProcessed: false };
  }

  const { data: existing, error: existingError } = await sb
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error("[billing] existing subscription lookup failed:", existingError.message, {
      userId,
      orderId,
    });
    return { activated: false, alreadyProcessed: false };
  }

  const baseRow = {
    user_id: userId,
    plan_id: planId,
    status: "active" as const,
    kashier_subscription_id: orderId,
    current_period_start: now.toISOString(),
    current_period_end: end.toISOString(),
  };

  const withPeriod = { ...baseRow, billing_period: period };

  if (existing?.id) {
    let { error } = await sb.from("subscriptions").update(withPeriod).eq("id", existing.id);
    if (error?.message?.includes("billing_period")) {
      ({ error } = await sb.from("subscriptions").update(baseRow).eq("id", existing.id));
    }
    if (error) {
      console.error("[billing] subscription update failed:", error.message, {
        userId,
        orderId,
        subscriptionId: existing.id,
      });
      return { activated: false, alreadyProcessed: false };
    }
  } else {
    let { error } = await sb.from("subscriptions").insert(withPeriod);
    if (error?.message?.includes("billing_period")) {
      ({ error } = await sb.from("subscriptions").insert(baseRow));
    }
    if (error) {
      console.error("[billing] subscription insert failed:", error.message, { userId, orderId });
      return { activated: false, alreadyProcessed: false };
    }
  }

  console.info("[billing] activateSubscription success", {
    userId,
    planId,
    period,
    orderId,
    currentPeriodEnd: end.toISOString(),
  });
  return { activated: true, alreadyProcessed: false };
}
