/**
 * Pure monthly-usage quota policy helpers (Free/Pro/Business audit limits).
 *
 * These contain no Supabase/server imports so they can be unit-tested in
 * isolation. The authoritative, race-safe check happens in the
 * `try_consume_usage_quota` Postgres function (see
 * supabase/migrations/20260804190000_atomic_usage_quota.sql); `isUnderQuota`
 * mirrors that function's decision predicate for documentation/tests only.
 */

/** `limit === null` means unlimited (Business plan). */
export function isUnderQuota(used: number, limit: number | null): boolean {
  return limit == null || used < limit;
}

/** Arabic 403 message shown when a workspace has used its full monthly audit quota. */
export function auditLimitReachedMessage(
  planDisplayName: string,
  used: number,
  limit: number
): string {
  return `لقد استهلكت الحد المسموح من التحليلات لباقة ${planDisplayName} هذا الشهر (${used}/${limit}). قم بترقية باقتك للمتابعة.`;
}

/** Arabic 403 message when monthly AI generation quota is exhausted. */
export function aiLimitReachedMessage(
  planDisplayName: string,
  used: number,
  limit: number
): string {
  return `لقد استهلكت الحد المسموح من توليدات AI لباقة ${planDisplayName} هذا الشهر (${used}/${limit}). قم بترقية باقتك للمتابعة.`;
}
