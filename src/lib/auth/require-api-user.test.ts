import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/safe-next-path";

describe("safeNextPath", () => {
  it("allows relative app paths", () => {
    expect(safeNextPath("/checkout?plan=pro")).toBe("/checkout?plan=pro");
    expect(safeNextPath("/onboarding/platform")).toBe("/onboarding/platform");
  });

  it("rejects open redirects", () => {
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath("")).toBe("/dashboard");
  });
});

/** Mirrors requireApiUser branching without importing server-only modules. */
function resolveApiAuthGate(input: {
  supabaseUrl: string | undefined;
  anonKey: string | undefined;
  hasUser: boolean;
}): "allow" | "unauthorized" | "misconfigured" {
  if (!input.supabaseUrl || !input.anonKey) return "misconfigured";
  if (!input.hasUser) return "unauthorized";
  return "allow";
}

describe("API auth gate policy", () => {
  it("fail-closes without Supabase env in any environment", () => {
    expect(
      resolveApiAuthGate({
        supabaseUrl: undefined,
        anonKey: undefined,
        hasUser: false,
      })
    ).toBe("misconfigured");
  });

  it("requires a session when Supabase is configured", () => {
    expect(
      resolveApiAuthGate({
        supabaseUrl: "https://example.supabase.co",
        anonKey: "anon",
        hasUser: false,
      })
    ).toBe("unauthorized");
    expect(
      resolveApiAuthGate({
        supabaseUrl: "https://example.supabase.co",
        anonKey: "anon",
        hasUser: true,
      })
    ).toBe("allow");
  });
});
