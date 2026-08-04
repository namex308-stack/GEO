import { describe, expect, it } from "vitest";
import { buildLoginRedirectTarget } from "@/lib/auth/login-redirect";

/** Mirrors middleware allow-list for checkout during incomplete guided flow. */
function shouldAllowProtectedPathDuringIncompleteFlow(pathname: string): boolean {
  const pathOnly = pathname.split("?")[0] ?? pathname;
  const isAuditFlowRoute =
    pathOnly.startsWith("/audit/") &&
    (pathOnly.includes("/scanning") ||
      pathOnly.includes("/report") ||
      pathOnly.includes("/generate") ||
      pathOnly.includes("/compare"));
  const isCheckoutRoute =
    pathOnly === "/checkout" || pathOnly.startsWith("/checkout/");
  return isAuditFlowRoute || pathOnly === "/audit/new" || isCheckoutRoute;
}

describe("buildLoginRedirectTarget", () => {
  it("preserves checkout plan query through login", () => {
    expect(
      buildLoginRedirectTarget("/checkout", "?plan=pro&period=monthly")
    ).toBe("/checkout?plan=pro&period=monthly");
  });

  it("preserves business yearly checkout query", () => {
    expect(
      buildLoginRedirectTarget("/checkout", "?plan=business&period=yearly")
    ).toBe("/checkout?plan=business&period=yearly");
  });

  it("does not strip search when pathname alone would create a loop", () => {
    // Historical bug: redirect=/checkout dropped plan → user bounced to pricing/billing
    const target = buildLoginRedirectTarget("/checkout", "?plan=pro&period=monthly");
    expect(target).not.toBe("/checkout");
    expect(target).toContain("plan=pro");
  });

  it("maps onboarding routes to /onboarding", () => {
    expect(
      buildLoginRedirectTarget("/onboarding/quiz", "", { isOnboardingRoute: true })
    ).toBe("/onboarding");
  });
});

describe("checkout vs guided-flow upgrade loop", () => {
  it("allows /checkout so plan selection is not redirected to audit Upgrade CTAs", () => {
    expect(shouldAllowProtectedPathDuringIncompleteFlow("/checkout")).toBe(true);
    expect(
      shouldAllowProtectedPathDuringIncompleteFlow("/checkout?plan=pro&period=monthly")
    ).toBe(true);
  });

  it("still allows in-progress audit routes", () => {
    expect(
      shouldAllowProtectedPathDuringIncompleteFlow("/audit/abc/generate")
    ).toBe(true);
  });

  it("does not treat billing or dashboard as checkout escape hatches", () => {
    expect(shouldAllowProtectedPathDuringIncompleteFlow("/dashboard")).toBe(false);
    expect(shouldAllowProtectedPathDuringIncompleteFlow("/settings/billing")).toBe(
      false
    );
  });
});
