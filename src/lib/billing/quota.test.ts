import { describe, expect, it } from "vitest";
import {
  aiLimitReachedMessage,
  auditLimitReachedMessage,
  isUnderQuota,
} from "@/lib/billing/quota";
import { PLAN_LIMITS } from "@/lib/billing/plans";

describe("isUnderQuota", () => {
  it("treats a null limit as unlimited (legacy)", () => {
    expect(isUnderQuota(0, null)).toBe(true);
    expect(isUnderQuota(10_000, null)).toBe(true);
  });

  it("allows usage strictly below the limit", () => {
    expect(isUnderQuota(0, 3)).toBe(true);
    expect(isUnderQuota(2, 3)).toBe(true);
  });

  it("blocks usage at or above the limit", () => {
    expect(isUnderQuota(3, 3)).toBe(false);
    expect(isUnderQuota(4, 3)).toBe(false);
  });

  it("matches Free/Pro/Business plan boundaries", () => {
    const { free, pro, business } = PLAN_LIMITS;
    expect(isUnderQuota(free.auditsPerMonth - 1, free.auditsPerMonth)).toBe(true);
    expect(isUnderQuota(free.auditsPerMonth, free.auditsPerMonth)).toBe(false);
    expect(isUnderQuota(pro.auditsPerMonth - 1, pro.auditsPerMonth)).toBe(true);
    expect(isUnderQuota(pro.auditsPerMonth, pro.auditsPerMonth)).toBe(false);
    expect(isUnderQuota(business.auditsPerMonth - 1, business.auditsPerMonth)).toBe(true);
    expect(isUnderQuota(business.auditsPerMonth, business.auditsPerMonth)).toBe(false);

    expect(isUnderQuota(pro.aiGensPerMonth - 1, pro.aiGensPerMonth)).toBe(true);
    expect(isUnderQuota(pro.aiGensPerMonth, pro.aiGensPerMonth)).toBe(false);
    expect(isUnderQuota(business.aiGensPerMonth - 1, business.aiGensPerMonth)).toBe(true);
    expect(isUnderQuota(business.aiGensPerMonth, business.aiGensPerMonth)).toBe(false);
  });
});

describe("auditLimitReachedMessage", () => {
  it("returns an Arabic message including the plan name and usage", () => {
    const message = auditLimitReachedMessage("مجاني", 3, 3);
    expect(message).toContain("مجاني");
    expect(message).toContain("3/3");
  });
});

describe("aiLimitReachedMessage", () => {
  it("returns an Arabic message including the plan name and usage", () => {
    const message = aiLimitReachedMessage("احترافي", 100, 100);
    expect(message).toContain("احترافي");
    expect(message).toContain("100/100");
  });
});
