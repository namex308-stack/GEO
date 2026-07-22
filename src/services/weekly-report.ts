import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import { compareAudits, type AuditComparison } from "@/lib/crawl/summary";
import type { ScoreBreakdown } from "@/lib/types";
import { sendWeeklyReportEmail } from "@/services/notification";

export interface WeeklyReportSummary {
  userId: string;
  siteLabel: string;
  productUrl: string;
  comparison: AuditComparison;
  currentAuditId: string;
  previousAuditId: string;
  improvedPillars: string[];
  regressedPillars: string[];
  newIssues: string[];
  narrative: string;
}

type AuditRow = {
  id: string;
  product_url: string;
  product_name: string | null;
  store_name: string | null;
  overall_score: number | null;
  breakdown: ScoreBreakdown[] | null;
  recommendations: unknown[] | null;
  created_at: string;
};

/**
 * Load the two most recent audits for a user (optionally filtered by product URL)
 * and produce a comparison summary.
 */
export async function buildWeeklyReport(params: {
  userId: string;
  productUrl?: string;
}): Promise<WeeklyReportSummary | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  let query = sb
    .from("audits")
    .select(
      "id, product_url, product_name, store_name, overall_score, breakdown, recommendations, created_at"
    )
    .eq("user_id", params.userId)
    .order("created_at", { ascending: false })
    .limit(2);

  if (params.productUrl) {
    query = query.eq("product_url", params.productUrl);
  }

  const { data, error } = await query;
  if (error || !data || data.length < 2) {
    return null;
  }

  const [current, previous] = data as AuditRow[];
  const comparison = compareAudits(
    {
      overall_score: previous.overall_score,
      breakdown: previous.breakdown ?? undefined,
      recommendations: previous.recommendations ?? undefined,
    },
    {
      overall_score: current.overall_score,
      breakdown: current.breakdown ?? undefined,
      recommendations: current.recommendations ?? undefined,
    }
  );

  const siteLabel =
    current.product_name ||
    current.store_name ||
    current.product_url ||
    "Your store";

  const narrative = buildNarrative(siteLabel, comparison);

  return {
    userId: params.userId,
    siteLabel,
    productUrl: current.product_url,
    comparison,
    currentAuditId: current.id,
    previousAuditId: previous.id,
    improvedPillars: comparison.improvedPillars,
    regressedPillars: comparison.regressedPillars,
    newIssues: comparison.newIssues,
    narrative,
  };
}

function buildNarrative(siteLabel: string, c: AuditComparison): string {
  const parts: string[] = [];
  if (c.scoreDelta > 0) {
    parts.push(`${siteLabel} improved by ${c.scoreDelta} points (${c.previousScore} → ${c.currentScore}).`);
  } else if (c.scoreDelta < 0) {
    parts.push(`${siteLabel} dropped by ${Math.abs(c.scoreDelta)} points (${c.previousScore} → ${c.currentScore}).`);
  } else {
    parts.push(`${siteLabel} held steady at ${c.currentScore}/100.`);
  }
  if (c.improvedPillars.length) {
    parts.push(`Improved: ${c.improvedPillars.join(", ")}.`);
  }
  if (c.regressedPillars.length) {
    parts.push(`Needs attention: ${c.regressedPillars.join(", ")}.`);
  }
  if (c.newIssues.length) {
    parts.push(`New issues: ${c.newIssues.slice(0, 3).join("; ")}.`);
  }
  return parts.join(" ");
}

/**
 * Build weekly report and optionally email it.
 */
export async function generateAndSendWeeklyReport(params: {
  userId: string;
  to: string;
  productUrl?: string;
}): Promise<{ summary: WeeklyReportSummary | null; emailed: boolean }> {
  const summary = await buildWeeklyReport({
    userId: params.userId,
    productUrl: params.productUrl,
  });

  if (!summary) {
    return { summary: null, emailed: false };
  }

  const issueList =
    summary.newIssues.length > 0
      ? `<ul>${summary.newIssues.map((i) => `<li>${i}</li>`).join("")}</ul>`
      : "";

  const result = await sendWeeklyReportEmail({
    to: params.to,
    siteLabel: summary.siteLabel,
    currentScore: summary.comparison.currentScore,
    previousScore: summary.comparison.previousScore,
    scoreDelta: summary.comparison.scoreDelta,
    summaryHtml: `<p>${summary.narrative}</p>${issueList}`,
  });

  return { summary, emailed: result.ok };
}
