import { prioritizeRecommendations } from "@/lib/ai/recommendations";
import type { AuditData, Recommendation, ScorePillar } from "@/lib/types";
import type {
  ScoreChange,
  ScoreDeltaDirection,
  WeeklyIssueItem,
  WeeklyPriorityAction,
} from "./types";

/** Absolute score points required before a change is highlighted. */
export const MEANINGFUL_SCORE_DELTA = 2;

export function recommendationKey(rec: Pick<Recommendation, "problem" | "id">): string {
  const problem = (rec.problem || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  return problem || (rec.id || "").trim();
}

function clampScore(score: number | null | undefined): number | null {
  if (score == null || !Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function directionOf(delta: number): ScoreDeltaDirection {
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

export function pillarScoreFromAudit(
  audit: AuditData | null,
  pillar: ScorePillar
): number | null {
  if (!audit) return null;
  if (pillar === "geo") {
    return clampScore(
      audit.geoAnalysis?.score ??
        audit.breakdown.find((b) => b.pillar === "geo")?.score
    );
  }
  return clampScore(audit.breakdown.find((b) => b.pillar === pillar)?.score);
}

export function buildScoreChange(
  pillar: ScoreChange["pillar"],
  previous: number | null,
  current: number | null
): ScoreChange {
  const prev = clampScore(previous);
  const curr = clampScore(current);
  const delta =
    prev == null || curr == null ? (curr ?? 0) - (prev ?? 0) : curr - prev;
  return {
    pillar,
    previous: prev,
    current: curr,
    delta,
    direction: directionOf(delta),
    meaningful: Math.abs(delta) >= MEANINGFUL_SCORE_DELTA,
  };
}

function toIssueItem(rec: Recommendation): WeeklyIssueItem {
  return {
    id: rec.id,
    pillar: rec.pillar,
    severity: rec.severity,
    impact: rec.impact,
    problem: rec.problem,
    solution: rec.solution,
  };
}

function severityRank(s: Recommendation["severity"]): number {
  switch (s) {
    case "critical":
      return 0;
    case "warning":
      return 1;
    case "opportunity":
      return 2;
    default: {
      const _exhaustive: never = s;
      return _exhaustive;
    }
  }
}

function impactRank(i: Recommendation["impact"]): number {
  switch (i) {
    case "high":
      return 0;
    case "medium":
      return 1;
    case "low":
      return 2;
    default: {
      const _exhaustive: never = i;
      return _exhaustive;
    }
  }
}

function isWorsened(prev: Recommendation, next: Recommendation): boolean {
  const sev = severityRank(next.severity) - severityRank(prev.severity);
  if (sev < 0) return true;
  if (sev > 0) return false;
  return impactRank(next.impact) < impactRank(prev.impact);
}

function isUnchanged(prev: Recommendation, next: Recommendation): boolean {
  return prev.severity === next.severity && prev.impact === next.impact;
}

/**
 * Diff two audits: score changes, new/resolved issues, and priority actions
 * that exclude unchanged recommendations.
 */
export function compareAudits(latest: AuditData, previous: AuditData | null) {
  const overallScoreChange = buildScoreChange(
    "overall",
    previous ? previous.overallScore : null,
    latest.overallScore
  );
  const geoScoreChange = buildScoreChange(
    "geo",
    pillarScoreFromAudit(previous, "geo"),
    pillarScoreFromAudit(latest, "geo")
  );
  const seoScoreChange = buildScoreChange(
    "seo",
    pillarScoreFromAudit(previous, "seo"),
    pillarScoreFromAudit(latest, "seo")
  );
  const trustScoreChange = buildScoreChange(
    "trust",
    pillarScoreFromAudit(previous, "trust"),
    pillarScoreFromAudit(latest, "trust")
  );
  const conversionScoreChange = buildScoreChange(
    "conversion",
    pillarScoreFromAudit(previous, "conversion"),
    pillarScoreFromAudit(latest, "conversion")
  );

  const latestRecs = prioritizeRecommendations(latest.recommendations ?? []);
  const previousRecs = prioritizeRecommendations(previous?.recommendations ?? []);
  const prevByKey = new Map(previousRecs.map((r) => [recommendationKey(r), r]));
  const latestByKey = new Map(latestRecs.map((r) => [recommendationKey(r), r]));

  const newIssues: WeeklyIssueItem[] = [];
  const resolvedIssues: WeeklyIssueItem[] = [];
  const highestPriorityActions: WeeklyPriorityAction[] = [];

  for (const rec of latestRecs) {
    const key = recommendationKey(rec);
    if (!key) continue;
    if (!prevByKey.has(key)) {
      newIssues.push(toIssueItem(rec));
    }
  }

  for (const rec of previousRecs) {
    const key = recommendationKey(rec);
    if (!key) continue;
    if (!latestByKey.has(key)) {
      resolvedIssues.push(toIssueItem(rec));
    }
  }

  for (const rec of latestRecs) {
    const key = recommendationKey(rec);
    if (!key) continue;
    const prev = prevByKey.get(key);
    if (!prev) {
      highestPriorityActions.push({
        ...toIssueItem(rec),
        rank: 0,
        reason: "new",
      });
      continue;
    }
    // Skip unchanged recommendations — do not repeat them in weekly actions.
    if (isUnchanged(prev, rec)) continue;
    highestPriorityActions.push({
      ...toIssueItem(rec),
      rank: 0,
      reason: isWorsened(prev, rec) ? "worsened" : "changed",
    });
  }

  const rankedActions = highestPriorityActions
    .sort((a, b) => {
      const sev = severityRank(a.severity) - severityRank(b.severity);
      if (sev !== 0) return sev;
      return impactRank(a.impact) - impactRank(b.impact);
    })
    .slice(0, 5)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  const scoreChanges = [
    overallScoreChange,
    geoScoreChange,
    seoScoreChange,
    trustScoreChange,
    conversionScoreChange,
  ];
  const meaningfulChangeCount =
    scoreChanges.filter((c) => c.meaningful).length +
    newIssues.length +
    resolvedIssues.length +
    rankedActions.length;

  return {
    overallScoreChange,
    geoScoreChange,
    seoScoreChange,
    trustScoreChange,
    conversionScoreChange,
    newIssues: newIssues.slice(0, 12),
    resolvedIssues: resolvedIssues.slice(0, 12),
    highestPriorityActions: rankedActions,
    meaningfulChangeCount,
  };
}
