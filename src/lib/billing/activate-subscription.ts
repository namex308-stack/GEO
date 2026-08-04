import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import type { PlanId } from "@/lib/billing/plans";
import { ensurePersonalWorkspace } from "@/lib/db/audit-repository";

type Plan = PlanId;

/**
 * Activate a paid plan after Kashier payment (or demo checkout).
 * Idempotent on orderId. Updates workspace.plan_id + subscriptions.
 * Fail-closed when writes fail.
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

  const workspaceId = await ensurePersonalWorkspace(userId);
  if (!workspaceId) {
    console.error("[billing] no workspace for user", { userId, orderId });
    return { activated: false, alreadyProcessed: false };
  }

  // Idempotency: same Kashier order already applied
  const { data: byOrder, error: byOrderError } = await sb
    .from("subscriptions")
    .select("id, status, workspace_id")
    .eq("kashier_subscription_id", orderId)
    .maybeSingle();

  if (byOrderError) {
    console.error("[billing] idempotency lookup failed:", byOrderError.message, { orderId });
    return { activated: false, alreadyProcessed: false };
  }

  if (byOrder?.id && byOrder.status === "active") {
    const wsId = (byOrder.workspace_id as string) || workspaceId;
    const { error: syncError } = await sb
      .from("workspaces")
      .update({ plan_id: planId, updated_at: new Date().toISOString() })
      .eq("id", wsId);
    if (syncError) {
      console.error("[billing] workspace sync on replay failed:", syncError.message, {
        userId,
        orderId,
      });
      return { activated: false, alreadyProcessed: true };
    }

    await sb.from("billing_events").insert({
      workspace_id: wsId,
      provider: "kashier",
      event_type: "subscription.activated.replay",
      external_id: orderId,
      payload: { planId, period, userId },
      processed_at: new Date().toISOString(),
    });

    console.info("[billing] activateSubscription already processed", { userId, orderId, planId });
    return { activated: true, alreadyProcessed: true };
  }

  const periodDays = period === "yearly" ? 365 : 30;
  const now = new Date();
  const end = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

  const { error: wsError } = await sb
    .from("workspaces")
    .update({ plan_id: planId, updated_at: now.toISOString() })
    .eq("id", workspaceId);

  if (wsError) {
    console.error("[billing] workspace plan update failed:", wsError.message, {
      userId,
      planId,
      orderId,
    });
    return { activated: false, alreadyProcessed: false };
  }

  const { data: existing, error: existingError } = await sb
    .from("subscriptions")
    .select("id")
    .eq("workspace_id", workspaceId)
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

  const row = {
    workspace_id: workspaceId,
    plan_id: planId,
    status: "active" as const,
    kashier_subscription_id: orderId,
    billing_period: period,
    current_period_start: now.toISOString(),
    current_period_end: end.toISOString(),
    updated_at: now.toISOString(),
  };

  if (existing?.id) {
    const { error } = await sb.from("subscriptions").update(row).eq("id", existing.id);
    if (error) {
      console.error("[billing] subscription update failed:", error.message, {
        userId,
        orderId,
        subscriptionId: existing.id,
      });
      return { activated: false, alreadyProcessed: false };
    }
  } else {
    const { error } = await sb.from("subscriptions").insert(row);
    if (error) {
      console.error("[billing] subscription insert failed:", error.message, { userId, orderId });
      return { activated: false, alreadyProcessed: false };
    }
  }

  await sb.from("billing_events").insert({
    workspace_id: workspaceId,
    provider: "kashier",
    event_type: "subscription.activated",
    external_id: orderId,
    payload: { planId, period, userId },
    processed_at: now.toISOString(),
  });

  console.info("[billing] activateSubscription success", {
    userId,
    workspaceId,
    planId,
    period,
    orderId,
    currentPeriodEnd: end.toISOString(),
  });
  return { activated: true, alreadyProcessed: false };
}
