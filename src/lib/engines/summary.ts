import type { EngineResult, RuleResult } from "./types";

/** Build a concise, professional pillar summary from deterministic rule results. */
export function buildProfessionalSummary(engine: EngineResult): string {
  const passed = engine.rules.filter((r) => r.passed);
  const failed = engine.rules.filter((r) => !r.passed);
  const score = engine.score;

  if (score >= 85) {
    return `${engine.label} is strong at ${score}/100 — ${passed.length} of ${engine.rules.length} criteria fully met. Maintain current structure and iterate on marginal gains.`;
  }

  if (score >= 65) {
    const gap = topGap(failed);
    return `${engine.label} scores ${score}/100 with solid fundamentals. Primary improvement area: ${gap?.label ?? "secondary signals"} (${gap?.detail ?? "see rule breakdown"}).`;
  }

  if (failed.length === 0) {
    return `${engine.label} at ${score}/100 — review partial scores in the rule breakdown for optimization opportunities.`;
  }

  const gaps = failed
    .sort((a, b) => b.maxScore - b.score - (a.maxScore - a.score))
    .slice(0, 2)
    .map((r) => r.label.toLowerCase())
    .join(" and ");

  return `${engine.label} needs attention (${score}/100). Critical gaps: ${gaps}. Addressing these unlocks the largest score lift.`;
}

function topGap(failed: RuleResult[]): RuleResult | undefined {
  return failed.sort((a, b) => b.maxScore - b.score - (a.maxScore - a.score))[0];
}

/** Derive per-engine GEO readability scores from deterministic GEO rules (no randomness). */
export function deriveGeoReadability(geoEngine: EngineResult): {
  chatgpt: number;
  perplexity: number;
  googleAI: number;
} {
  const pct = (id: string) => {
    const rule = geoEngine.rules.find((r) => r.id === id);
    if (!rule || rule.maxScore === 0) return 50;
    return Math.round((rule.score / rule.maxScore) * 100);
  };

  const blend = (weights: [string, number][]) => {
    const total = weights.reduce((s, [, w]) => s + w, 0);
    return Math.round(weights.reduce((s, [id, w]) => s + pct(id) * w, 0) / total);
  };

  return {
    chatgpt: blend([
      ["geo-faq", 0.35],
      ["geo-quotable", 0.35],
      ["geo-entity", 0.3],
    ]),
    perplexity: blend([
      ["geo-lists", 0.3],
      ["geo-depth", 0.35],
      ["geo-quotable", 0.35],
    ]),
    googleAI: blend([
      ["geo-schema", 0.4],
      ["geo-entity", 0.3],
      ["geo-freshness", 0.3],
    ]),
  };
}
