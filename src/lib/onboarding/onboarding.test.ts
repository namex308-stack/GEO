import { describe, expect, it } from "vitest";
import {
  computeResumeStep,
  isOnboardingGatedPath,
  onboardingPathForStep,
  slugFromStepNumber,
  stepNumberFromSlug,
} from "@/lib/onboarding/constants";
import {
  normalizeStoreUrl,
  SaveOnboardingBodySchema,
  STEP_SCHEMAS,
} from "@/lib/onboarding/schema";

describe("onboarding paths", () => {
  it("maps step numbers to one-question slugs and paths", () => {
    expect(slugFromStepNumber(1)).toBe("business-name");
    expect(slugFromStepNumber(12)).toBe("competitor");
    expect(onboardingPathForStep(1)).toBe("/onboarding/business-name");
    expect(onboardingPathForStep(13)).toBe("/onboarding/done");
    expect(stepNumberFromSlug("challenge")).toBe(11);
  });

  it("gates app routes until onboarding is complete", () => {
    expect(isOnboardingGatedPath("/dashboard")).toBe(true);
    expect(isOnboardingGatedPath("/audit/new")).toBe(true);
    expect(isOnboardingGatedPath("/history")).toBe(true);
    expect(isOnboardingGatedPath("/settings/billing")).toBe(true);
    expect(isOnboardingGatedPath("/onboarding/business-name")).toBe(false);
    expect(isOnboardingGatedPath("/pricing")).toBe(false);
    expect(isOnboardingGatedPath("/watch")).toBe(false);
  });

  it("resumes at the first unanswered required step", () => {
    expect(computeResumeStep({})).toBe(1);
    expect(
      computeResumeStep({
        businessName: "Acme",
        storeUrl: "https://acme.com",
      })
    ).toBe(3);
    expect(
      computeResumeStep({
        businessName: "Acme",
        storeUrl: "https://acme.com",
        country: "EG",
        primaryLanguage: "en",
        platform: "shopify",
        storeSize: "small",
        businessCategory: "fashion",
        primaryGoal: "increase_conversions",
        monthlyTraffic: "1k_10k",
        monthlyOrders: "50_200",
        mainChallenge: "low_conversion",
      })
    ).toBe(12);
  });
});

describe("onboarding step validation", () => {
  it("accepts a valid business-name step payload", () => {
    const result = STEP_SCHEMAS["business-name"].safeParse({
      businessName: "GlowLab",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty required step", () => {
    const result = STEP_SCHEMAS["business-name"].safeParse({
      businessName: "",
    });
    expect(result.success).toBe(false);
  });

  it("allows empty competitor URL (optional)", () => {
    const result = STEP_SCHEMAS.competitor.safeParse({ competitorUrl: "" });
    expect(result.success).toBe(true);
  });

  it("parses save body and normalizes urls", () => {
    expect(normalizeStoreUrl("example.com")).toBe("https://example.com");
    const body = SaveOnboardingBodySchema.safeParse({
      step: 5,
      answers: { platform: "shopify" },
    });
    expect(body.success).toBe(true);
  });

  it("accepts store probe metadata in partial answers", () => {
    const body = SaveOnboardingBodySchema.safeParse({
      step: 2,
      answers: {
        storeUrl: "https://shop.example.com",
        storeDomain: "shop.example.com",
        homepageTitle: "Example Shop",
        platform: "shopify",
        platformConfidence: 0.95,
      },
    });
    expect(body.success).toBe(true);
  });
});
