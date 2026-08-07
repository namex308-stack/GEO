import type { GeoAnalysisResult, GeoFinding } from "@/lib/types";
import { geoSignalsFromAnalysis } from "@/lib/db/denormalized-scores";
import type { GeoSignalScores } from "@/lib/db/denormalized-scores";

export type GeoHistoryInsertRow = {
  workspaceId: string;
  storeId: string | null;
  auditId: string;
  overallGeoScore: number;
  citationScore: number | null;
  schemaScore: number | null;
  entityScore: number | null;
  faqScore: number | null;
  aiReadability: number | null;
  findings: GeoFinding[];
  componentScores: GeoAnalysisResult["componentScores"] | Record<string, never>;
  recordedAt: string;
};

/**
 * Build a history row from an already-computed audit GEO payload.
 * Does not run or modify the GEO engine.
 */
export function buildGeoHistoryRow(input: {
  workspaceId: string;
  storeId?: string | null;
  auditId: string;
  geoAnalysis?: GeoAnalysisResult;
  geoReadability?: { chatgpt: number; perplexity: number; googleAI: number };
  overallGeoScore?: number | null;
  recordedAt?: string;
}): GeoHistoryInsertRow | null {
  const denorm: GeoSignalScores | null = geoSignalsFromAnalysis(
    input.geoAnalysis,
    input.geoReadability
  );

  const overall =
    input.overallGeoScore ??
    input.geoAnalysis?.score ??
    denorm?.citationScore ??
    null;

  if (overall == null || !Number.isFinite(overall)) return null;

  return {
    workspaceId: input.workspaceId,
    storeId: input.storeId ?? null,
    auditId: input.auditId,
    overallGeoScore: Math.round(overall),
    citationScore: denorm?.citationScore ?? Math.round(overall),
    schemaScore: denorm?.schemaScore ?? null,
    entityScore: denorm?.entityScore ?? null,
    faqScore: denorm?.faqScore ?? null,
    aiReadability: denorm?.aiReadabilityScore ?? null,
    findings: input.geoAnalysis?.findings ?? [],
    componentScores: input.geoAnalysis?.componentScores ?? {},
    recordedAt: input.recordedAt ?? new Date().toISOString(),
  };
}
