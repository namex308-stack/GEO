import "server-only";
import type { EngineResult, RuleResult, ScoreCategory } from "./types";

export interface ExplainabilityItem {
  pillar: EngineResult["pillar"];
  category?: ScoreCategory;
  ruleId: string;
  ruleLabel: string;
  pointsLost: number;
  evidence: string[];
  confidence: number;
}

export interface ExplainabilityResult {
  items: ExplainabilityItem[];
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function defaultConfidence(rule: RuleResult): number {
  if (typeof rule.confidence === "number") return clamp01(rule.confidence);
  if (!rule.detail) return 0.6;
  return 0.75;
}

export function buildExplainability(engineResults: EngineResult[]): ExplainabilityResult {
  const items: ExplainabilityItem[] = [];

  for (const engine of engineResults) {
    for (const rule of engine.rules) {
      if (rule.passed && rule.score >= rule.maxScore) continue;
      const pointsLost = Math.max(0, (rule.maxScore ?? 0) - (rule.score ?? 0));
      if (pointsLost <= 0) continue;

      items.push({
        pillar: engine.pillar,
        category: rule.category,
        ruleId: rule.id,
        ruleLabel: rule.label,
        pointsLost,
        evidence: (rule.evidence && rule.evidence.length > 0 ? rule.evidence : [rule.detail]).filter(Boolean),
        confidence: defaultConfidence(rule),
      });
    }
  }

  items.sort((a, b) => b.pointsLost - a.pointsLost);
  return { items };
}

