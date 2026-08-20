import { prioritizeRecommendations } from "@/lib/ai/recommendations";
import { buildScoreTrend } from "@/lib/dashboard/trend";
import { storeHealthBand } from "@/lib/report/executive-summary";
import { describeScoreBalance } from "@/lib/report/overview-balance";
import type { AuditData, Recommendation, ScorePillar } from "@/lib/types";
import { decodeHtmlEntities } from "@/lib/text/decode-html";
import { pillarScoreFromAudit } from "@/lib/weekly-report/compare";
import { performanceScoreFromCrawlMs } from "./performance";
import type {
  HealthIssueItem,
  HealthPillar,
  HealthPillarStatus,
  HealthSignalItem,
  StoreHealthPayload,
} from "./types";

const PILLAR_KEYS: ScorePillar[] = ["seo", "geo", "conversion", "trust"];

const PILLAR_LABELS_AR: Record<ScorePillar, string> = {
  seo: "SEO",
  geo: "GEO",
  conversion: "التحويل",
  trust: "الثقة",
};

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function pillarStatus(score: number | null): HealthPillarStatus {
  if (score == null) return "unknown";
  if (score >= 70) return "healthy";
  if (score >= 50) return "warning";
  return "critical";
}

function toIssue(rec: Recommendation): HealthIssueItem {
  return {
    id: rec.id,
    problem: rec.problem,
    solution: rec.solution,
    severity: rec.severity,
    pillar: rec.pillar,
  };
}

/**
 * Compose Store Health from already-persisted audit scores.
 * Never re-runs conversion/SEO/trust/GEO scoring modules.
 */
export function composeStoreHealth(input: {
  audit: AuditData | null;
  crawlDurationMs?: number | null;
  completedAudits: Array<{
    overallScore: number | null;
    completedAt: string | null;
    createdAt: string;
  }>;
  now?: Date;
}): StoreHealthPayload {
  const now = input.now ?? new Date();
  const audit = input.audit;

  const seo = audit ? pillarScoreFromAudit(audit, "seo") : null;
  const geo = audit ? pillarScoreFromAudit(audit, "geo") : null;
  const conversion = audit ? pillarScoreFromAudit(audit, "conversion") : null;
  const trust = audit ? pillarScoreFromAudit(audit, "trust") : null;
  const performance = performanceScoreFromCrawlMs(
    input.crawlDurationMs ?? audit?.crawlMetadata?.scrapeMs ?? null
  );

  const pillarScores: HealthPillar[] = [
    ...PILLAR_KEYS.map((key) => {
      const score =
        key === "seo"
          ? seo
          : key === "geo"
            ? geo
            : key === "conversion"
              ? conversion
              : trust;
      const summary =
        audit?.breakdown.find((b) => b.pillar === key)?.summary?.trim() || null;
      return {
        key,
        score,
        status: pillarStatus(score),
        summary,
      };
    }),
    {
      key: "performance",
      score: performance,
      status: pillarStatus(performance),
      summary:
        performance == null
          ? "لا تتوفر مدة زحف لهذه الجلسة."
          : `مستنتج من زمن الزحف الحالي (${Math.round(
              (input.crawlDurationMs ?? audit?.crawlMetadata?.scrapeMs ?? 0) / 1000
            )}ث) — ليس عموداً في محرك التحليل.`,
    },
  ];

  const composable = [seo, geo, conversion, trust, performance].filter(
    (n): n is number => n != null && Number.isFinite(n)
  );
  const currentHealth =
    composable.length > 0
      ? clamp(composable.reduce((a, b) => a + b, 0) / composable.length)
      : audit
        ? clamp(audit.overallScore)
        : null;

  const historicalTrend = buildScoreTrend(input.completedAudits, {
    locale: "ar",
    limit: 24,
  });

  let trend: StoreHealthPayload["trend"] = "flat";
  if (historicalTrend.length >= 2) {
    const first = historicalTrend[0]!.score;
    const last = historicalTrend[historicalTrend.length - 1]!.score;
    const delta = last - first;
    if (delta >= 2) trend = "up";
    else if (delta <= -2) trend = "down";
  }

  const ranked = prioritizeRecommendations(audit?.recommendations ?? []);
  const criticalProblems = ranked.filter((r) => r.severity === "critical").slice(0, 8).map(toIssue);
  const warnings = ranked.filter((r) => r.severity === "warning").slice(0, 8).map(toIssue);
  const recommendations = ranked
    .filter((r) => r.severity === "critical" || r.severity === "warning")
    .slice(0, 6)
    .map(toIssue);

  const healthySignals: HealthSignalItem[] = [];
  for (const key of PILLAR_KEYS) {
    const score = pillarScores.find((p) => p.key === key)?.score ?? null;
    if (score == null || score < 70) continue;
    const summary =
      audit?.breakdown.find((b) => b.pillar === key)?.summary?.trim() ||
      `${PILLAR_LABELS_AR[key]} في منطقة صحية (${score}).`;
    healthySignals.push({
      id: `healthy-${key}`,
      label: PILLAR_LABELS_AR[key],
      detail: summary,
    });
  }
  if (performance != null && performance >= 70) {
    healthySignals.push({
      id: "healthy-performance",
      label: "الأداء",
      detail: `زمن الزحف ضمن نطاق مقبول (${performance}).`,
    });
  }

  const lastScan = audit?.createdAt ?? null;
  const next = computeNextScan(lastScan, now);

  return {
    storeName: decodeHtmlEntities(
      audit?.storeName?.trim() || audit?.productName?.trim() || "المتجر"
    ),
    auditId: audit?.id ?? null,
    currentHealth,
    healthBand: currentHealth != null ? storeHealthBand(currentHealth) : null,
    trend,
    pillars: pillarScores,
    criticalProblems,
    warnings,
    healthySignals: healthySignals.slice(0, 8),
    lastScan,
    nextScan: next.at,
    nextScanLabel: next.label,
    historicalTrend,
    recommendations,
    balance:
      audit != null
        ? describeScoreBalance(audit.overallScore, audit.breakdown)
        : null,
  };
}

/** Recommended next re-scan hint — no automatic store crawler exists. */
export function computeNextScan(
  lastScanIso: string | null,
  now = new Date()
): { at: string | null; label: string } {
  if (!lastScanIso) {
    return {
      at: null,
      label: "شغّل تحليلاً جديداً لبدء تتبّع صحة المتجر.",
    };
  }

  const last = new Date(lastScanIso);
  if (!Number.isFinite(last.getTime())) {
    return { at: null, label: "موعد الفحص التالي غير متاح." };
  }

  const next = new Date(last.getTime() + 7 * 24 * 60 * 60 * 1000);
  const due = now.getTime() >= next.getTime();
  return {
    at: next.toISOString(),
    label: due
      ? "يُفضّل إعادة الفحص الآن (مرّ أكثر من 7 أيام على آخر تحليل)."
      : "الفحص التالي الموصى به خلال أسبوع من آخر تحليل مكتمل.",
  };
}
