import type { PlanId } from "@/lib/billing/plans";
import {
  canCompare,
  canExportPdf,
  canRunAudit as entitlementsCanRunAudit,
  canUseMonitoring,
  getPlanLimits,
} from "@/lib/billing/entitlements";
import { resolveEffectivePlan } from "@/lib/billing/dev-unlock";

export type PlanFeature =
  | "pdf"
  | "quickFixes"
  | "contentImprover"
  | "competitor"
  | "watchdog"
  | "generate"
  | "crawl";

/** Whether the plan may start another audit this month. */
export function canRunAudit(plan: PlanId, auditsUsed: number): boolean {
  return entitlementsCanRunAudit(resolveEffectivePlan(plan), auditsUsed);
}

/**
 * Remaining audits this period.
 * `null` = unlimited (Business).
 */
export function getRemainingAudits(plan: PlanId, auditsUsed: number): number | null {
  const limit = getPlanLimits(resolveEffectivePlan(plan)).auditsPerMonth;
  if (limit === null) return null;
  return Math.max(0, limit - auditsUsed);
}

/** Feature gates used across PDF / QuickFixes / ContentImprover / Competitor / Watchdog. */
export function canAccessFeature(plan: PlanId, feature: PlanFeature): boolean {
  const effective = resolveEffectivePlan(plan);
  switch (feature) {
    case "pdf":
      return canExportPdf(effective);
    case "quickFixes":
      return effective === "pro" || effective === "business";
    case "contentImprover":
      return effective === "pro" || effective === "business";
    case "competitor":
      return canCompare(effective);
    case "watchdog":
      return canUseMonitoring(effective);
    case "generate":
      return effective === "pro" || effective === "business";
    case "crawl":
      return getPlanLimits(effective).canCrawl;
    default:
      return false;
  }
}

export function minPlanForFeature(feature: PlanFeature): Exclude<PlanId, "free"> {
  switch (feature) {
    case "watchdog":
    case "crawl":
      return "pro";
    default:
      return "pro";
  }
}
