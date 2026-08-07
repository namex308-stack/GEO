import { describe, expect, it } from "vitest";
import { authorizeCronRequest, cronAuthFromHeaders } from "./auth";

describe("authorizeCronRequest", () => {
  it("allows non-production when secret unset", () => {
    expect(
      authorizeCronRequest(
        { authorizationHeader: null, secretQuery: null },
        { NODE_ENV: "development" }
      )
    ).toBe(true);
  });

  it("denies production when secret unset", () => {
    expect(
      authorizeCronRequest(
        { authorizationHeader: null, secretQuery: null },
        { NODE_ENV: "production" }
      )
    ).toBe(false);
  });

  it("accepts bearer or query secret", () => {
    const env = { CRON_SECRET: "s3cret", NODE_ENV: "production" };
    expect(
      authorizeCronRequest(
        { authorizationHeader: "Bearer s3cret", secretQuery: null },
        env
      )
    ).toBe(true);
    expect(
      authorizeCronRequest(
        { authorizationHeader: null, secretQuery: "s3cret" },
        env
      )
    ).toBe(true);
    expect(
      authorizeCronRequest(
        { authorizationHeader: "Bearer wrong", secretQuery: "nope" },
        env
      )
    ).toBe(false);
  });

  it("maps headers helper", () => {
    expect(
      cronAuthFromHeaders({
        authorization: "Bearer x",
        secretQuery: "y",
      })
    ).toEqual({
      authorizationHeader: "Bearer x",
      secretQuery: "y",
    });
  });
});
