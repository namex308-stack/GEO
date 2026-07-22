import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { runCrawlJob } from "@/lib/crawl/run-crawl-job";
import { compareAudits, type AuditComparison } from "@/lib/crawl/summary";
import { canSendEmailNotifications, canRunAudit } from "@/lib/billing/entitlements";
import { getUserBillingContext } from "@/lib/billing/usage";
import {
  buildAlertEmail,
  buildIssueEmail,
  buildReportEmail,
  sendEmail,
} from "@/lib/email/resend";
import type { Plan } from "@/lib/billing/entitlements";
import type { ScoreBreakdown } from "@/lib/types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function nextWeeklyRun(from = new Date()): Date {
  return new Date(from.getTime() + WEEK_MS);
}

export async function queueNotification(params: {
  userId: string;
  monitoringJobId: string;
  auditId: string;
  type: "report" | "alert" | "issue";
  subject: string;
  body: string;
}) {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  await sb.from("notifications").insert({
    user_id: params.userId,
    monitoring_job_id: params.monitoringJobId,
    audit_id: params.auditId,
    type: params.type,
    subject: params.subject,
    body: params.body,
    status: "pending",
  });
}

export async function processPendingNotifications() {
  const sb = getSupabaseAdmin();
  if (!sb) return { sent: 0, failed: 0 };

  const { data: pending } = await sb
    .from("notifications")
    .select("id, user_id, subject, body")
    .eq("status", "pending")
    .limit(50);

  if (!pending?.length) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const note of pending) {
    const { data: profile } = await sb.from("profiles").select("email, plan").eq("id", note.user_id).single();
    if (!profile?.email || !canSendEmailNotifications(profile.plan as Plan)) {
      await sb.from("notifications").update({ status: "failed", error_message: "Email not allowed or missing address" }).eq("id", note.id);
      failed++;
      continue;
    }

    const result = await sendEmail({ to: profile.email, subject: note.subject, html: note.body });
    if (result.ok) {
      await sb.from("notifications").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", note.id);
      sent++;
    } else {
      await sb.from("notifications").update({ status: "failed", error_message: result.error }).eq("id", note.id);
      failed++;
    }
  }

  return { sent, failed };
}

export async function runMonitoringJob(jobId: string) {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const { data: job } = await sb.from("monitoring_jobs").select("*").eq("id", jobId).single();
  if (!job || !job.enabled) return;

  const { data: profile } = await sb.from("profiles").select("plan, email").eq("id", job.user_id).single();
  const plan = (profile?.plan as Plan) ?? "free";

  const ctx = await getUserBillingContext(job.user_id);
  if (!canRunAudit(ctx.plan, ctx.auditsUsed)) {
    console.warn(`[monitoring] audit limit reached for user ${job.user_id}, skipping job ${jobId}`);
    await sb.from("monitoring_jobs").update({
      next_run_at: nextWeeklyRun().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);
    return;
  }

  const siteUrl = job.site_url;
  const now = new Date().toISOString();

  const { data: audit, error } = await sb
    .from("audits")
    .insert({
      user_id: job.user_id,
      product_url: job.product_url || siteUrl,
      store_url: job.store_url || siteUrl,
      site_url: siteUrl,
      audit_type: "crawl",
      status: "queued",
      crawl_progress: { phase: "discovering", totalPages: 0, completedPages: 0 },
    })
    .select("id")
    .single();

  if (error || !audit) {
    console.error("[monitoring] audit create failed:", error?.message);
    return;
  }

  await runCrawlJob(audit.id, plan);

  const { data: completed } = await sb.from("audits").select("*").eq("id", audit.id).single();
  if (!completed || completed.status !== "complete") {
    await sb.from("monitoring_jobs").update({ last_run_at: now, next_run_at: nextWeeklyRun().toISOString() }).eq("id", jobId);
    return;
  }

  let comparison: AuditComparison | null = null;
  if (job.last_audit_id) {
    const { data: previous } = await sb.from("audits").select("*").eq("id", job.last_audit_id).single();
    if (previous) {
      comparison = compareAudits(
        { overall_score: previous.overall_score, breakdown: previous.breakdown as ScoreBreakdown[], recommendations: previous.recommendations as unknown[] },
        { overall_score: completed.overall_score, breakdown: completed.breakdown as ScoreBreakdown[], recommendations: completed.recommendations as unknown[] }
      );
    }
  }

  await sb.from("monitoring_jobs").update({
    previous_audit_id: job.last_audit_id,
    last_audit_id: audit.id,
    last_run_at: now,
    next_run_at: nextWeeklyRun().toISOString(),
    updated_at: now,
  }).eq("id", jobId);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const label = job.label || new URL(siteUrl).hostname;
  const summary = completed.crawl_summary as { totalPages?: number; pagesWithIssues?: number } | null;

  if (canSendEmailNotifications(plan)) {
    const report = buildReportEmail({
      siteLabel: label,
      score: completed.overall_score ?? 0,
      totalPages: summary?.totalPages,
      pagesWithIssues: summary?.pagesWithIssues,
      appUrl,
    });
    await queueNotification({
      userId: job.user_id,
      monitoringJobId: jobId,
      auditId: audit.id,
      type: "report",
      subject: report.subject,
      body: report.html,
    });

    if (comparison && comparison.scoreDelta < 0) {
      const alert = buildAlertEmail({
        siteLabel: label,
        previousScore: comparison.previousScore,
        currentScore: comparison.currentScore,
        delta: comparison.scoreDelta,
        appUrl,
      });
      await queueNotification({
        userId: job.user_id,
        monitoringJobId: jobId,
        auditId: audit.id,
        type: "alert",
        subject: alert.subject,
        body: alert.html,
      });
    }

    if (comparison && comparison.newIssues.length > 0) {
      const issue = buildIssueEmail({ siteLabel: label, issues: comparison.newIssues, appUrl });
      await queueNotification({
        userId: job.user_id,
        monitoringJobId: jobId,
        auditId: audit.id,
        type: "issue",
        subject: issue.subject,
        body: issue.html,
      });
    }
  }

  await processPendingNotifications();
}

export async function runDueMonitoringJobs() {
  const sb = getSupabaseAdmin();
  if (!sb) return { processed: 0 };

  const now = new Date().toISOString();
  const { data: jobs } = await sb
    .from("monitoring_jobs")
    .select("id")
    .eq("enabled", true)
    .or(`next_run_at.is.null,next_run_at.lte.${now}`);

  if (!jobs?.length) return { processed: 0 };

  for (const job of jobs) {
    await runMonitoringJob(job.id);
  }

  return { processed: jobs.length };
}
