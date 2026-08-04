import { describe, expect, it } from "vitest";
import { isInvalidRefreshTokenError } from "./is-invalid-refresh-token";

describe("isInvalidRefreshTokenError", () => {
  it("detects known error codes", () => {
    expect(isInvalidRefreshTokenError({ code: "refresh_token_not_found" })).toBe(true);
    expect(isInvalidRefreshTokenError({ code: "refresh_token_already_used" })).toBe(true);
    expect(isInvalidRefreshTokenError({ code: "session_not_found" })).toBe(true);
  });

  it("detects message text", () => {
    expect(
      isInvalidRefreshTokenError({
        message: "Invalid Refresh Token: Refresh Token Not Found",
      })
    ).toBe(true);
    expect(
      isInvalidRefreshTokenError({
        code: "validation_failed",
        message: "Refresh token is not valid",
      })
    ).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(isInvalidRefreshTokenError(null)).toBe(false);
    expect(isInvalidRefreshTokenError({ code: "invalid_credentials" })).toBe(false);
    expect(isInvalidRefreshTokenError({ message: "Network error" })).toBe(false);
    expect(
      isInvalidRefreshTokenError({
        code: "validation_failed",
        message: "Password is not valid",
      })
    ).toBe(false);
  });
});
