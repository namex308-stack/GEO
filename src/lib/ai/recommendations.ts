import type { Recommendation, ScorePillar } from "@/lib/types";

/**
 * Module severity bands used by the scoring engine.
 * Mapped from recommendation severity for a single fixed ranking rule:
 *   high (critical) > medium (warning) > low (opportunity)
 */
export type FindingSeverityBand = "high" | "medium" | "low";

/** Revenue-first category weight: Trust & Conversion before SEO & GEO. */
const CATEGORY_RANK: Record<ScorePillar, number> = {
  trust: 0,
  conversion: 0,
  seo: 1,
  geo: 2,
};

const SEVERITY_RANK: Record<Recommendation["severity"], number> = {
  critical: 0,
  warning: 1,
  opportunity: 2,
};

const IMPACT_RANK: Record<Recommendation["impact"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const BAND_FROM_SEVERITY: Record<Recommendation["severity"], FindingSeverityBand> = {
  critical: "high",
  warning: "medium",
  opportunity: "low",
};

function normalizeKey(problem: string): string {
  return problem
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function isBetter(a: Recommendation, b: Recommendation): boolean {
  return compareFindings(a, b) < 0;
}

/**
 * Fixed priority rule (no ML):
 * 1) severity band: high > medium > low
 * 2) category: Trust & Conversion > SEO & GEO
 * 3) impact as tie-breaker, then id
 */
export function compareFindings(a: Recommendation, b: Recommendation): number {
  const s = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
  if (s !== 0) return s;
  const c = CATEGORY_RANK[a.pillar] - CATEGORY_RANK[b.pillar];
  if (c !== 0) return c;
  const i = IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact];
  if (i !== 0) return i;
  return (a.id || "").localeCompare(b.id || "");
}

function dedupeRecommendations(recs: Recommendation[]): Recommendation[] {
  const byId = new Map<string, Recommendation>();
  const byProblem = new Map<string, Recommendation>();

  for (const r of recs) {
    const id = (r.id || "").trim();
    const problemKey = normalizeKey(r.problem || "");

    if (id) {
      const existing = byId.get(id);
      if (!existing || isBetter(r, existing)) byId.set(id, r);
    }

    if (problemKey) {
      const existing = byProblem.get(problemKey);
      if (!existing || isBetter(r, existing)) byProblem.set(problemKey, r);
    } else if (!id) {
      byProblem.set(`__anon_${byProblem.size}`, r);
    }
  }

  const merged = new Map<string, Recommendation>();
  for (const r of byProblem.values()) {
    merged.set(r.id || normalizeKey(r.problem), r);
  }
  for (const r of byId.values()) {
    const key = r.id || normalizeKey(r.problem);
    const existing = merged.get(key);
    if (!existing || isBetter(r, existing)) merged.set(key, r);
  }

  const finalByProblem = new Map<string, Recommendation>();
  for (const r of merged.values()) {
    const pk = normalizeKey(r.problem) || r.id;
    const existing = finalByProblem.get(pk);
    if (!existing || isBetter(r, existing)) finalByProblem.set(pk, r);
  }

  return [...finalByProblem.values()];
}

/**
 * Rank all findings into one prioritized list for the report UI.
 * Top 3 are labeled quick wins ("ابدأ بهذا").
 */
export function prioritizeRecommendations(recs: Recommendation[]): Recommendation[] {
  const sorted = dedupeRecommendations(recs).sort(compareFindings);

  return sorted.map((r, index) => ({
    ...r,
    priorityRank: index + 1,
    quickWin: index < 3,
    severityBand: BAND_FROM_SEVERITY[r.severity],
  }));
}

/** Prefer higher severity/category on duplicates; then apply fixed priority ranking. */
export function dedupeAndSortRecommendations(recs: Recommendation[]): Recommendation[] {
  return prioritizeRecommendations(recs);
}

/** Structured JSON payload the report (and API consumers) can render as an ordered list. */
export function toPrioritizedFindingsJson(recs: Recommendation[]): {
  findings: Array<{
    id: string;
    rank: number;
    quickWin: boolean;
    label: "ابدأ بهذا" | null;
    pillar: ScorePillar;
    severity: Recommendation["severity"];
    severityBand: FindingSeverityBand;
    impact: Recommendation["impact"];
    problem: string;
    solution: string;
  }>;
  quickWins: string[];
} {
  const prioritized = prioritizeRecommendations(recs);
  const findings = prioritized.map((r) => ({
    id: r.id,
    rank: r.priorityRank ?? 0,
    quickWin: Boolean(r.quickWin),
    label: r.quickWin ? ("ابدأ بهذا" as const) : null,
    pillar: r.pillar,
    severity: r.severity,
    severityBand: r.severityBand ?? BAND_FROM_SEVERITY[r.severity],
    impact: r.impact,
    problem: r.problem,
    solution: r.solution,
  }));

  return {
    findings,
    quickWins: findings.filter((f) => f.quickWin).map((f) => f.id),
  };
}
