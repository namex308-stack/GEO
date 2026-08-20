import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import {
  getUserDisplayName,
  resolvePreferredDisplayName,
  sanitizeDisplayName,
} from "@/lib/auth/display-user";

function user(meta: Record<string, unknown>, email?: string): User {
  return {
    id: "u1",
    app_metadata: {},
    user_metadata: meta,
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00.000Z",
    email,
  } as User;
}

describe("sanitizeDisplayName", () => {
  it("returns a real name", () => {
    expect(sanitizeDisplayName("  Ali  Hassan ")).toBe("Ali Hassan");
  });

  it("drops the NAME X placeholder", () => {
    expect(sanitizeDisplayName("NAME X")).toBeNull();
    expect(sanitizeDisplayName("Name x")).toBeNull();
  });
});

describe("getUserDisplayName", () => {
  it("ignores placeholder metadata and falls back to the email local-part", () => {
    expect(getUserDisplayName(user({ full_name: "NAME X" }, "alii@example.com"))).toBe(
      "alii"
    );
  });

  it("prefers a real full_name over Google name", () => {
    expect(
      getUserDisplayName(user({ full_name: "Ali", name: "NAME X" }, "a@example.com"))
    ).toBe("Ali");
  });
});

describe("resolvePreferredDisplayName", () => {
  it("prefers the profile name over stale auth metadata", () => {
    expect(
      resolvePreferredDisplayName("alii", user({ full_name: "NAME X" }, "x@example.com"))
    ).toBe("alii");
  });

  it("skips a placeholder preferred name", () => {
    expect(
      resolvePreferredDisplayName("NAME X", user({ full_name: "NAME X" }, "alii@example.com"))
    ).toBe("alii");
  });
});
