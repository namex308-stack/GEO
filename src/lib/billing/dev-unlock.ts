import type { PlanId } from "@/lib/billing/plans";

/**
 * Local tryout unlock — grants Business entitlements without Kashier payment.
 * Honored only outside production. Set NEXT_PUBLIC_DEV_UNLOCK_ALL=true in .env.local.
 */
export function isDevUnlockAll(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const flag =
    process.env.NEXT_PUBLIC_DEV_UNLOCK_ALL ?? process.env.DEV_UNLOCK_ALL ?? "";
  return flag === "1" || flag === "true";
}

export function resolveEffectivePlan(plan: PlanId | null | undefined): PlanId {
  if (isDevUnlockAll()) return "business";
  return plan ?? "free";
}
