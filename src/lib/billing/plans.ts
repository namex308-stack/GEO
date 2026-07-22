export type PlanId = "free" | "pro" | "business";
export type BillingPeriod = "monthly" | "yearly";

export const PLAN_IDS = ["free", "pro", "business"] as const;

/** Kashier checkout amounts in EGP */
export const PLAN_PRICES: Record<
  Exclude<PlanId, "free">,
  Record<BillingPeriod, number>
> = {
  pro: { monthly: 199, yearly: 1490 },
  business: { monthly: 499, yearly: 3990 },
};

export function getCheckoutPrice(planId: Exclude<PlanId, "free">, period: BillingPeriod): number {
  return PLAN_PRICES[planId][period];
}

/**
 * Map Kashier paid amount (EGP) → plan + period.
 * Used by webhook when amount is present (199→pro, 499→business).
 */
export function mapAmountToPlan(amount: number): {
  plan: Exclude<PlanId, "free">;
  period: BillingPeriod;
} | null {
  const rounded = Math.round(Number(amount));
  if (rounded === PLAN_PRICES.pro.monthly) return { plan: "pro", period: "monthly" };
  if (rounded === PLAN_PRICES.pro.yearly) return { plan: "pro", period: "yearly" };
  if (rounded === PLAN_PRICES.business.monthly) return { plan: "business", period: "monthly" };
  if (rounded === PLAN_PRICES.business.yearly) return { plan: "business", period: "yearly" };
  return null;
}

export function formatEgp(amount: number): string {
  return amount.toLocaleString("en-EG");
}

export interface MarketingPlan {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  auditsLabel: string;
  highlight?: boolean;
  cta: string;
  featureKeys: readonly string[];
}

/** UI plan cards — i18n keys for features live in entitlements / i18n */
export const MARKETING_PLANS: MarketingPlan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "3 audits, basic score, and recent report history.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    auditsLabel: "3 audits / month",
    cta: "Start Free",
    featureKeys: [
      "plan.starter.f1",
      "plan.starter.f2",
      "plan.starter.f3",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Full analysis, Quick Fixes, and AI tools for growing stores.",
    monthlyPrice: 199,
    yearlyPrice: 1490,
    auditsLabel: "30 audits / month",
    highlight: true,
    cta: "Upgrade to Pro",
    featureKeys: [
      "plan.pro.f1",
      "plan.pro.f2",
      "plan.pro.f3",
      "plan.pro.f4",
      "plan.pro.f5",
      "plan.pro.f6",
      "plan.pro.f7",
    ],
  },
  {
    id: "business",
    name: "Business",
    tagline: "Unlimited audits, crawl, and 24/7 Watchdog monitoring.",
    monthlyPrice: 499,
    yearlyPrice: 3990,
    auditsLabel: "Unlimited audits",
    cta: "Upgrade to Business",
    featureKeys: [
      "plan.business.f1",
      "plan.business.f2",
      "plan.business.f3",
      "plan.business.f4",
      "plan.business.f5",
      "plan.business.f6",
      "plan.business.f7",
    ],
  },
];

export type ComparisonCell = "yes" | "no" | "partial";

export interface PlanComparisonRow {
  labelKey: string;
  free: ComparisonCell;
  pro: ComparisonCell;
  business: ComparisonCell;
  noteKey?: string;
}

export const PLAN_COMPARISON_ROWS: PlanComparisonRow[] = [
  { labelKey: "planCompare.audits", free: "partial", pro: "partial", business: "yes", noteKey: "planCompare.auditsNote" },
  { labelKey: "planCompare.overallScore", free: "yes", pro: "yes", business: "yes" },
  { labelKey: "planCompare.fullAnalysis", free: "no", pro: "yes", business: "yes" },
  { labelKey: "planCompare.aiRecommendations", free: "no", pro: "yes", business: "yes" },
  { labelKey: "planCompare.aiGenerator", free: "no", pro: "yes", business: "yes" },
  { labelKey: "planCompare.competitor", free: "no", pro: "partial", business: "yes", noteKey: "planCompare.competitorNote" },
  { labelKey: "planCompare.pdfExport", free: "no", pro: "yes", business: "yes" },
  { labelKey: "planCompare.websiteCrawl", free: "no", pro: "partial", business: "yes", noteKey: "planCompare.crawlNote" },
  { labelKey: "planCompare.weeklyReports", free: "no", pro: "yes", business: "yes" },
  { labelKey: "planCompare.teamMembers", free: "no", pro: "no", business: "yes" },
  { labelKey: "planCompare.whiteLabel", free: "no", pro: "no", business: "yes" },
  { labelKey: "planCompare.apiAccess", free: "no", pro: "no", business: "yes" },
  { labelKey: "planCompare.support", free: "partial", pro: "partial", business: "yes", noteKey: "planCompare.supportNote" },
];

export const PRICING_FAQ_KEYS = [
  { qKey: "pricingFaq.q1", aKey: "pricingFaq.a1" },
  { qKey: "pricingFaq.q2", aKey: "pricingFaq.a2" },
  { qKey: "pricingFaq.q3", aKey: "pricingFaq.a3" },
  { qKey: "pricingFaq.q4", aKey: "pricingFaq.a4" },
  { qKey: "pricingFaq.q5", aKey: "pricingFaq.a5" },
  { qKey: "pricingFaq.q6", aKey: "pricingFaq.a6" },
] as const;
