/**
 * Map GEO component scores → denormalized geo_signals numeric columns (0–100).
 */

import { GEO_COMPONENT_MAX } from "@/lib/audit/citation-score";
import type { GeoAnalysisResult, GeoComponentScores, ScoreBreakdown } from "@/lib/types";

export const AUDIT_ANALYSIS_VERSION = "audit-engine-v2";

export type GeoSignalScores = {
  citationScore: number;
  faqScore: number;
  schemaScore: number;
  entityScore: number;
  aiReadabilityScore: number;
  freshnessScore: number;
};

function pct(points: number, max: number): number {
  if (!Number.isFinite(points) || max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((points / max) * 100)));
}

export function geoSignalsFromComponents(
  score: number,
  components: GeoComponentScores,
  readability?: { chatgpt: number; perplexity: number; googleAI: number }
): GeoSignalScores {
  const schemaPoints =
    (components.productSchema ?? 0) +
    (components.organizationSchema ?? 0) +
    (components.breadcrumbSchema ?? 0);
  const schemaMax =
    GEO_COMPONENT_MAX.productSchema +
    GEO_COMPONENT_MAX.organizationSchema +
    GEO_COMPONENT_MAX.breadcrumbSchema;

  const readabilityAvg = readability
    ? Math.round(
        (readability.chatgpt + readability.perplexity + readability.googleAI) / 3
      )
    : pct(components.contentClarity ?? 0, GEO_COMPONENT_MAX.contentClarity);

  return {
    citationScore: Math.max(0, Math.min(100, Math.round(score))),
    faqScore: pct(components.faq ?? 0, GEO_COMPONENT_MAX.faq),
    schemaScore: pct(schemaPoints, schemaMax),
    entityScore: pct(components.entityRichness ?? 0, GEO_COMPONENT_MAX.entityRichness),
    aiReadabilityScore: Math.max(0, Math.min(100, readabilityAvg)),
    freshnessScore: pct(
      (components.contentStructure ?? 0) + (components.metadata ?? 0),
      GEO_COMPONENT_MAX.contentStructure + GEO_COMPONENT_MAX.metadata
    ),
  };
}

export function geoSignalsFromAnalysis(
  geo: GeoAnalysisResult | undefined,
  readability?: { chatgpt: number; perplexity: number; googleAI: number }
): GeoSignalScores | null {
  if (!geo?.componentScores) return null;
  return geoSignalsFromComponents(geo.score, geo.componentScores, readability);
}

export function pillarScore(
  breakdown: ScoreBreakdown[] | undefined,
  pillar: ScoreBreakdown["pillar"]
): number | null {
  const row = breakdown?.find((b) => b.pillar === pillar);
  if (!row || !Number.isFinite(row.score)) return null;
  return Math.max(0, Math.min(100, Math.round(row.score)));
}
