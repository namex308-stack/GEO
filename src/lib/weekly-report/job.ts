import "server-only";

import {
  getLatestAuditPairForStore,
  getWeeklyReportByStorePeriod,
  getWorkspaceOwnerEmail,
  listActiveStoresForWeeklyReport,
  markWeeklyReportEmailSent,
  upsertWeeklyReport,
  type ActiveStoreCandidate,
} from "@/lib/db/weekly-report-repository";
import {
  normalizeEmailRecipient,
  sendTransactionalEmail,
} from "@/lib/email";
import { emitWeeklyReportNotification } from "@/lib/notifications/emit";
import { generateAiExecutiveSummary } from "./ai-summary";
import { buildWeeklyReportPayload, weeklyPeriodBounds } from "./build";
import {
  isWeeklyReportDue,
  shouldSendWeeklyReportEmail,
  shouldSkipWeeklyReportRegeneration,
} from "./cadence";
import { renderWeeklyReportEmailHtml } from "./email-template";

export type WeeklyReportJobResult = {
  considered: number;
  generated: number;
  skipped: number;
  failed: number;
  emailed: number;
  reportIds: string[];
};

/**
 * Deliver weekly report email to the workspace owner only.
 * Soft-fails when Resend is unset or the provider errors — never marks sent
 * unless the provider returns success.
 */
