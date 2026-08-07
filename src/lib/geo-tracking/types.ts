import type { GeoFinding } from "@/lib/types";

export type GeoHistoryPoint = {
  id: string;
  auditId: string;
  storeId: string | null;
  recordedAt: string;
  overallGeoScore: number;
  citationScore: number | null;
  schemaScore: number | null;
  entityScore: number | null;
  faqScore: number | null;
  aiReadability: number | null;
  findings: GeoFinding[];
};

export type GeoTrendPoint = {
  label: string;
  date: string;
  score: number;
  citationScore: number | null;
  schemaScore: number | null;
  entityScore: number | null;
  faqScore: number | null;
  aiReadability: number | null;
  auditId: string;
};

export type GeoScoreChangeExplanation = {
  fromAuditId: string;
  toAuditId: string;
  fromScore: number;
  toScore: number;
  delta: number;
  /** Why the overall GEO score moved. */
  whyChanged: string;
  /** Component/finding improvements (fixes). */
  fixesImproved: string[];
  /** Component/finding regressions (issues). */
  issuesReduced: string[];
};

export type GeoTrackingSummary = {
  points: GeoHistoryPoint[];
  graph: GeoTrendPoint[];
  trend: "up" | "down" | "flat";
  improvementPct: number;
  regressionPct: number;
  bestScore: number | null;
  worstScore: number | null;
  latestScore: number | null;
  firstScore: number | null;
  netDelta: number | null;
  latestExplanation: GeoScoreChangeExplanation | null;
  explanations: GeoScoreChangeExplanation[];
};
