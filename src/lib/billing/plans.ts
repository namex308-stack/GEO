export type PlanId = "free" | "pro" | "business";
export type BillingPeriod = "monthly" | "yearly";

export const PLAN_IDS = ["free", "pro", "business"] as const;

/** Kashier checkout amounts in EGP — authoritative paid-plan prices. */
export const PLAN_PRICES: Record<
  Exclude<PlanId, "free">,
  Record<BillingPeriod, number>
> = {
  pro: { monthly: 399, yearly: 3990 },
  business: { monthly: 999, yearly: 9990 },
};

/** Authoritative monthly usage / store limits (mirrored in plan_catalog). */
export const PLAN_LIMITS = {
  free: {
    auditsPerMonth: 3,
    aiGensPerMonth: 0,
    storesLimit: 1,
  },
  pro: {
    auditsPerMonth: 50,
    aiGensPerMonth: 100,
    storesLimit: 5,
  },
  business: {
    auditsPerMonth: 200,
    aiGensPerMonth: 400,
    storesLimit: 15,
  },
} as const satisfies Record<
  PlanId,
  { auditsPerMonth: number; aiGensPerMonth: number; storesLimit: number }
>;

export function getCheckoutPrice(planId: Exclude<PlanId, "free">, period: BillingPeriod): number {
  return PLAN_PRICES[planId][period];
}

/**
 * Map Kashier paid amount (EGP) → plan + period.
 * Used by webhook when amount is present (399→pro, 999→business).
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

/** Exact EGP saved vs paying monthly for 12 months. */
export function yearlySavingsEgp(planId: Exclude<PlanId, "free">): number {
  const { monthly, yearly } = PLAN_PRICES[planId];
  return monthly * 12 - yearly;
}

export function formatEgp(amount: number): string {
  return amount.toLocaleString("ar-EG");
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

/** UI plan cards — prices always mirror PLAN_PRICES / free zero. */
export const MARKETING_PLANS: MarketingPlan[] = [
  {
    id: "free",
    name: "مجاني",
    tagline: "ابدأ بتحليل أساسي واكشف فرص التحويل دون التزام.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    auditsLabel: "3 تحليلات / شهر",
    cta: "ابدأ مجاناً",
    featureKeys: [
      "plan.starter.f1",
      "plan.starter.f2",
      "plan.starter.f3",
      "plan.starter.f4",
      "plan.starter.f5",
    ],
  },
  {
    id: "pro",
    name: "احترافي",
    tagline: "الخطة المناسبة للمتاجر الجادة: تحليل كامل، منافسون، واستوديو AI.",
    monthlyPrice: PLAN_PRICES.pro.monthly,
    yearlyPrice: PLAN_PRICES.pro.yearly,
    auditsLabel: "50 تحليلاً / شهر",
    highlight: true,
    cta: "الترقية للاحترافي",
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
    name: "أعمال",
    tagline: "حدود أعلى ومراقبة مستمرة للفرق التي تدير عدة متاجر.",
    monthlyPrice: PLAN_PRICES.business.monthly,
    yearlyPrice: PLAN_PRICES.business.yearly,
    auditsLabel: "200 تحليل / شهر",
    cta: "الترقية للأعمال",
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
  { labelKey: "planCompare.audits", free: "partial", pro: "partial", business: "partial", noteKey: "planCompare.auditsNote" },
  { labelKey: "planCompare.overallScore", free: "yes", pro: "yes", business: "yes" },
  { labelKey: "planCompare.fullAnalysis", free: "yes", pro: "yes", business: "yes" },
  { labelKey: "planCompare.aiRecommendations", free: "yes", pro: "yes", business: "yes" },
  { labelKey: "planCompare.aiGenerator", free: "no", pro: "yes", business: "yes" },
  { labelKey: "planCompare.competitor", free: "no", pro: "yes", business: "yes", noteKey: "planCompare.competitorNote" },
  { labelKey: "planCompare.websiteCrawl", free: "partial", pro: "yes", business: "yes", noteKey: "planCompare.crawlNote" },
  { labelKey: "planCompare.support", free: "partial", pro: "yes", business: "yes", noteKey: "planCompare.supportNote" },
];

export const PRICING_FAQ_KEYS = [
  { qKey: "pricingFaq.q1", aKey: "pricingFaq.a1" },
  { qKey: "pricingFaq.q2", aKey: "pricingFaq.a2" },
  { qKey: "pricingFaq.q3", aKey: "pricingFaq.a3" },
  { qKey: "pricingFaq.q4", aKey: "pricingFaq.a4" },
  { qKey: "pricingFaq.q5", aKey: "pricingFaq.a5" },
  { qKey: "pricingFaq.q6", aKey: "pricingFaq.a6" },
] as const;
