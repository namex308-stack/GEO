import { describe, expect, it } from "vitest";
import type { BillingPeriod, PlanId } from "@/lib/billing/plans";
import {
  BILLING_UPGRADE_PATH,
  POST_PAYMENT_PATH,
  assertNoUpgradeLoop,
  buildCheckoutPath,
  buildPostPaymentPath,
  isBillingUpgradePath,
  resolvePlanSelectionPath,
} from "@/lib/billing/upgrade-flow";

const PERIODS: BillingPeriod[] = ["monthly", "yearly"];
const ALL_PLANS: PlanId[] = ["free", "pro", "business"];

describe("upgrade flow — no pricing ↔ billing loop", () => {
  it("dashboard Upgrade entry stays on /pricing (not billing)", () => {
    // Documented contract: Upgrade CTA → /pricing
    expect("/pricing").not.toBe(BILLING_UPGRADE_PATH);
    expect(isBillingUpgradePath("/pricing")).toBe(false);
  });

  it.each(ALL_PLANS)(
    "selecting %s never redirects to billing/upgrade",
    (planId) => {
      for (const period of PERIODS) {
        for (const authenticated of [true, false]) {
          const path = resolvePlanSelectionPath(planId, period, authenticated);
          expect(isBillingUpgradePath(path)).toBe(false);
          expect(() => assertNoUpgradeLoop(path)).not.toThrow();
          expect(path.includes(BILLING_UPGRADE_PATH)).toBe(false);
        }
      }
    }
  );

  it("Free → audit/new (or auth preserving that path), never checkout loop", () => {
    expect(resolvePlanSelectionPath("free", "monthly", true)).toBe("/audit/new");
    expect(resolvePlanSelectionPath("free", "yearly", false)).toBe(
      `/auth?next=${encodeURIComponent("/audit/new")}`
    );
  });

  it.each(["pro", "business"] as const)(
    "%s selection starts checkout immediately when authenticated",
    (planId) => {
      for (const period of PERIODS) {
        const path = resolvePlanSelectionPath(planId, period, true);
        expect(path).toBe(buildCheckoutPath(planId, period));
        expect(path.startsWith("/checkout?")).toBe(true);
        expect(path).toContain(`plan=${planId}`);
        expect(path).toContain(`period=${period}`);
      }
    }
  );

  it.each(["pro", "business"] as const)(
    "%s selection preserves checkout query through auth when unauthenticated",
    (planId) => {
      const path = resolvePlanSelectionPath(planId, "monthly", false);
      expect(path.startsWith("/auth?next=")).toBe(true);
      const next = decodeURIComponent(path.split("next=")[1]!);
      expect(next).toBe(buildCheckoutPath(planId, "monthly"));
      expect(isBillingUpgradePath(next)).toBe(false);
    }
  );

  it("post-payment success lands on dashboard with plan activated query", () => {
    for (const planId of ["pro", "business"] as const) {
      const path = buildPostPaymentPath(planId, { orderId: "ord_1" });
      expect(path.startsWith(`${POST_PAYMENT_PATH}?`)).toBe(true);
      expect(path).toContain(`upgraded=${planId}`);
      expect(path).toContain("orderId=ord_1");
      expect(isBillingUpgradePath(path)).toBe(false);
      expect(() => assertNoUpgradeLoop(path)).not.toThrow();
    }
  });

  it("post-payment absolute URLs never point at billing", () => {
    const url = buildPostPaymentPath("pro", {
      orderId: "x",
      appUrl: "https://app.example.com",
    });
    expect(url).toBe(
      "https://app.example.com/dashboard?upgraded=pro&orderId=x"
    );
    expect(isBillingUpgradePath(url)).toBe(false);
  });

  it("assertNoUpgradeLoop rejects the historical billing bounce", () => {
    expect(() =>
      assertNoUpgradeLoop(`${BILLING_UPGRADE_PATH}?upgraded=pro`)
    ).toThrow(/Upgrade navigation loop/);
    expect(() => assertNoUpgradeLoop("/dashboard?upgraded=pro")).not.toThrow();
  });

  it("cannot form a closed loop: plan select → post-payment → plan select", () => {
    // Simulates: Upgrade → pricing CTA → checkout success → dashboard
    // then selecting a plan again must still not return to billing.
    for (const planId of ["pro", "business"] as const) {
      const afterSelect = resolvePlanSelectionPath(planId, "monthly", true);
      const afterPay = buildPostPaymentPath(planId);
      expect(isBillingUpgradePath(afterSelect)).toBe(false);
      expect(isBillingUpgradePath(afterPay)).toBe(false);
      // Success page is dashboard, which links Upgrade → /pricing (not billing)
      expect(afterPay.startsWith(POST_PAYMENT_PATH)).toBe(true);
    }
  });
});
