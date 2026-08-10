import { resolveResendConfig } from "./config";
import { normalizeEmailRecipient } from "./recipient";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  /** Stable key so Resend dedupes retries (e.g. weekly-report:{id}). */
  idempotencyKey?: string;
};

export type SendEmailResult =
  | { ok: true; providerId: string | null }
  | {
      ok: false;
      reason:
        | "not_configured"
        | "invalid_recipient"
        | "provider_error"
        | "network_error";
    };

/**
 * Send a single transactional email via Resend.
 * Never throws — missing credentials or provider failures return `{ ok: false }`.
 * Does not invent success: `ok: true` only after a 2xx provider response.
 */
export async function sendTransactionalEmail(
  input: SendEmailInput,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch
): Promise<SendEmailResult> {
  const config = resolveResendConfig(env);
  if (!config) {
    return { ok: false, reason: "not_configured" };
  }

  const to = normalizeEmailRecipient(input.to);
  if (!to) {
    return { ok: false, reason: "invalid_recipient" };
  }

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    };
    if (input.idempotencyKey?.trim()) {
      headers["Idempotency-Key"] = input.idempotencyKey.trim();
    }

    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: config.from,
        to: [to],
        subject: input.subject,
        html: input.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        "[email/resend] provider error:",
        res.status,
        body.slice(0, 200)
      );
      return { ok: false, reason: "provider_error" };
    }

    let providerId: string | null = null;
    try {
      const json = (await res.json()) as { id?: unknown };
      if (typeof json.id === "string") providerId = json.id;
    } catch {
      providerId = null;
    }

    return { ok: true, providerId };
  } catch (err) {
    console.error(
      "[email/resend] network error:",
      err instanceof Error ? err.message : err
    );
    return { ok: false, reason: "network_error" };
  }
}
