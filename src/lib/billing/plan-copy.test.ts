import { describe, expect, it } from "vitest";
import {
  resolveBillingPaymentState,
  shouldShowBillingUpgradeCta,
  usageDescParams,
} from "@/lib/billing/plan-copy";
import { translate } from "@/lib/locale/t";

describe("usageDescParams", () => {
  it("passes through free plan display name for free users", () => {
    expect(usageDescParams(40, "مجاني")).toEqual({ pct: 40, plan: "مجاني" });
    const copy = translate("usage.usageDesc", usageDescParams(40, "مجاني"));
    expect(copy).toContain("40%");
    expect(copy).toContain("مجاني");
    expect(copy).not.toMatch(/باقتك المجانية/);
  });

  it("passes through Pro display name for Pro users", () => {
    expect(usageDescParams(7, "احترافي")).toEqual({ pct: 7, plan: "احترافي" });
    const copy = translate("usage.usageDesc", usageDescParams(7, "احترافي"));
    expect(copy).toContain("احترافي");
    expect(copy).not.toContain("المجانية");
  });
});

describe("resolveBillingPaymentState", () => {
  it("free user needs subscribe messaging", () => {
    expect(resolveBillingPaymentState("free")).toBe("free_needs_subscribe");
    expect(shouldShowBillingUpgradeCta("free")).toBe(true);
  });

  it("active Pro entitlement without a local card is paid_without_local_card", () => {
    expect(resolveBillingPaymentState("pro")).toBe("paid_without_local_card");
    expect(shouldShowBillingUpgradeCta("pro")).toBe(false);
  });

  it("active Business entitlement is treated as paid", () => {
    expect(resolveBillingPaymentState("business")).toBe("paid_without_local_card");
    expect(shouldShowBillingUpgradeCta("business")).toBe(false);
  });

  it("paid plan with a local payment method is paid_active", () => {
    expect(
      resolveBillingPaymentState("pro", { hasLocalPaymentMethod: true })
    ).toBe("paid_active");
  });

  it("missing/incorrect paid subscription surfaces as free via authoritative planId", () => {
    // getPlanForUser downgrades expired/missing subscriptions to free before UI sees them.
    expect(resolveBillingPaymentState("free")).toBe("free_needs_subscribe");
    expect(shouldShowBillingUpgradeCta("free")).toBe(true);
  });
});

describe("billing payment copy keys for plan states", () => {
  it("free subscribe copy mentions Pro subscription", () => {
    const desc = translate("billing.noPaymentDesc");
    expect(desc).toMatch(/احتراف/);
  });

  it("paid active / no-local-card copy does not tell Pro users to subscribe to Pro", () => {
    const paidDesc = translate("billing.paidNoPaymentDesc");
    expect(paidDesc).not.toMatch(/للاشتراك في الباقة الاحترافية/);
    expect(paidDesc.length).toBeGreaterThan(10);
    const manage = translate("billing.managePlan");
    expect(manage.length).toBeGreaterThan(2);
  });
});
