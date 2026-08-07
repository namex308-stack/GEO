import "server-only";

import {
  getLatestAuditPairForStore,
  getWorkspaceOwnerEmail,
  listActiveStoresForWeeklyReport,
  markWeeklyReportEmailSent,
  upsertWeeklyReport,
  type ActiveStoreCandidate,
} from "@/lib/db/weekly-report-repository";
import { emitWeeklyReportNotification } from "@/lib/notifications/emit";
import { generateAiExecutiveSummary } from "./ai-summary";
import { buildWeeklyReportPayload, weeklyPeriodBounds } from "./build";
import { renderWeeklyReportEmailHtml } from "./email-template";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export type WeeklyReportJobResult = {
  considered: number;
  generated: number;
  skipped: number;
  failed: number;
  emailed: number;
  reportIds: string[];
};

function isDue(store: ActiveStoreCandidate, now: Date): boolean {
  if (!store.lastReportAt) return true;
  const last = new Date(store.lastReportAt).getTime();
  if (!Number.isFinite(last)) return true;
  return now.getTime() - last >= SEVEN_DAYS_MS;
}

async function sendWeeklyReportEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "ConvAudit <reports@convaudit.com>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[weekly-report] Resend failed:", res.status, body.slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    console.error(
      "[weekly-report] Resend error:",
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

async function generateForStore(
  store: ActiveStoreCandidate,
  periodStart: string,
  periodEnd: string
): Promise<{ reportId: string | null; emailed: boolean; failed: boolean }> {
  const pair = await getLatestAuditPairForStore(store.storeId);
  if (!pair) {
    return { reportId: null, emailed: false, failed: false };
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
      return { reportId: null, emailed: false, failed: true };
    }

    const emailHtml = renderWeeklyReportEmailHtml(payload, saved.id);
    await upsertWeeklyReport({
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

    let emailed = false;
    const ownerEmail = await getWorkspaceOwnerEmail(store.workspaceId);
    if (ownerEmail) {
      emailed = await sendWeeklyReportEmail({
        to: ownerEmail,
        subject: `التقرير الأسبوعي — ${payload.storeName}`,
        html: emailHtml,
      });
      if (emailed) await markWeeklyReportEmailSent(saved.id);
    }

    // In-app Notification Center — no push.
    await emitWeeklyReportNotification({
      workspaceId: store.workspaceId,
      storeId: store.storeId,
      reportId: saved.id,
      storeName: payload.storeName,
      overallScore: payload.overallScoreChange.current,
      overallDelta: payload.overallScoreChange.delta,
    });

    return { reportId: saved.id, emailed, failed: false };
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
    return { reportId: null, emailed: false, failed: true };
  }
}

/** Cron entrypoint: one report per active store every 7 days. */
export async function runWeeklyReportJob(now = new Date()): Promise<WeeklyReportJobResult> {
  const { periodStart, periodEnd } = weeklyPeriodBounds(now);
  const periodStartIso = periodStart.toISOString();
  const periodEndIso = periodEnd.toISOString();

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
    if (!isDue(store, now)) {
      result.skipped += 1;
      continue;
    }

    const outcome = await generateForStore(store, periodStartIso, periodEndIso);
    if (outcome.failed) {
      result.failed += 1;
      continue;
    }
    if (!outcome.reportId) {
      result.skipped += 1;
      continue;
    }
    result.generated += 1;
    result.reportIds.push(outcome.reportId);
    if (outcome.emailed) result.emailed += 1;
  }

  return result;
}
