/**
 * Shared authorization for /api/cron/* and automation HTTP adapters.
 * Pure helper — safe for unit tests without Next.js runtime.
 */

export type CronAuthRequest = {
  authorizationHeader: string | null;
  secretQuery: string | null;
};

export type CronAuthEnv = {
  CRON_SECRET?: string;
  NODE_ENV?: string;
};

/**
 * Authorize a cron/automation trigger.
 * - Production: CRON_SECRET required; Bearer header or ?secret= must match.
 * - Non-production: allowed when CRON_SECRET is unset (local exercise).
 */
export function authorizeCronRequest(
  req: CronAuthRequest,
  env: CronAuthEnv = process.env
): boolean {
  const secret = env.CRON_SECRET?.trim();
  if (!secret) {
    return env.NODE_ENV !== "production";
  }
  if (req.authorizationHeader === `Bearer ${secret}`) return true;
  return req.secretQuery === secret;
}

export function cronAuthFromHeaders(input: {
  authorization: string | null | undefined;
  secretQuery: string | null | undefined;
}): CronAuthRequest {
  return {
    authorizationHeader: input.authorization ?? null,
    secretQuery: input.secretQuery ?? null,
  };
}
