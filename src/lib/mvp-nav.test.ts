import { describe, expect, it } from "vitest";
import { stepNumberFromSlug, isOnboardingGatedPath } from "@/lib/onboarding/constants";

describe("mvp navigation gates", () => {
  it("gates core product routes", () => {
    expect(isOnboardingGatedPath("/dashboard")).toBe(true);
    expect(isOnboardingGatedPath("/settings/usage")).toBe(true);
    expect(stepNumberFromSlug("business-name")).toBe(1);
  });

  it("does not treat removed watch paths as product features", () => {
    expect(isOnboardingGatedPath("/watch")).toBe(false);
  });
});
