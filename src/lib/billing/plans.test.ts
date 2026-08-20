import { describe, expect, it } from "vitest";
import {
  getCheckoutPrice,
  mapAmountToPlan,
  MARKETING_PLANS,
  PLAN_LIMITS,
  PLAN_PRICES,
  yearlySavingsEgp,
} from "@/lib/billing/plans";

describe("PLAN_PRICES / checkout", () => {
  it("uses the rebuilt Pro and Business EGP amounts", () => {
    expect(PLAN_PRICES.pro).toEqual({ monthly: 399, yearly: 3990 });
    expect(PLAN_PRICES.business).toEqual({ monthly: 999, yearly: 9990 });
  });

  it("returns checkout prices from the authoritative map only", () => {
    expect(getCheckoutPrice("pro", "monthly")).toBe(399);
    expect(getCheckoutPrice("pro", "yearly")).toBe(3990);
    expect(getCheckoutPrice("business", "monthly")).toBe(999);
    expect(getCheckoutPrice("business", "yearly")).toBe(9990);
  });

  it("maps Kashier paid amounts to plan + period", () => {
    expect(mapAmountToPlan(399)).toEqual({ plan: "pro", period: "monthly" });
    expect(mapAmountToPlan(3990)).toEqual({ plan: "pro", period: "yearly" });
    expect(mapAmountToPlan(999)).toEqual({ plan: "business", period: "monthly" });
    expect(mapAmountToPlan(9990)).toEqual({ plan: "business", period: "yearly" });
    expect(mapAmountToPlan(199)).toBeNull();
    expect(mapAmountToPlan(499)).toBeNull();
    expect(mapAmountToPlan(1490)).toBeNull();
  });

  it("rejects client-looking mismatched amounts", () => {
    expect(mapAmountToPlan(398)).toBeNull();
    expect(mapAmountToPlan(1000)).toBeNull();
  });
});

describe("yearly savings", () => {
  it("is mathematically exact vs 12× monthly", () => {
    expect(yearlySavingsEgp("pro")).toBe(399 * 12 - 3990);
    expect(yearlySavingsEgp("business")).toBe(999 * 12 - 9990);
    expect(yearlySavingsEgp("pro")).toBe(798);
    expect(yearlySavingsEgp("business")).toBe(1998);
  });
});

describe("PLAN_LIMITS", () => {
  it("enforces finite Free / Pro / Business quotas", () => {
    expect(PLAN_LIMITS.free).toEqual({
      auditsPerMonth: 3,
      aiGensPerMonth: 0,
      storesLimit: 1,
    });
    expect(PLAN_LIMITS.pro).toEqual({
      auditsPerMonth: 50,
      aiGensPerMonth: 100,
      storesLimit: 5,
    });
    expect(PLAN_LIMITS.business).toEqual({
      auditsPerMonth: 200,
      aiGensPerMonth: 400,
      storesLimit: 15,
    });
  });
});

describe("MARKETING_PLANS", () => {
  it("mirrors PLAN_PRICES for paid plans and zero for Free", () => {
    const free = MARKETING_PLANS.find((p) => p.id === "free");
    const pro = MARKETING_PLANS.find((p) => p.id === "pro");
    const business = MARKETING_PLANS.find((p) => p.id === "business");
    expect(free?.monthlyPrice).toBe(0);
    expect(pro?.monthlyPrice).toBe(PLAN_PRICES.pro.monthly);
    expect(pro?.yearlyPrice).toBe(PLAN_PRICES.pro.yearly);
    expect(business?.monthlyPrice).toBe(PLAN_PRICES.business.monthly);
    expect(business?.yearlyPrice).toBe(PLAN_PRICES.business.yearly);
    expect(pro?.highlight).toBe(true);
  });
});
