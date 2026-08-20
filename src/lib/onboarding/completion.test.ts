import { describe, expect, it } from "vitest";
import {
  decideOnboardingSave,
  hasRequiredOnboardingFields,
  mergeOnboardingFields,
} from "@/lib/onboarding/completion";

const REQUIRED = {
  businessName: "GlowLab",
  storeUrl: "https://shop.example.com",
  country: "EG",
  platform: "shopify",
};

describe("hasRequiredOnboardingFields", () => {
  it("is false when any required field is missing", () => {
    expect(hasRequiredOnboardingFields({})).toBe(false);
    expect(hasRequiredOnboardingFields({ businessName: "x" })).toBe(false);
    expect(
      hasRequiredOnboardingFields({
        businessName: "GlowLab",
        storeUrl: "https://shop.example.com",
        country: "EG",
      })
    ).toBe(false);
  });

  it("is true when all required wizard fields are valid", () => {
    expect(hasRequiredOnboardingFields(REQUIRED)).toBe(true);
    expect(
      hasRequiredOnboardingFields({
        ...REQUIRED,
        storeUrl: "shop.example.com",
      })
    ).toBe(true);
  });

  it("rejects invalid enum / URL values even if present", () => {
    expect(
      hasRequiredOnboardingFields({ ...REQUIRED, country: "XX" })
    ).toBe(false);
    expect(
      hasRequiredOnboardingFields({ ...REQUIRED, platform: "not-a-platform" })
    ).toBe(false);
    expect(
      hasRequiredOnboardingFields({ ...REQUIRED, storeUrl: "ab" })
    ).toBe(false);
  });
});

describe("decideOnboardingSave", () => {
  it("rejects markComplete=true when required fields are missing", () => {
    const decision = decideOnboardingSave({
      existing: {},
      incoming: { businessName: "GlowLab" },
      step: 1,
      markComplete: true,
    });
    expect(decision).toEqual({
      action: "reject",
      code: "INCOMPLETE_REQUIRED_FIELDS",
    });
  });

  it("rejects step >= 5 when required fields are missing", () => {
    const decision = decideOnboardingSave({
      existing: { businessName: "GlowLab" },
      incoming: {},
      step: 5,
      skip: true,
    });
    expect(decision).toEqual({
      action: "reject",
      code: "INCOMPLETE_REQUIRED_FIELDS",
    });
  });

  it("completes when all required fields are valid on the last step", () => {
    const decision = decideOnboardingSave({
      existing: REQUIRED,
      incoming: { competitorUrl: "" },
      step: 5,
      skip: true,
      markComplete: true,
    });
    expect(decision).toEqual({ action: "save", complete: true });
  });

  it("completes on last step when required fields arrive in this payload", () => {
    const decision = decideOnboardingSave({
      existing: {},
      incoming: REQUIRED,
      step: 5,
      skip: true,
    });
    expect(decision).toEqual({ action: "save", complete: true });
  });

  it("saves partial progress without completing", () => {
    const step1 = decideOnboardingSave({
      existing: {},
      incoming: { businessName: "GlowLab" },
      step: 1,
    });
    expect(step1).toEqual({ action: "save", complete: false });

    const step4 = decideOnboardingSave({
      existing: {
        businessName: "GlowLab",
        storeUrl: "https://shop.example.com",
        country: "EG",
      },
      incoming: { platform: "shopify" },
      step: 4,
    });
    expect(step4).toEqual({ action: "save", complete: false });
  });

  it("ignores markComplete as a grant when fields are valid but the wizard is not finished", () => {
    const decision = decideOnboardingSave({
      existing: REQUIRED,
      incoming: {},
      step: 4,
      markComplete: true,
    });
    expect(decision).toEqual({ action: "save", complete: false });
  });

  it("merges incoming answers over existing profile", () => {
    expect(
      mergeOnboardingFields(
        { businessName: "Old", country: "SA" },
        { businessName: "New" }
      )
    ).toEqual({
      businessName: "New",
      storeUrl: "",
      country: "SA",
      platform: "",
      competitorUrl: "",
    });
  });
});
