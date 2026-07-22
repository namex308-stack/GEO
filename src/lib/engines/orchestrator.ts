import type { PageSnapshot, EngineResult, OrchestratorResult } from "./types";
import type { SiteSignals } from "./site-signals";
import type { Recommendation } from "@/lib/types";
import type { PlanId } from "@/lib/billing/plans";
import { buildSnapshot } from "./snapshot";
import { runScoringSystem } from "./scoring-system";
import { lookupQuickFix, resolveIssueCode } from "@/lib/constants/quick-fixes";

export function runEngines(
  productUrl: string,
  productScraped: { markdown: string; html?: string },
  competitorUrl?: string,
  competitorScraped?: { markdown: string; html?: string } | null,
  siteSignals?: SiteSignals
): OrchestratorResult {
  const productSnapshot = buildSnapshot(productUrl, productScraped, siteSignals);
  const productScoring = runScoringSystem(productSnapshot);
  const breakdown = productScoring.breakdown;
  const overallScore = productScoring.overallScore;

  let competitorBreakdown: EngineResult[] | undefined;
  let competitorScore: number | undefined;

  if (competitorUrl && competitorScraped) {
    const compSnapshot = buildSnapshot(competitorUrl, competitorScraped);
    const compScoring = runScoringSystem(compSnapshot);
    competitorBreakdown = compScoring.breakdown;
    competitorScore = compScoring.overallScore;
  }

  return { overallScore, breakdown, competitorBreakdown, competitorScore };
}

/**
 * Attach Quick Fixes payloads to audit recommendations based on the user's plan.
 * Free users see upgradeRequired; Pro/Business get code snippets and steps.
 */
export function enrichIssues(issues: Recommendation[], userPlan: PlanId): Recommendation[] {
  return issues.map((issue) => {
    if (userPlan === "free") {
      const issueCode = resolveIssueCode(issue.id, issue.problem);
      const preview = issueCode ? lookupQuickFix(issueCode) : null;
      return {
        ...issue,
        hasFix: false,
        upgradeRequired: true,
        issueCode: issueCode ?? undefined,
        quickFix: preview
          ? { ...preview, codeSnippet: preview.codeSnippet.slice(0, 120) + "…" }
          : undefined,
      };
    }

    const issueCode = resolveIssueCode(issue.id, issue.problem);
    const fix = issueCode ? lookupQuickFix(issueCode) : null;

    if (!fix) {
      return { ...issue, hasFix: false, upgradeRequired: false, issueCode: issueCode ?? undefined };
    }

    return {
      ...issue,
      hasFix: true,
      upgradeRequired: false,
      issueCode: issueCode ?? undefined,
      quickFix: fix,
    };
  });
}
