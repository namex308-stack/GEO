/**
 * Pure plan entitlement helpers — feature flags + stores limit.
 * No Supabase imports; safe for unit tests.
 */

import type { PlanLimits } from "@/lib/dashboard/types";

export type PlanFeature = "competitor" | "aiGenerator" | "api";

export const ENTITLEMENT_CODES = {
  COMPETITOR_LOCKED: "COMPETITOR_LOCKED",
  AI_GENERATOR_LOCKED: "AI_GENERATOR_LOCKED",
  API_LOCKED: "API_LOCKED",
  STORE_LIMIT_REACHED: "STORE_LIMIT_REACHED",
} as const;

export type EntitlementCode =
  (typeof ENTITLEMENT_CODES)[keyof typeof ENTITLEMENT_CODES];

export function isPlanFeatureEnabled(
  plan: Pick<PlanLimits, "features">,
  feature: PlanFeature
): boolean {
  switch (feature) {
    case "competitor":
      return Boolean(plan.features.competitor);
    case "aiGenerator":
      return Boolean(plan.features.aiGenerator);
    case "api":
      return Boolean(plan.features.api);
    default: {
      const _exhaustive: never = feature;
      return _exhaustive;
    }
  }
}

/**
 * Whether a workspace may add another store.
 * `storesLimit === null` means unlimited (Business).
 * Existing stores (updates) are not gated — callers must only invoke this for inserts.
 */
export function canCreateStore(
  currentStoreCount: number,
  storesLimit: number | null
): boolean {
  if (storesLimit == null) return true;
  return currentStoreCount < storesLimit;
}

export function competitorLockedMessage(): string {
  return "مقارنة المنافسين غير متاحة في باقتك الحالية. قم بالترقية للمتابعة.";
}

export function aiGeneratorLockedMessage(): string {
  return "مولّد AI غير متاح في باقتك الحالية. قم بالترقية للمتابعة.";
}

export function apiLockedMessage(): string {
  return "واجهة البرمجة (API) غير متاحة في باقتك الحالية. قم بالترقية لباقة الأعمال للمتابعة.";
}

export function storeLimitReachedMessage(
  planDisplayName: string,
  used: number,
  limit: number
): string {
  return `وصلت إلى حد المتاجر في باقة ${planDisplayName} (${used}/${limit}). قم بترقية باقتك لإضافة متجر آخر.`;
}

/** Deterministic 403 JSON body for a locked plan feature. */
export function featureLockedBody(
  feature: PlanFeature,
  planId: PlanLimits["planId"]
): { error: string; code: EntitlementCode; plan: PlanLimits["planId"] } {
  switch (feature) {
    case "competitor":
      return {
        error: competitorLockedMessage(),
        code: ENTITLEMENT_CODES.COMPETITOR_LOCKED,
        plan: planId,
      };
    case "aiGenerator":
      return {
        error: aiGeneratorLockedMessage(),
        code: ENTITLEMENT_CODES.AI_GENERATOR_LOCKED,
        plan: planId,
      };
    case "api":
      return {
        error: apiLockedMessage(),
        code: ENTITLEMENT_CODES.API_LOCKED,
        plan: planId,
      };
    default: {
      const _exhaustive: never = feature;
      return _exhaustive;
    }
  }
}

export function storeLimitReachedBody(
  plan: Pick<PlanLimits, "planId" | "displayName" | "storesLimit">,
  used: number
): {
  error: string;
  code: typeof ENTITLEMENT_CODES.STORE_LIMIT_REACHED;
  plan: PlanLimits["planId"];
  limit: number;
  used: number;
} {
  const limit = plan.storesLimit ?? used;
  return {
    error: storeLimitReachedMessage(plan.displayName, used, limit),
    code: ENTITLEMENT_CODES.STORE_LIMIT_REACHED,
    plan: plan.planId,
    limit,
    used,
  };
}
