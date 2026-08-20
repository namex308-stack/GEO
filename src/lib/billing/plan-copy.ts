/**
 * Pure helpers for billing/usage merchant-facing copy selection.
 * Uses authoritative planId from getPlanForUser / /api/usage — no hardcoded plan names in UI.
 */

import type { PlanId } from "@/lib/db/types";

export type BillingPaymentState =
  | "free_needs_subscribe"
  | "paid_active"
  | "paid_without_local_card";

/**
 * Decide payment-method messaging from the authoritative plan entitlement.
 * Paid plans (pro/business) come from getPlanForUser only while subscription is active.
 */
export function resolveBillingPaymentState(
  planId: PlanId,
  options?: { hasLocalPaymentMethod?: boolean }
): BillingPaymentState {
  if (planId === "free") return "free_needs_subscribe";
  if (options?.hasLocalPaymentMethod) return "paid_active";
  return "paid_without_local_card";
}

/** Params for usage.usageDesc — plan label must come from API displayName. */
export function usageDescParams(
  pct: number,
  planDisplayName: string
): { pct: number; plan: string } {
  return {
    pct,
    plan: planDisplayName.trim() || "—",
  };
}

/** Whether billing should show the free-plan upgrade CTA in the plan header. */
export function shouldShowBillingUpgradeCta(planId: PlanId): boolean {
  return planId === "free";
}