async function deliverWeeklyReportEmail(input: {
  reportId: string;
  workspaceId: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const ownerEmail = await getWorkspaceOwnerEmail(input.workspaceId);
  const to = normalizeEmailRecipient(ownerEmail);
  if (!to) {
    console.info("[weekly-report] skip email unauthorized or missing recipient", {
      reportId: input.reportId,
      workspaceId: input.workspaceId,
    });
    return false;
  }

  const result = await sendTransactionalEmail({
    to,
    subject: input.subject,
    html: input.html,
    idempotencyKey: `weekly-report:${input.reportId}`,
  });

  if (!result.ok) {
    console.info("[weekly-report] email not sent", {
      reportId: input.reportId,
      reason: result.reason,
    });
    return false;
  }

  const claimed = await markWeeklyReportEmailSent(input.reportId);
  if (!claimed) {
    console.info("[weekly-report] email mark skipped (already sent)", {
      reportId: input.reportId,
    });
  }
  return true;
}

async function generateForStore(
  store: ActiveStoreCandidate,
  periodStart: string,
  periodEnd: string
): Promise<{
  reportId: string | null;
  emailed: boolean;
  failed: boolean;
  /** True when an existing ready report for the same audit was reused. */
  reused: boolean;
}> {
  const pair = await getLatestAuditPairForStore(store.storeId);
  if (!pair) {
    return { reportId: null, emailed: false, failed: false, reused: false };
  }

  const existing = await getWeeklyReportByStorePeriod(store.storeId, periodStart);
  if (
    shouldSkipWeeklyReportRegeneration({
      existing,
      latestAuditId: pair.latestAuditId,
    })
  ) {
    console.info("[weekly-report] skip regenerate", {
      storeId: store.storeId,
      periodStart,
      reportId: existing?.id,
    });
    return {
      reportId: existing?.id ?? null,
      emailed: false,
      failed: false,
      reused: true,
    };
  }

  try {
    const draft = buildWeeklyReportPayload({
      storeId: store.storeId,
      storeName: store.storeName,
      storeUrl: store.storeUrl,
      workspaceId: store.workspaceId,
      periodStart,
      periodEnd,
      latest: pair.latest,
      previous: pair.previous,
      latestAuditId: pair.latestAuditId,
      previousAuditId: pair.previousAuditId,
    });

    const aiExecutiveSummary = await generateAiExecutiveSummary(draft);
    const payload = { ...draft, aiExecutiveSummary };

    // Temporary id for email link; replaced after upsert with real id.
    const emailHtmlPlaceholder = renderWeeklyReportEmailHtml(payload, "pending");

    const saved = await upsertWeeklyReport({
      workspaceId: store.workspaceId,
      storeId: store.storeId,
      periodStart,
      periodEnd,
      latestAuditId: pair.latestAuditId,
      previousAuditId: pair.previousAuditId,
      status: "ready",
      payload,
      emailHtml: emailHtmlPlaceholder,
    });

    if (!saved) {
      return { reportId: null, emailed: false, failed: true, reused: false };
    }

    const emailHtml = renderWeeklyReportEmailHtml(payload, saved.id);
    const refreshed = await upsertWeeklyReport({
      workspaceId: store.workspaceId,
      storeId: store.storeId,
      periodStart,
      periodEnd,
      latestAuditId: pair.latestAuditId,
      previousAuditId: pair.previousAuditId,
      status: "ready",
      payload,
      emailHtml,
    });

    const report = refreshed ?? saved;

    let emailed = false;
    if (shouldSendWeeklyReportEmail(report.emailSentAt)) {
      try {
        emailed = await deliverWeeklyReportEmail({
          reportId: report.id,
          workspaceId: store.workspaceId,
          subject: `التقرير الأسبوعي — ${payload.storeName}`,
          html: emailHtml,
        });
      } catch (err) {
        // Email must never fail report generation / unrelated product paths.
        console.error(
          "[weekly-report] email delivery threw:",
          err instanceof Error ? err.message : err
        );
        emailed = false;
      }
    } else {
      console.info("[weekly-report] skip email already sent", {
        storeId: store.storeId,
        reportId: report.id,
      });
    }

    // In-app Notification Center — deduped by weekly_report:{id}.
    await emitWeeklyReportNotification({
      workspaceId: store.workspaceId,
      storeId: store.storeId,
      reportId: report.id,
      storeName: payload.storeName,
      overallScore: payload.overallScoreChange.current,
      overallDelta: payload.overallScoreChange.delta,
    });

    return { reportId: report.id, emailed, failed: false, reused: false };
  } catch (err) {
    console.error(
      "[weekly-report] generate failed for store",
      store.storeId,
      err instanceof Error ? err.message : err
    );
    await upsertWeeklyReport({
      workspaceId: store.workspaceId,
      storeId: store.storeId,
      periodStart,
      periodEnd,
      latestAuditId: pair.latestAuditId,
      previousAuditId: pair.previousAuditId,
      status: "failed",
      payload: buildWeeklyReportPayload({
        storeId: store.storeId,
        storeName: store.storeName,
        storeUrl: store.storeUrl,
        workspaceId: store.workspaceId,
        periodStart,
        periodEnd,
        latest: pair.latest,
        previous: pair.previous,
        latestAuditId: pair.latestAuditId,
        previousAuditId: pair.previousAuditId,
      }),
      emailHtml: null,
      errorMessage: err instanceof Error ? err.message : "unknown error",
    });
    return { reportId: null, emailed: false, failed: true, reused: false };
  }
}

/** Cron entrypoint: one report per active store every 7 days. */
export async function runWeeklyReportJob(now = new Date()): Promise<WeeklyReportJobResult> {
  const startedAt = Date.now();
  const { periodStart, periodEnd } = weeklyPeriodBounds(now);
  const periodStartIso = periodStart.toISOString();
  const periodEndIso = periodEnd.toISOString();

  console.info("[weekly-report] job start", {
    periodStart: periodStartIso,
    periodEnd: periodEndIso,
  });

  const stores = await listActiveStoresForWeeklyReport();
  const result: WeeklyReportJobResult = {
    considered: stores.length,
    generated: 0,
    skipped: 0,
    failed: 0,
    emailed: 0,
    reportIds: [],
  };

  for (const store of stores) {
    if (!isWeeklyReportDue(store.lastReportAt, now)) {
      result.skipped += 1;
      continue;
    }

    const outcome = await generateForStore(store, periodStartIso, periodEndIso);
    if (outcome.failed) {
      result.failed += 1;
      continue;
    }
    if (!outcome.reportId || outcome.reused) {
      result.skipped += 1;
      continue;
    }
    result.generated += 1;
    result.reportIds.push(outcome.reportId);
    if (outcome.emailed) result.emailed += 1;
  }

  console.info("[weekly-report] job end", {
    ...result,
    durationMs: Date.now() - startedAt,
  });

  return result;
}
