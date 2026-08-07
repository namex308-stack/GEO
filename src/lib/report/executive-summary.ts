import type { AuditData, Recommendation, ScoreBreakdown, ScorePillar } from "@/lib/types";
import { prioritizeRecommendations } from "@/lib/ai/recommendations";

export type StoreHealthBand = "excellent" | "good" | "fair" | "poor";

export type ImpactEstimate = {
  pillar: ScorePillar | "business";
  score: number;
  liftPoints: number;
  band: "high" | "medium" | "low";
};

export type ExecutiveSummaryModel = {
  overallScore: number;
  healthBand: StoreHealthBand;
  storeName: string;
  strengths: string[];
  criticalIssues: string[];
  businessImpact: ImpactEstimate;
  aiVisibilityImpact: ImpactEstimate;
  seoImpact: ImpactEstimate;
  conversionImpact: ImpactEstimate;
};

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function storeHealthBand(score: number): StoreHealthBand {
  const s = clampScore(score);
  if (s >= 80) return "excellent";
  if (s >= 65) return "good";
  if (s >= 50) return "fair";
  return "poor";
}

function impactBand(score: number): ImpactEstimate["band"] {
  const gap = 100 - clampScore(score);
  if (gap >= 40) return "high";
  if (gap >= 20) return "medium";
  return "low";
}

function liftPoints(score: number): number {
  return Math.max(5, Math.round((100 - clampScore(score)) * 0.45));
}

function pillarScore(breakdown: ScoreBreakdown[], pillar: ScorePillar): number {
  return clampScore(breakdown.find((b) => b.pillar === pillar)?.score ?? 0);
}

function topStrengths(breakdown: ScoreBreakdown[], limit = 3): string[] {
  const ranked = [...breakdown].sort((a, b) => b.score - a.score);
  const items = ranked
    .filter((b) => b.summary?.trim())
    .slice(0, limit)
    .map((b) => b.summary.trim());
  return items;
}

function topCriticalIssues(recommendations: Recommendation[], limit = 3): string[] {
  const prioritized = prioritizeRecommendations(recommendations);
  const critical = prioritized.filter((r) => r.severity === "critical");
  const warnings = prioritized.filter((r) => r.severity === "warning");
  const pool = [...critical, ...warnings, ...prioritized];
  const seen = new Set<string>();
  const issues: string[] = [];
  for (const rec of pool) {
    const text = rec.problem?.trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    issues.push(text);
    if (issues.length >= limit) break;
  }
  return issues;
}

function buildImpact(
  pillar: ImpactEstimate["pillar"],
  score: number
): ImpactEstimate {
  const s = clampScore(score);
  return {
    pillar,
    score: s,
    liftPoints: liftPoints(s),
    band: impactBand(s),
  };
}

/** Derive a consulting-style executive summary from an audit payload. */
export function buildExecutiveSummary(audit: AuditData): ExecutiveSummaryModel {
  const overallScore = clampScore(audit.overallScore);
  const conversion = pillarScore(audit.breakdown, "conversion");
  const seo = pillarScore(audit.breakdown, "seo");
  const geo = clampScore(audit.geoAnalysis?.score ?? pillarScore(audit.breakdown, "geo"));
  const trust = pillarScore(audit.breakdown, "trust");
  const businessScore = clampScore(
    (overallScore + conversion + trust) / 3
  );

  return {
    overallScore,
    healthBand: storeHealthBand(overallScore),
    storeName: audit.storeName?.trim() || audit.productName?.trim() || "المتجر",
    strengths: topStrengths(audit.breakdown),
    criticalIssues: topCriticalIssues(audit.recommendations),
    businessImpact: buildImpact("business", businessScore),
    aiVisibilityImpact: buildImpact("geo", geo),
    seoImpact: buildImpact("seo", seo),
    conversionImpact: buildImpact("conversion", conversion),
  };
}
