import { describe, expect, it, vi } from "vitest";
import { isResendConfigured, resolveResendConfig } from "./config";
import {
  isAuthorizedEmailRecipient,
  normalizeEmailRecipient,
} from "./recipient";
import { sendTransactionalEmail } from "./resend";

describe("resolveResendConfig", () => {
  it("returns null when API key missing", () => {
    expect(
      resolveResendConfig({
        RESEND_FROM_EMAIL: "App <onboarding@resend.dev>",
      })
    ).toBeNull();
  });

  it("returns null when from address missing (no hardcoded domain fallback)", () => {
    expect(
      resolveResendConfig({
        RESEND_API_KEY: "re_test",
      })
    ).toBeNull();
  });

  it("returns config when both env vars set", () => {
    expect(
      resolveResendConfig({
        RESEND_API_KEY: " re_test ",
        RESEND_FROM_EMAIL: " App <onboarding@resend.dev> ",
      })
    ).toEqual({
      apiKey: "re_test",
      from: "App <onboarding@resend.dev>",
    });
  });

  it("isResendConfigured mirrors resolve", () => {
    expect(isResendConfigured({})).toBe(false);
    expect(
      isResendConfigured({
        RESEND_API_KEY: "re_x",
        RESEND_FROM_EMAIL: "x@y.z",
      })
    ).toBe(true);
  });
});

describe("normalizeEmailRecipient", () => {
  it("accepts valid addresses", () => {
    expect(normalizeEmailRecipient("  owner@example.com ")).toBe(
      "owner@example.com"
    );
    expect(isAuthorizedEmailRecipient("owner@example.com")).toBe(true);
  });

  it("rejects empty or malformed", () => {
    expect(normalizeEmailRecipient("")).toBeNull();
    expect(normalizeEmailRecipient("not-an-email")).toBeNull();
    expect(normalizeEmailRecipient("a@b")).toBeNull();
    expect(isAuthorizedEmailRecipient(null)).toBe(false);
  });
});

describe("sendTransactionalEmail", () => {
  it("does not call fetch when not configured", async () => {
    const fetchImpl = vi.fn();
    const result = await sendTransactionalEmail(
      {
        to: "owner@example.com",
        subject: "t",
        html: "<p>x</p>",
      },
      {},
      fetchImpl as unknown as typeof fetch
    );
    expect(result).toEqual({ ok: false, reason: "not_configured" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects invalid recipients without calling the provider", async () => {
    const fetchImpl = vi.fn();
    const result = await sendTransactionalEmail(
      {
        to: "bad",
        subject: "t",
        html: "<p>x</p>",
      },
      {
        RESEND_API_KEY: "re_test",
        RESEND_FROM_EMAIL: "App <onboarding@resend.dev>",
      },
      fetchImpl as unknown as typeof fetch
    );
    expect(result).toEqual({ ok: false, reason: "invalid_recipient" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns ok only on 2xx and passes Idempotency-Key", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "msg_1" }),
      text: async () => "",
    });

    const result = await sendTransactionalEmail(
      {
        to: "owner@example.com",
        subject: "Weekly",
        html: "<p>hi</p>",
        idempotencyKey: "weekly-report:abc",
      },
      {
        RESEND_API_KEY: "re_test",
        RESEND_FROM_EMAIL: "App <onboarding@resend.dev>",
      },
      fetchImpl as unknown as typeof fetch
    );

    expect(result).toEqual({ ok: true, providerId: "msg_1" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Idempotency-Key"]).toBe(
      "weekly-report:abc"
    );
    const body = JSON.parse(String(init.body)) as {
      from: string;
      to: string[];
    };
    expect(body.from).toBe("App <onboarding@resend.dev>");
    expect(body.to).toEqual(["owner@example.com"]);
  });

  it("maps provider errors without throwing", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => "forbidden",
      json: async () => ({}),
    });

    const result = await sendTransactionalEmail(
      {
        to: "owner@example.com",
        subject: "t",
        html: "<p>x</p>",
      },
      {
        RESEND_API_KEY: "re_test",
        RESEND_FROM_EMAIL: "App <onboarding@resend.dev>",
      },
      fetchImpl as unknown as typeof fetch
    );

    expect(result).toEqual({ ok: false, reason: "provider_error" });
  });

  it("maps network errors without throwing", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("offline"));
    const result = await sendTransactionalEmail(
      {
        to: "owner@example.com",
        subject: "t",
        html: "<p>x</p>",
      },
      {
        RESEND_API_KEY: "re_test",
        RESEND_FROM_EMAIL: "App <onboarding@resend.dev>",
      },
      fetchImpl as unknown as typeof fetch
    );
    expect(result).toEqual({ ok: false, reason: "network_error" });
  });
});
