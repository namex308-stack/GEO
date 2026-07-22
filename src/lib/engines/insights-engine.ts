import "server-only";
import type { CategoryResult } from "./types";

export interface AuditInsights {
  topCategories: { category: string; score: number }[];
  bottomCategories: { category: string; score: number }[];
}

export function buildInsights(categoryResults: CategoryResult[]): AuditInsights {
  const scored = categoryResults
    .filter((c) => !c.missing)
    .map((c) => ({ category: c.category, score: c.score }))
    .sort((a, b) => b.score - a.score);

  return {
    topCategories: scored.slice(0, 3),
    bottomCategories: scored.slice(-3).reverse(),
  };
}

