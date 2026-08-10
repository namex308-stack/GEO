/** Pure cadence / idempotency helpers for the weekly report job. */

export const WEEKLY_REPORT_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

/** Whether a store is due for a new weekly report based on last generation time. */
export function isWeeklyReportDue(
  lastReportAt: string | null,
  now: Date,
  intervalMs = WEEKLY_REPORT_INTERVAL_MS
): boolean {
  if (!lastReportAt) return true;
  const last = new Date(lastReportAt).getTime();
  if (!Number.isFinite(last)) return true;
  return now.getTime() - last >= intervalMs;
}

/**
 * Skip regenerating when a ready report already exists for this period
 * and is based on the same latest audit (cron re-trigger / overlap safety).
 */
export function shouldSkipWeeklyReportRegeneration(input: {
  existing:
    | {
        status: string;
        latestAuditId: string | null;
      }
    | null;
  latestAuditId: string;
}): boolean {
  const { existing, latestAuditId } = input;
  if (!existing) return false;
  if (existing.status !== "ready") return false;
  return existing.latestAuditId === latestAuditId;
}

/** Do not re-send email when the period report was already emailed. */
export function shouldSendWeeklyReportEmail(
  emailSentAt: string | null | undefined
): boolean {
  return !emailSentAt;
}
