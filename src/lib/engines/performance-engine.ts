import "server-only";
import type { CategoryResult, PageSnapshot, RuleResult } from "./types";
import { buildProfessionalSummary } from "./summary";

export function runPerformanceEngine(snapshot: PageSnapshot): CategoryResult {
  const rules: RuleResult[] = [];

  const speedOk = snapshot.pageWeightKb <= 800;
  const speedPartial = snapshot.pageWeightKb <= 1500;

  rules.push({
    id: "perf-page-weight",
    label: "Page weight (speed proxy)",
    passed: speedOk,
    score: speedOk ? 18 : speedPartial ? 9 : 0,
    maxScore: 18,
    detail: `~${snapshot.pageWeightKb} KB HTML content`,
    category: "performance",
    confidence: 0.65,
    evidence: [`pageWeightKb=${snapshot.pageWeightKb}`],
  });

  const total = rules.reduce((s, r) => s + r.score, 0);
  const max = rules.reduce((s, r) => s + r.maxScore, 0);
  const score = Math.round((total / (max || 1)) * 100);

  const pseudoPillar = {
    pillar: "seo" as const,
    score,
    maxScore: 100,
    label: "Performance",
    summary: "",
    rules,
  };

  const summary = buildProfessionalSummary(pseudoPillar);

  return { category: "performance", score, maxScore: 100, label: "Performance", summary, rules };
}

