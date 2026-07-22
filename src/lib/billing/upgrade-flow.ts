import type { BillingPeriod, PlanId } from "@/lib/billing/plans";

/** Where paid checkout completes ? never billing/upgrade, which re-links to /pricing. */
export const POST_PAYMENT_PATH = "/dashboard";

/** Billing settings (legacy ?upgrade? surface with Upgrade ? /pricing CTA). */
export const BILLING_UPGRADE_PATH = "/settings/billing";

const PAID_PLANS = ["pro", "business"] as const;
type PaidPlanId = (typeof PAID_PLANS)[number];

export function isPaidPlanId(planId: string): planId is PaidPlanId {
  return (PAID_PLANS as readonly string[]).includes(planId);
}

/** Checkout entry for a paid plan. */
export function buildCheckoutPath(
  planId: PaidPlanId,
  period: BillingPeriod = "monthly"
): string {
  const params = new URLSearchParams({ plan: planId, period });
  return `/checkout?${params.toString()}`;
}

/**
 * Destination after Kashier success / demo activation.
 * Always dashboard so users are not sent back to billing?s Upgrade button.
 */
export function buildPostPaymentPath(
  planId: PaidPlanId,
  options?: { orderId?: string; appUrl?: string }
): string {
  const params = new URLSearchParams({ upgraded: planId });
  if (options?.orderId) {
    params.set("orderId", options.orderId);
  }
  const path = `${POST_PAYMENT_PATH}?${params.toString()}`;
  return options?.appUrl ? `${options.appUrl.replace(/\/$/, "")}${path}` : path;
}

/**
 * Where a pricing CTA should navigate. Never returns billing/upgrade.
 * Free ? product entry; Pro/Business ? checkout (or login preserving checkout query).
 */
export function resolvePlanSelectionPath(
  planId: PlanId,
  period: BillingPeriod,
  authenticated: boolean
): string {
  if (planId === "free") {
    if (authenticated) return "/audit/new";
    return `/login?redirect=${encodeURIComponent("/audit/new")}`;
  }

  const checkout = buildCheckoutPath(planId, period);
  if (!authenticated) {
    return `/login?redirect=${encodeURIComponent(checkout)}`;
  }
  return checkout;
}

/** True if a path is the billing page that closes the pricing ? upgrade loop. */
export function isBillingUpgradePath(path: string): boolean {
  try {
    const url = path.startsWith("http") ? new URL(path) : new URL(path, "http://local");
    return (
      url.pathname === BILLING_UPGRADE_PATH ||
      url.pathname.startsWith(`${BILLING_UPGRADE_PATH}/`)
    );
  } catch {
    return (
      path === BILLING_UPGRADE_PATH ||
      path.startsWith(`${BILLING_UPGRADE_PATH}?`) ||
      path.startsWith(`${BILLING_UPGRADE_PATH}/`)
    );
  }
}

/**
 * Guard used by tests and callers: plan selection and post-payment
 * destinations must never land on billing (the Upgrade surface).
 */
export function assertNoUpgradeLoop(path: string): void {
  if (isBillingUpgradePath(path)) {
    throw new Error(
      `Upgrade navigation loop: destination must not be ${BILLING_UPGRADE_PATH} (got ${path})`
    );
  }
}
