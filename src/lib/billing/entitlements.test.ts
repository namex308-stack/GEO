import { describe, expect, it } from "vitest";
import {
  aiGeneratorLockedMessage,
  apiLockedMessage,
  canCreateStore,
  competitorLockedMessage,
  ENTITLEMENT_CODES,
  featureLockedBody,
  isPlanFeatureEnabled,
  storeLimitReachedBody,
  storeLimitReachedMessage,
} from "@/lib/billing/entitlements";
import type { PlanLimits } from "@/lib/dashboard/types";

const freePlan: PlanLimits = {
  planId: "free",
  displayName: "مجاني",
  auditsPerMonth: 3,
  aiGensPerMonth: 0,
  storesLimit: 1,
  features: { aiGenerator: false, competitor: false, api: false },
};

const proPlan: PlanLimits = {
  planId: "pro",
  displayName: "احترافي",
  auditsPerMonth: 30,
  aiGensPerMonth: 100,
  storesLimit: 3,
  features: { aiGenerator: true, competitor: true, api: false },
};

const businessPlan: PlanLimits = {
  planId: "business",
  displayName: "أعمال",
  auditsPerMonth: null,
  aiGensPerMonth: null,
  storesLimit: null,
  features: { aiGenerator: true, competitor: true, api: true },
};

describe("isPlanFeatureEnabled", () => {
  it("locks competitor / AI generator / API on Free", () => {
    expect(isPlanFeatureEnabled(freePlan, "competitor")).toBe(false);
    expect(isPlanFeatureEnabled(freePlan, "aiGenerator")).toBe(false);
    expect(isPlanFeatureEnabled(freePlan, "api")).toBe(false);
  });

  it("unlocks competitor and AI on Pro but not API", () => {
    expect(isPlanFeatureEnabled(proPlan, "competitor")).toBe(true);
    expect(isPlanFeatureEnabled(proPlan, "aiGenerator")).toBe(true);
    expect(isPlanFeatureEnabled(proPlan, "api")).toBe(false);
  });

  it("unlocks all features on Business", () => {
    expect(isPlanFeatureEnabled(businessPlan, "competitor")).toBe(true);
    expect(isPlanFeatureEnabled(businessPlan, "aiGenerator")).toBe(true);
    expect(isPlanFeatureEnabled(businessPlan, "api")).toBe(true);
  });
});

describe("canCreateStore", () => {
  it("enforces Free stores_limit of 1", () => {
    expect(canCreateStore(0, 1)).toBe(true);
    expect(canCreateStore(1, 1)).toBe(false);
  });

  it("enforces Pro stores_limit of 3", () => {
    expect(canCreateStore(2, 3)).toBe(true);
    expect(canCreateStore(3, 3)).toBe(false);
  });

  it("treats null storesLimit as unlimited (Business)", () => {
    expect(canCreateStore(0, null)).toBe(true);
    expect(canCreateStore(10_000, null)).toBe(true);
  });
});

describe("featureLockedBody", () => {
  it("returns deterministic COMPETITOR_LOCKED payload", () => {
    expect(featureLockedBody("competitor", "free")).toEqual({
      error: competitorLockedMessage(),
      code: ENTITLEMENT_CODES.COMPETITOR_LOCKED,
      plan: "free",
    });
  });

  it("returns deterministic AI_GENERATOR_LOCKED payload", () => {
    expect(featureLockedBody("aiGenerator", "free")).toEqual({
      error: aiGeneratorLockedMessage(),
      code: ENTITLEMENT_CODES.AI_GENERATOR_LOCKED,
      plan: "free",
    });
  });

  it("returns deterministic API_LOCKED payload for non-Business plans", () => {
    expect(featureLockedBody("api", "pro")).toEqual({
      error: apiLockedMessage(),
      code: ENTITLEMENT_CODES.API_LOCKED,
      plan: "pro",
    });
  });
});

describe("storeLimitReachedBody", () => {
  it("returns STORE_LIMIT_REACHED with used/limit for Free", () => {
    const body = storeLimitReachedBody(freePlan, 1);
    expect(body.code).toBe(ENTITLEMENT_CODES.STORE_LIMIT_REACHED);
    expect(body.plan).toBe("free");
    expect(body.used).toBe(1);
    expect(body.limit).toBe(1);
    expect(body.error).toBe(storeLimitReachedMessage("مجاني", 1, 1));
    expect(body.error).toContain("1/1");
  });
});
