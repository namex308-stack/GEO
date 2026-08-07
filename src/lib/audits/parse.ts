import type { Recommendation, ScorePillar } from "@/lib/types";
import type { Json } from "@/lib/db/database.types";

const PILLARS: ReadonlySet<ScorePillar> = new Set([
  "conversion",
  "seo",
  "geo",
  "trust",
]);

/** Coerce DB/API severity strings into the recommendation union. */
export function parseSeverity(
  raw: unknown
): Recommendation["severity"] {
  return raw === "critical" || raw === "warning" || raw === "opportunity"
    ? raw
    : "opportunity";
}

export function parseImpact(raw: unknown): Recommendation["impact"] {
  return raw === "high" || raw === "medium" || raw === "low" ? raw : "medium";
}

export function parseEffort(
  raw: unknown
): Recommendation["effort"] | undefined {
  return raw === "quick" || raw === "medium" || raw === "involved"
    ? raw
    : undefined;
}

export function parsePillar(raw: unknown): ScorePillar {
  return typeof raw === "string" && PILLARS.has(raw as ScorePillar)
    ? (raw as ScorePillar)
    : "conversion";
}

export function parseSource(
  raw: unknown
): Recommendation["source"] | undefined {
  return raw === "firecrawl" || raw === "gemini" || raw === "rule_engine"
    ? raw
    : undefined;
}

export function parseFixType(
  raw: unknown
): Recommendation["fixType"] | undefined {
  return raw === "manual" || raw === "generated" || raw === "automatic"
    ? raw
    : undefined;
}

/** Serialize audit snapshot for jsonb columns without `as unknown` bridges. */
export function toJsonValue(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

type RecommendationRow = {
  id?: unknown;
  external_key?: unknown;
  pillar?: unknown;
  severity?: unknown;
  impact?: unknown;
  effort?: unknown;
  problem?: unknown;
  solution?: unknown;
  confidence?: unknown;
  affected_page?: unknown;
  projected_impact?: unknown;
  before_preview?: unknown;
  after_preview?: unknown;
  estimated_lift?: unknown;
  source?: unknown;
  fix_type?: unknown;
};

/** Map a recommendations table row into the client Recommendation shape. */
export function mapRecommendationRow(row: RecommendationRow): Recommendation {
  const id =
    (typeof row.external_key === "string" && row.external_key) ||
    (typeof row.id === "string" && row.id) ||
    "rec";

  return {
    id,
    pillar: parsePillar(row.pillar),
    severity: parseSeverity(row.severity),
    impact: parseImpact(row.impact),
    effort: parseEffort(row.effort),
    problem: typeof row.problem === "string" ? row.problem : "",
    solution: typeof row.solution === "string" ? row.solution : "",
    confidence: typeof row.confidence === "number" ? row.confidence : undefined,
    affectedPage:
      typeof row.affected_page === "string" ? row.affected_page : undefined,
    projectedImpact:
      typeof row.projected_impact === "string" ? row.projected_impact : undefined,
    beforePreview:
      typeof row.before_preview === "string" ? row.before_preview : undefined,
    afterPreview:
      typeof row.after_preview === "string" ? row.after_preview : undefined,
    estimatedLift:
      typeof row.estimated_lift === "string" ? row.estimated_lift : undefined,
    source: parseSource(row.source),
    fixType: parseFixType(row.fix_type),
  };
}
