/**
 * Resend / outbound email configuration.
 * Credentials stay in environment variables — never hardcoded domains or keys.
 */

export type ResendConfig = {
  apiKey: string;
  from: string;
};

/**
 * Resolve Resend config from env.
 * Returns null when either key or from-address is missing — callers must
 * treat that as "email disabled" (no send, no fake success).
 */
export function resolveResendConfig(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): ResendConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim() ?? "";
  const from = env.RESEND_FROM_EMAIL?.trim() ?? "";
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

/** True when outbound email is configured enough to attempt a send. */
export function isResendConfigured(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): boolean {
  return resolveResendConfig(env) !== null;
}
