import "server-only";
import type { CategoryResult, EngineResult, OrchestratorResult, PageSnapshot, ScoreCategory } from "./types";
import { runCROEngine } from "./cro-engine";
import { runSEOEngine } from "./seo-engine";
import { runGEOEngine } from "./geo-engine";
import { runTrustEngine } from "./trust-engine";
import { runPerformanceEngine } from "./performance-engine";
import { runAccessibilityEngine } from "./accessibility-engine";
import { runSecurityEngine } from "./security-engine";
import { runContentEngine } from "./content-engine";
import { runUXEngine } from "./ux-engine";
import { runUIEngine } from "./ui-engine";
import { runEcommerceEngine } from "./ecommerce-engine";
import { runBrandEngine } from "./brand-engine";
import { runMobileEngine } from "./mobile-engine";

const PILLAR_WEIGHTS: Record<EngineResult["pillar"], number> = {
  conversion: 0.25,
  seo: 0.25,
  geo: 0.3,
  trust: 0.2,
};

function weightedPillarScore(results: EngineResult[]): number {
  let total = 0;
  let weightSum = 0;
  for (const r of results) {
    const w = PILLAR_WEIGHTS[r.pillar] ?? 0.25;
    total += r.score * w;
    weightSum += w;
  }
  return Math.round(total / (weightSum || 1));
}

function missingCategory(category: ScoreCategory, label: string): CategoryResult {
  return {
    category,
    label,
    score: 0,
    maxScore: 100,
    summary: "Missing engine.",
    rules: [],
    missing: true,
  };
}

export interface ScoringSystemResult extends OrchestratorResult {
  categoryResults: CategoryResult[];
}

/**
 * 12-category scoring entrypoint.
 * Today the app only runs the 4 pillar engines; categories are a superset that will be filled in by new engines.
 */
export function runScoringSystem(snapshot: PageSnapshot): ScoringSystemResult {
  const breakdown: EngineResult[] = [runCROEngine(snapshot), runSEOEngine(snapshot), runGEOEngine(snapshot), runTrustEngine(snapshot)];
  const overallScore = weightedPillarScore(breakdown);

  const performance = runPerformanceEngine(snapshot);
  const accessibility = runAccessibilityEngine(snapshot);
  const security = runSecurityEngine(snapshot);
  const content = runContentEngine(snapshot);
  const ux = runUXEngine(snapshot);
  const ui = runUIEngine(snapshot);
  const ecommerce = runEcommerceEngine(snapshot);
  const brand = runBrandEngine(snapshot);
  const mobile = runMobileEngine(snapshot);

  const categoryResults: CategoryResult[] = [
    // Current coverage (mapped):
    { category: "cro", ...breakdown.find((b) => b.pillar === "conversion")!, missing: false },
    { category: "technical_seo", ...breakdown.find((b) => b.pillar === "seo")!, missing: false },
    { category: "geo", ...breakdown.find((b) => b.pillar === "geo")!, missing: false },
    security,

    // Missing categories (to be implemented):
    performance,
    accessibility,
    content,
    ux,
    ui,
    ecommerce,
    brand,
    mobile,
  ];

  return { overallScore, breakdown, categoryResults };
}

