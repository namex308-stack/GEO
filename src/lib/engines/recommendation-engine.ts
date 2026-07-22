import "server-only";
import type { EngineResult } from "@/lib/engines/types";
import type { Recommendation } from "@/lib/types";

export interface DeterministicInterpretation {
  recommendations: Recommendation[];
  pillarSummaries: Record<string, string>;
}

export function buildDeterministicInterpretation(results: EngineResult[]): DeterministicInterpretation {
  const recommendations: Recommendation[] = [];
  const pillarSummaries: Record<string, string> = {};

  for (const engine of results) {
    pillarSummaries[engine.pillar] = engine.summary;

    for (const rule of engine.rules.filter((r) => !r.passed || r.score < r.maxScore)) {
      const pointsLost = rule.maxScore - rule.score;
      recommendations.push({
        id: `${engine.pillar}-${rule.id}`,
        pillar: engine.pillar,
        severity: pointsLost >= rule.maxScore * 0.7 ? "critical" : pointsLost >= rule.maxScore * 0.3 ? "warning" : "opportunity",
        impact: rule.maxScore >= 15 ? "high" : rule.maxScore >= 10 ? "medium" : "low",
        effort: rule.id.includes("schema") || rule.id.includes("faq") ? "medium" : "quick",
        problem: `${rule.label}: ${rule.detail} (${pointsLost} points lost)`,
        solution: `Implement ${rule.label.toLowerCase()} improvements to recover up to ${pointsLost} points in ${engine.label}. Review the live page against best practices for your platform.`,
      });
    }
  }

  recommendations.sort((a, b) => {
    const sev = { critical: 0, warning: 1, opportunity: 2 };
    return (sev[a.severity] ?? 9) - (sev[b.severity] ?? 9);
  });

  return { recommendations: recommendations.slice(0, 12), pillarSummaries };
}

