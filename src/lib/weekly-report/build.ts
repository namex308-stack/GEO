import { storeHealthBand } from "@/lib/report/executive-summary";
import type { AuditData } from "@/lib/types";
import { decodeHtmlEntities } from "@/lib/text/decode-html";
import { compareAudits } from "./compare";
import type {
  ScoreChange,
  WeeklyExecutiveSummary,
  WeeklyReportPayload,
} from "./types";

function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

function scoreLine(label: string, change: ScoreChange): string | null {
  if (!change.meaningful) return null;
  const curr = change.current ?? 0;
  return `${label}: ${curr} (${formatDelta(change.delta)})`;
}

export function buildDeterministicExecutiveSummary(input: {
  storeName: string;
  latest: AuditData;
  overall: ScoreChange;
  newIssueCount: number;
  resolvedIssueCount: number;
}): WeeklyExecutiveSummary {
  const overallScore = Math.round(input.latest.overallScore);
  const delta = input.overall.delta;
  let headline: string;
  if (input.overall.previous == null) {
    headline = `أول تقرير أسبوعي لـ${input.storeName} — الدرجة الحالية ${overallScore}.`;
  } else if (delta >= 2) {
    headline = `${input.storeName} تحسّن بمقدار ${formatDelta(delta)} نقطة هذا الأسبوع.`;
  } else if (delta <= -2) {
    headline = `${input.storeName} انخفض بمقدار ${Math.abs(delta)} نقطة هذا الأسبوع.`;
  } else {
    headline = `${input.storeName} حافظ على استقرار الدرجة (${overallScore}) هذا الأسبوع.`;
  }

  const bullets: string[] = [];
  if (input.overall.meaningful) {
    bullets.push(`التغيير الإجمالي: ${formatDelta(delta)} نقطة.`);
  }
  if (input.newIssueCount > 0) {
    bullets.push(`${input.newIssueCount} مشكلة جديدة ظهرت منذ آخر تحليل.`);
  }
  if (input.resolvedIssueCount > 0) {
    bullets.push(`${input.resolvedIssueCount} مشكلة تم حلها مقارنة بالتحليل السابق.`);
  }
  if (bullets.length === 0) {
    bullets.push("لا توجد تغييرات جوهرية في الدرجات أو التوصيات هذا الأسبوع.");
  }

  return {
    storeName: input.storeName,
    headline,
    bullets,
    healthBand: storeHealthBand(overallScore),
    overallScore,
    overallDelta: delta,
  };
}

export function buildDeterministicAiSummary(payload: {
  storeName: string;
  executiveSummary: WeeklyExecutiveSummary;
  overall: ScoreChange;
  geo: ScoreChange;
  seo: ScoreChange;
  trust: ScoreChange;
  conversion: ScoreChange;
  newIssueCount: number;
  resolvedIssueCount: number;
  topActions: { problem: string }[];
}): string {
  const lines: string[] = [payload.executiveSummary.headline];

  const pillarLines = [
    scoreLine("GEO", payload.geo),
    scoreLine("SEO", payload.seo),
    scoreLine("الثقة", payload.trust),
    scoreLine("التحويل", payload.conversion),
  ].filter((x): x is string => Boolean(x));

  if (pillarLines.length) {
    lines.push(`أبرز تحركات الأعمدة: ${pillarLines.join(" · ")}.`);
  }

  if (payload.newIssueCount || payload.resolvedIssueCount) {
    lines.push(
      `المشاكل: ${payload.newIssueCount} جديدة، ${payload.resolvedIssueCount} محلولة.`
    );
  }

  if (payload.topActions.length) {
    const top = payload.topActions
      .slice(0, 3)
      .map((a, i) => `${i + 1}) ${a.problem}`)
      .join(" ");
    lines.push(`أولويات الأسبوع: ${top}`);
  } else {
    lines.push("لا توجد توصيات متغيرة تتطلب تكراراً هذا الأسبوع.");
  }

  return lines.join(" ");
}

export function buildWeeklyReportPayload(input: {
  storeId: string;
  storeName: string;
  storeUrl: string;
  workspaceId: string;
  periodStart: string;
  periodEnd: string;
  latest: AuditData;
  previous: AuditData | null;
  latestAuditId: string;
  previousAuditId: string | null;
  aiExecutiveSummary?: string;
}): WeeklyReportPayload {
  const diff = compareAudits(input.latest, input.previous);
  const storeName = decodeHtmlEntities(
    input.storeName.trim() ||
      input.latest.storeName?.trim() ||
      input.latest.productName?.trim() ||
      "المتجر"
  );

  const executiveSummary = buildDeterministicExecutiveSummary({
    storeName,
    latest: input.latest,
    overall: diff.overallScoreChange,
    newIssueCount: diff.newIssues.length,
    resolvedIssueCount: diff.resolvedIssues.length,
  });

  const aiExecutiveSummary =
    input.aiExecutiveSummary?.trim() ||
    buildDeterministicAiSummary({
      storeName,
      executiveSummary,
      overall: diff.overallScoreChange,
      geo: diff.geoScoreChange,
      seo: diff.seoScoreChange,
      trust: diff.trustScoreChange,
      conversion: diff.conversionScoreChange,
      newIssueCount: diff.newIssues.length,
      resolvedIssueCount: diff.resolvedIssues.length,
      topActions: diff.highestPriorityActions,
    });

  return {
    storeId: input.storeId,
    storeName,
    storeUrl: input.storeUrl,
    workspaceId: input.workspaceId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    latestAuditId: input.latestAuditId,
    previousAuditId: input.previousAuditId,
    executiveSummary,
    overallScoreChange: diff.overallScoreChange,
    geoScoreChange: diff.geoScoreChange,
    seoScoreChange: diff.seoScoreChange,
    trustScoreChange: diff.trustScoreChange,
    conversionScoreChange: diff.conversionScoreChange,
    newIssues: diff.newIssues,
    resolvedIssues: diff.resolvedIssues,
    highestPriorityActions: diff.highestPriorityActions,
    aiExecutiveSummary,
    meaningfulChangeCount: diff.meaningfulChangeCount,
  };
}

/** Align period start to UTC midnight 7 days before period end. */
export function weeklyPeriodBounds(now = new Date()): {
  periodStart: Date;
  periodEnd: Date;
} {
  const periodEnd = new Date(now);
  periodEnd.setUTCHours(23, 59, 59, 999);
  const periodStart = new Date(periodEnd);
  periodStart.setUTCDate(periodStart.getUTCDate() - 6);
  periodStart.setUTCHours(0, 0, 0, 0);
  return { periodStart, periodEnd };
}
