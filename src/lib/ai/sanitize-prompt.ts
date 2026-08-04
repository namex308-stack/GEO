/**
 * Sanitize untrusted strings before embedding in LLM prompts.
 */

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Strip control chars, collapse whitespace, cap length. */
export function sanitizePromptText(input: unknown, maxLen = 500): string {
  if (typeof input !== "string") return "";
  return input
    .replace(CONTROL_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

/** Neutralize common instruction-injection patterns in user-provided fields. */
export function sanitizeUserContextField(input: unknown, maxLen = 200): string {
  let s = sanitizePromptText(input, maxLen);
  // Neutralize role/instruction hijacks without deleting legitimate product copy.
  s = s.replace(
    /\b(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?)\b/gi,
    "[filtered]"
  );
  s = s.replace(/\b(system|assistant)\s*:/gi, "[filtered]:");
  s = s.replace(/```[\s\S]*?```/g, "[code omitted]");
  return s.slice(0, maxLen);
}

export function sanitizeOnboarding(onboarding: {
  platform?: string;
  challenge?: string;
  priceRange?: string;
  audience?: string;
  referral?: string;
  businessName?: string;
  storeUrl?: string;
  country?: string;
  primaryLanguage?: string;
  storeSize?: string;
  businessCategory?: string;
  primaryGoal?: string;
  monthlyTraffic?: string;
  monthlyOrders?: string;
  mainChallenge?: string;
  competitorUrl?: string;
} | null): {
  platform: string;
  challenge: string;
  priceRange: string;
  audience: string;
  referral: string;
  businessName: string;
  storeUrl: string;
  country: string;
  primaryLanguage: string;
  storeSize: string;
  businessCategory: string;
  primaryGoal: string;
  monthlyTraffic: string;
  monthlyOrders: string;
  mainChallenge: string;
  competitorUrl: string;
} | null {
  if (!onboarding) return null;
  const mainChallenge = sanitizeUserContextField(
    onboarding.mainChallenge || onboarding.challenge,
    120
  );
  const businessCategory = sanitizeUserContextField(
    onboarding.businessCategory || onboarding.audience,
    80
  );
  const storeSize = sanitizeUserContextField(
    onboarding.storeSize || onboarding.priceRange,
    40
  );
  const primaryGoal = sanitizeUserContextField(
    onboarding.primaryGoal || onboarding.referral,
    80
  );
  return {
    platform: sanitizeUserContextField(onboarding.platform, 80),
    challenge: mainChallenge,
    priceRange: storeSize,
    audience: businessCategory,
    referral: primaryGoal,
    businessName: sanitizeUserContextField(onboarding.businessName, 120),
    storeUrl: sanitizeUserContextField(onboarding.storeUrl, 300),
    country: sanitizeUserContextField(onboarding.country, 40),
    primaryLanguage: sanitizeUserContextField(onboarding.primaryLanguage, 40),
    storeSize,
    businessCategory,
    primaryGoal,
    monthlyTraffic: sanitizeUserContextField(onboarding.monthlyTraffic, 40),
    monthlyOrders: sanitizeUserContextField(onboarding.monthlyOrders, 40),
    mainChallenge,
    competitorUrl: sanitizeUserContextField(onboarding.competitorUrl, 300),
  };
}
