import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  extractAmount,
  extractOrderId,
  getCheckoutEnvironmentError,
  isPaymentSuccessful,
  isPublicAppUrl,
  parseOrderId,
  verifyWebhookSignature,
} from "./kashier";

describe("parseOrderId", () => {
  it("parses modern order ids", () => {
    const id = "sp-pro-monthly-11111111-1111-1111-1111-111111111111-1700000000000";
    expect(parseOrderId(id)).toEqual({
      plan: "pro",
      period: "monthly",
      userId: "11111111-1111-1111-1111-111111111111",
    });
  });

  it("parses legacy colon order ids", () => {
    const id = "sp:business:yearly:22222222-2222-2222-2222-222222222222:1700000000000";
    expect(parseOrderId(id)).toEqual({
      plan: "business",
      period: "yearly",
      userId: "22222222-2222-2222-2222-222222222222",
    });
  });
});

describe("extractOrderId / extractAmount / isPaymentSuccessful", () => {
  it("reads nested data.orderId", () => {
    expect(
      extractOrderId({
        data: { orderId: "sp-pro-monthly-11111111-1111-1111-1111-111111111111-1" },
      })
    ).toBe("sp-pro-monthly-11111111-1111-1111-1111-111111111111-1");
  });

  it("reads nested success status", () => {
    expect(isPaymentSuccessful({ data: { status: "SUCCESS" } })).toBe(true);
    expect(isPaymentSuccessful({ status: "FAILED" })).toBe(false);
  });

  it("reads nested amount", () => {
    expect(extractAmount({ data: { amount: "199.00" } })).toBe(199);
  });
});

describe("verifyWebhookSignature", () => {
  const payload = JSON.stringify({ status: "SUCCESS", orderId: "sp-pro-monthly-x" });

  afterEach(() => {
    delete process.env.KASHIER_WEBHOOK_SECRET;
    delete process.env.KASHIER_SECRET_KEY;
    delete process.env.KASHIER_API_KEY;
  });

  it("accepts HMAC signed with SECRET_KEY when WEBHOOK_SECRET unset", () => {
    process.env.KASHIER_SECRET_KEY = "secret-key-for-hmac";
    process.env.KASHIER_API_KEY = "api-key-should-not-be-required";
    const signature = createHmac("sha256", "secret-key-for-hmac").update(payload).digest("hex");
    expect(verifyWebhookSignature(payload, signature)).toBe(true);
  });

  it("still accepts API_KEY signatures for backward compatibility", () => {
    process.env.KASHIER_API_KEY = "legacy-api-key";
    const signature = createHmac("sha256", "legacy-api-key").update(payload).digest("hex");
    expect(verifyWebhookSignature(payload, signature)).toBe(true);
  });

  it("rejects invalid signatures", () => {
    process.env.KASHIER_SECRET_KEY = "secret-key-for-hmac";
    expect(verifyWebhookSignature(payload, "deadbeef")).toBe(false);
  });

  it("accepts sha256= prefix", () => {
    process.env.KASHIER_WEBHOOK_SECRET = "whsec";
    const hex = createHmac("sha256", "whsec").update(payload).digest("hex");
    expect(verifyWebhookSignature(payload, `sha256=${hex}`)).toBe(true);
  });
});

describe("getCheckoutEnvironmentError / isPublicAppUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects localhost app URLs", () => {
    expect(isPublicAppUrl("http://localhost:3000")).toBe(false);
    expect(isPublicAppUrl("https://app.example.com")).toBe(true);
  });

  it("blocks production checkout when APP_URL is localhost", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("KASHIER_MODE", "live");
    expect(getCheckoutEnvironmentError("http://localhost:3000")).toMatch(/NEXT_PUBLIC_APP_URL/);
  });

  it("blocks production checkout when KASHIER_MODE unset", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("KASHIER_MODE", "");
    expect(getCheckoutEnvironmentError("https://app.example.com")).toMatch(/KASHIER_MODE/);
  });

  it("allows production when URL and mode are valid", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("KASHIER_MODE", "live");
    expect(getCheckoutEnvironmentError("https://app.example.com")).toBeNull();
  });
});
