/**
 * Onboarding step definitions — one question per step.
 * Pure module — safe for client and server.
 */

export const ONBOARDING_STEPS = [
  "business-name",
  "store-url",
  "country",
  "language",
  "platform",
  "store-size",
  "category",
  "goal",
  "traffic",
  "orders",
  "challenge",
  "competitor",
] as const;

export type OnboardingStepSlug = (typeof ONBOARDING_STEPS)[number];

export const ONBOARDING_STEP_COUNT = ONBOARDING_STEPS.length;

/** Profile field answered by each step. */
export const STEP_ANSWER_FIELD: Record<
  OnboardingStepSlug,
  | "businessName"
  | "storeUrl"
  | "country"
  | "primaryLanguage"
  | "platform"
  | "storeSize"
  | "businessCategory"
  | "primaryGoal"
  | "monthlyTraffic"
  | "monthlyOrders"
  | "mainChallenge"
  | "competitorUrl"
> = {
  "business-name": "businessName",
  "store-url": "storeUrl",
  country: "country",
  language: "primaryLanguage",
  platform: "platform",
  "store-size": "storeSize",
  category: "businessCategory",
  goal: "primaryGoal",
  traffic: "monthlyTraffic",
  orders: "monthlyOrders",
  challenge: "mainChallenge",
  competitor: "competitorUrl",
};

export function isOptionalStep(slug: OnboardingStepSlug): boolean {
  return slug === "competitor";
}

/** Step number is 1-indexed to match profiles.onboarding_step. */
export function stepNumberFromSlug(slug: string): number | null {
  const idx = ONBOARDING_STEPS.indexOf(slug as OnboardingStepSlug);
  return idx >= 0 ? idx + 1 : null;
}

export function slugFromStepNumber(step: number): OnboardingStepSlug {
  const clamped = Math.max(1, Math.min(ONBOARDING_STEP_COUNT, Math.floor(step) || 1));
  return ONBOARDING_STEPS[clamped - 1]!;
}

export function onboardingPathForStep(step: number): string {
  if (step > ONBOARDING_STEP_COUNT) return "/onboarding/done";
  return `/onboarding/${slugFromStepNumber(step)}`;
}

export function isOnboardingStepSlug(value: string): value is OnboardingStepSlug {
  return (ONBOARDING_STEPS as readonly string[]).includes(value);
}

/**
 * Resume at the first unanswered required step (or competitor if all required done).
 * Prefer answers over a stale onboarding_step after step-schema changes.
 */
export function computeResumeStep(answers: {
  businessName?: string;
  storeUrl?: string;
  country?: string;
  primaryLanguage?: string;
  platform?: string;
  storeSize?: string;
  businessCategory?: string;
  primaryGoal?: string;
  monthlyTraffic?: string;
  monthlyOrders?: string;
  mainChallenge?: string;
  competitorUrl?: string;
}): number {
  for (let i = 0; i < ONBOARDING_STEPS.length; i++) {
    const slug = ONBOARDING_STEPS[i]!;
    if (isOptionalStep(slug)) return i + 1;
    const field = STEP_ANSWER_FIELD[slug];
    const value = (answers[field] ?? "").toString().trim();
    if (!value) return i + 1;
  }
  return ONBOARDING_STEP_COUNT + 1;
}

/** Platform brand names stay Latin; only the two generic entries are localized. */
export const PLATFORM_OPTIONS = [
  { value: "shopify", label: "Shopify" },
  { value: "woocommerce", label: "WooCommerce" },
  { value: "salla", label: "Salla" },
  { value: "zid", label: "Zid" },
  { value: "magento", label: "Magento" },
  { value: "bigcommerce", label: "BigCommerce" },
  { value: "custom", label: "مخصص" },
  { value: "other", label: "أخرى" },
] as const;

export const STORE_SIZE_OPTIONS = [
  { value: "just_launched", label: "أُطلق مؤخراً" },
  { value: "small", label: "صغير" },
  { value: "medium", label: "متوسط" },
  { value: "large", label: "كبير" },
] as const;

