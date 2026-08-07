import { describe, expect, it } from "vitest";
import {
  aiLimitReachedMessage,
  auditLimitReachedMessage,
  isUnderQuota,
} from "@/lib/billing/quota";

describe("isUnderQuota", () => {
  it("treats a null limit as unlimited", () => {
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
    expect(isUnderQuota(2, 3)).toBe(true); // Free: 3rd audit still allowed
    expect(isUnderQuota(3, 3)).toBe(false); // Free: 4th audit blocked
    expect(isUnderQuota(29, 30)).toBe(true); // Pro: 30th audit allowed
    expect(isUnderQuota(30, 30)).toBe(false); // Pro: 31st audit blocked
    expect(isUnderQuota(10_000, null)).toBe(true); // Business: unlimited
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
