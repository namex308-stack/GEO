/**
 * Shared scoring helpers for the audit engine.
 * Deterministic, reusable — no mock/demo values.
 */

import { toGeoAnalysisResult, type GeoAnalysis } from "@/lib/audit/geo-analyzer";
import type { AuditData, Recommendation, ScoreBreakdown } from "@/lib/types";
import { dedupeAndSortRecommendations } from "@/lib/ai/recommendations";

export function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Average pillar scores into an overall 0–100 score. */
export function averagePillarScores(breakdown: ScoreBreakdown[]): number {
  if (!breakdown.length) return 0;
  const sum = breakdown.reduce((acc, b) => acc + clampScore(b.score), 0);
  return clampScore(sum / breakdown.length);
}

/** Replace (or insert) the GEO pillar breakdown entry. */
export function upsertGeoBreakdown(
  breakdown: ScoreBreakdown[],
  geo: Pick<GeoAnalysis, "score" | "summary">
): ScoreBreakdown[] {
  const entry: ScoreBreakdown = {
    pillar: "geo",
    score: clampScore(geo.score),
    max: 100,
    label: "GEO / AI Visibility",
    summary: geo.summary,
  };
  const idx = breakdown.findIndex((b) => b.pillar === "geo");
  if (idx < 0) return [...breakdown, entry];
  const next = breakdown.slice();
  next[idx] = entry;
  return next;
}

/**
 * Apply deterministic GEO analysis onto an assembled audit.
 * Leaves conversion / SEO / trust pillar scores untouched.
 */
export function applyGeoAnalysisToAudit(audit: AuditData, geo: GeoAnalysis): AuditData {
  const breakdown = upsertGeoBreakdown(audit.breakdown, geo);
  const recommendations = dedupeAndSortRecommendations([
    ...audit.recommendations,
    ...geo.recommendations,
  ]);

  return {
    ...audit,
    breakdown,
    overallScore: averagePillarScores(breakdown),
    geoReadability: geo.readability,
    geoAnalysis: toGeoAnalysisResult(geo),
    recommendations,
  };
}

/** Merge GEO rule-engine recommendations without changing other pillars' scores. */
export function mergeGeoRecommendations(
  existing: Recommendation[],
  geoRecs: Recommendation[]
): Recommendation[] {
  return dedupeAndSortRecommendations([...existing, ...geoRecs]);
}