export const CATEGORY_OPTIONS = [
  { value: "fashion", label: "أزياء" },
  { value: "beauty", label: "تجميل" },
  { value: "electronics", label: "إلكترونيات" },
  { value: "home", label: "منزل" },
  { value: "furniture", label: "أثاث" },
  { value: "food", label: "طعام" },
  { value: "health", label: "صحة" },
  { value: "automotive", label: "سيارات" },
  { value: "luxury", label: "فخامة" },
  { value: "other", label: "أخرى" },
] as const;

export const GOAL_OPTIONS = [
  { value: "increase_conversions", label: "زيادة التحويلات" },
  { value: "improve_seo", label: "تحسين SEO" },
  { value: "improve_geo", label: "تحسين ظهور GEO" },
  { value: "increase_trust", label: "زيادة الثقة" },
  { value: "improve_product_pages", label: "تحسين صفحات المنتجات" },
  { value: "increase_aov", label: "زيادة متوسط قيمة الطلب" },
] as const;

export const TRAFFIC_OPTIONS = [
  { value: "under_1k", label: "أقل من 1000" },
  { value: "1k_10k", label: "1000–10000" },
  { value: "10k_50k", label: "10000–50000" },
  { value: "50k_100k", label: "50000–100000" },
  { value: "100k_plus", label: "أكثر من 100000" },
] as const;

export const ORDERS_OPTIONS = [
  { value: "under_50", label: "أقل من 50" },
  { value: "50_200", label: "50–200" },
  { value: "200_1000", label: "200–1000" },
  { value: "1000_plus", label: "أكثر من 1000" },
] as const;

export const CHALLENGE_OPTIONS = [
  { value: "low_conversion", label: "تحويل ضعيف" },
  { value: "low_traffic", label: "زيارات منخفضة" },
  { value: "weak_seo", label: "SEO ضعيف" },
  { value: "weak_ai_visibility", label: "ظهور ضعيف في AI" },
  { value: "cart_abandonment", label: "سلات متروكة" },
  { value: "high_bounce_rate", label: "معدل ارتداد مرتفع" },
  { value: "dont_know", label: "لا أعرف" },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: "ar", label: "العربية" },
  { value: "en", label: "الإنجليزية" },
  { value: "fr", label: "الفرنسية" },
  { value: "de", label: "الألمانية" },
  { value: "es", label: "الإسبانية" },
  { value: "tr", label: "التركية" },
  { value: "other", label: "أخرى" },
] as const;

export const COUNTRY_OPTIONS = [
  { value: "EG", label: "مصر" },
  { value: "SA", label: "السعودية" },
  { value: "AE", label: "الإمارات العربية المتحدة" },
  { value: "KW", label: "الكويت" },
  { value: "QA", label: "قطر" },
  { value: "BH", label: "البحرين" },
  { value: "OM", label: "عُمان" },
  { value: "JO", label: "الأردن" },
  { value: "US", label: "الولايات المتحدة" },
  { value: "GB", label: "المملكة المتحدة" },
  { value: "DE", label: "ألمانيا" },
  { value: "FR", label: "فرنسا" },
  { value: "TR", label: "تركيا" },
  { value: "OTHER", label: "أخرى" },
] as const;

/** App routes locked until onboarding_completed_at is set. */
export const ONBOARDING_GATED_PREFIXES = [
  "/dashboard",
  "/audit",
  "/history",
  "/checkout",
  "/settings",
] as const;

export function isOnboardingGatedPath(pathname: string): boolean {
  return ONBOARDING_GATED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isOnboardingPath(pathname: string): boolean {
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}

export function platformLabel(value: string): string {
  const match = PLATFORM_OPTIONS.find((o) => o.value === value);
  return match?.label ?? (value ? value : "—");
}

export function countryLabel(value: string): string {
  const match = COUNTRY_OPTIONS.find((o) => o.value === value);
  return match?.label ?? (value ? value : "—");
}
