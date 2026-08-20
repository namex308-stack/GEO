import { describe, expect, it, vi, afterEach } from "vitest";
import {
  getGoogleSiteVerification,
  googleSiteVerificationMetadata,
} from "@/lib/seo/google-site-verification";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getGoogleSiteVerification", () => {
  it("returns undefined when unset or blank", () => {
    vi.stubEnv("GOOGLE_SITE_VERIFICATION", "");
    expect(getGoogleSiteVerification()).toBeUndefined();
    vi.stubEnv("GOOGLE_SITE_VERIFICATION", "   ");
    expect(getGoogleSiteVerification()).toBeUndefined();
  });

  it("returns the trimmed token from env", () => {
    vi.stubEnv("GOOGLE_SITE_VERIFICATION", "  token-abc  ");
    expect(getGoogleSiteVerification()).toBe("token-abc");
  });
});

describe("googleSiteVerificationMetadata", () => {
  it("omits verification when env is missing", () => {
    vi.stubEnv("GOOGLE_SITE_VERIFICATION", "");
    expect(googleSiteVerificationMetadata()).toEqual({});
  });

  it("emits metadata.verification.google when configured", () => {
    vi.stubEnv("GOOGLE_SITE_VERIFICATION", "5TD7G54I_example");
    expect(googleSiteVerificationMetadata()).toEqual({
      verification: { google: "5TD7G54I_example" },
    });
  });
});
