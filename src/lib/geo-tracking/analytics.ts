import { labelTrendPoints } from "@/lib/dashboard/trend";
import type { GeoFinding } from "@/lib/types";
import type {
  GeoHistoryPoint,
  GeoScoreChangeExplanation,
  GeoTrackingSummary,
  GeoTrendPoint,
} from "./types";

const TREND_THRESHOLD = 2;

type ComponentKey =
  | "citationScore"
  | "schemaScore"
  | "entityScore"
  | "faqScore"
  | "aiReadability";

const COMPONENT_LABELS_AR: Record<ComponentKey, string> = {
  citationScore: "درجة الاقتباس",
  schemaScore: "Schema",
  entityScore: "الكيانات",
  faqScore: "الأسئلة الشائعة",
  aiReadability: "قابلية قراءة AI",
};

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreOf(point: GeoHistoryPoint, key: ComponentKey): number | null {
  const v = point[key];
  return v == null || !Number.isFinite(v) ? null : Math.round(v);
}

function findingMap(findings: GeoFinding[]): Map<string, GeoFinding> {
  const map = new Map<string, GeoFinding>();
  for (const f of findings) {
    if (f?.id) map.set(f.id, f);
  }
  return map;
}

function statusRank(status: GeoFinding["status"]): number {
  switch (status) {
    case "pass":
      return 2;
    case "warn":
      return 1;
    case "fail":
      return 0;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/** Explain a consecutive GEO history pair without touching the GEO engine. */
export function explainGeoScoreChange(
  previous: GeoHistoryPoint,
  current: GeoHistoryPoint
): GeoScoreChangeExplanation {
  const delta = Math.round(current.overallGeoScore) - Math.round(previous.overallGeoScore);
  const fixesImproved: string[] = [];
  const issuesReduced: string[] = [];

  const keys: ComponentKey[] = [
    "citationScore",
    "schemaScore",
    "entityScore",
    "faqScore",
    "aiReadability",
  ];

  for (const key of keys) {
    const prev = scoreOf(previous, key);
    const curr = scoreOf(current, key);
    if (prev == null || curr == null) continue;
    const d = curr - prev;
    if (d >= TREND_THRESHOLD) {
      fixesImproved.push(`${COMPONENT_LABELS_AR[key]} تحسّن بمقدار +${d}.`);
    } else if (d <= -TREND_THRESHOLD) {
      issuesReduced.push(`${COMPONENT_LABELS_AR[key]} انخفض بمقدار ${Math.abs(d)}.`);
    }
  }

  const prevFindings = findingMap(previous.findings);
  const currFindings = findingMap(current.findings);
  const ids = new Set([...prevFindings.keys(), ...currFindings.keys()]);

  for (const id of ids) {
    const prev = prevFindings.get(id);
    const curr = currFindings.get(id);
    if (prev && curr) {
      const moved = statusRank(curr.status) - statusRank(prev.status);
      if (moved > 0) {
        fixesImproved.push(`تحسّن: ${curr.label} — ${curr.detail}`);
      } else if (moved < 0) {
        issuesReduced.push(`تراجع: ${curr.label} — ${curr.detail}`);
      }
      continue;
    }
    if (!prev && curr) {
      if (curr.status === "pass") {
        fixesImproved.push(`إضافة إيجابية: ${curr.label}`);
      } else {
        issuesReduced.push(`مشكلة جديدة: ${curr.label} — ${curr.detail}`);
      }
    }
    if (prev && !curr && (prev.status === "fail" || prev.status === "warn")) {
      fixesImproved.push(`أُزيلت مشكلة: ${prev.label}`);
    }
  }

  let whyChanged: string;
  if (delta >= TREND_THRESHOLD) {
    whyChanged = `ارتفع ظهور GEO من ${previous.overallGeoScore} إلى ${current.overallGeoScore} (+${delta}).`;
  } else if (delta <= -TREND_THRESHOLD) {
    whyChanged = `انخفض ظهور GEO من ${previous.overallGeoScore} إلى ${current.overallGeoScore} (${delta}).`;
  } else {
    whyChanged = `درجة GEO شبه مستقرة (${current.overallGeoScore}) بين آخر تحليلين.`;
  }

  if (!fixesImproved.length && delta > 0) {
    fixesImproved.push("تحسّن إجمالي في إشارات الظهور دون مكوّن مهيمن واضح.");
  }
  if (!issuesReduced.length && delta < 0) {
    issuesReduced.push("تراجع إجمالي في إشارات الظهور دون مكوّن مهيمن واضح.");
  }

  return {
    fromAuditId: previous.auditId,
    toAuditId: current.auditId,
    fromScore: Math.round(previous.overallGeoScore),
    toScore: Math.round(current.overallGeoScore),
    delta,
    whyChanged,
    fixesImproved: fixesImproved.slice(0, 8),
    issuesReduced: issuesReduced.slice(0, 8),
  };
}

/**
 * Aggregate historical GEO tracking metrics from persisted history points.
 * Pure — safe for unit tests.
 */
export function buildGeoTrackingSummary(
  points: GeoHistoryPoint[],
  options?: { locale?: string; limit?: number }
): GeoTrackingSummary {
  const locale = options?.locale ?? "ar";
  const limit = options?.limit ?? 48;

  const sorted = [...points]
    .filter((p) => Number.isFinite(p.overallGeoScore))
    .sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    )
    .slice(-limit);

  const labeled = labelTrendPoints(
    sorted.map((p) => ({
      score: Math.round(p.overallGeoScore),
      date: p.recordedAt,
    })),
    locale
  );

  const graph: GeoTrendPoint[] = sorted.map((p, i) => ({
    label: labeled[i]?.label ?? p.recordedAt.slice(0, 10),
    date: p.recordedAt,
    score: Math.round(p.overallGeoScore),
    citationScore: p.citationScore,
    schemaScore: p.schemaScore,
    entityScore: p.entityScore,
    faqScore: p.faqScore,
    aiReadability: p.aiReadability,
    auditId: p.auditId,
  }));

  const scores = sorted.map((p) => Math.round(p.overallGeoScore));
  const bestScore = scores.length ? Math.max(...scores) : null;
  const worstScore = scores.length ? Math.min(...scores) : null;
  const firstScore = scores.length ? scores[0]! : null;
  const latestScore = scores.length ? scores[scores.length - 1]! : null;
  const netDelta =
    firstScore != null && latestScore != null ? latestScore - firstScore : null;

  let upSum = 0;
  let downSum = 0;
  const explanations: GeoScoreChangeExplanation[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const curr = sorted[i]!;
    const delta = Math.round(curr.overallGeoScore) - Math.round(prev.overallGeoScore);
    if (delta > 0) upSum += delta;
    if (delta < 0) downSum += Math.abs(delta);
    explanations.push(explainGeoScoreChange(prev, curr));
  }

  const totalMove = upSum + downSum;
  const improvementPct = totalMove > 0 ? clampPct((upSum / totalMove) * 100) : 0;
  const regressionPct = totalMove > 0 ? clampPct((downSum / totalMove) * 100) : 0;

  let trend: GeoTrackingSummary["trend"] = "flat";
  if (netDelta != null) {
    if (netDelta >= TREND_THRESHOLD) trend = "up";
    else if (netDelta <= -TREND_THRESHOLD) trend = "down";
  }

  return {
    points: sorted,
    graph,
    trend,
    improvementPct,
    regressionPct,
    bestScore,
    worstScore,
    latestScore,
    firstScore,
    netDelta,
    latestExplanation: explanations.length
      ? explanations[explanations.length - 1]!
      : null,
    explanations,
  };
}
