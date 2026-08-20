/**
 * Pure plan entitlement helpers — feature flags + stores limit.
 * No Supabase imports; safe for unit tests.
 */

import type { PlanLimits } from "@/lib/dashboard/types";

export type PlanFeature =
  | "competitor"
  | "aiGenerator"
  | "api"
  | "competitorMonitoring"
  | "weeklyMonitoring"
  | "automatedAlerts";

export const ENTITLEMENT_CODES = {
  COMPETITOR_LOCKED: "COMPETITOR_LOCKED",
  AI_GENERATOR_LOCKED: "AI_GENERATOR_LOCKED",
  API_LOCKED: "API_LOCKED",
  COMPETITOR_MONITORING_LOCKED: "COMPETITOR_MONITORING_LOCKED",
  WEEKLY_MONITORING_LOCKED: "WEEKLY_MONITORING_LOCKED",
  AUTOMATED_ALERTS_LOCKED: "AUTOMATED_ALERTS_LOCKED",
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
    case "competitorMonitoring":
      return Boolean(plan.features.competitorMonitoring);
    case "weeklyMonitoring":
      return Boolean(plan.features.weeklyMonitoring);
    case "automatedAlerts":
      return Boolean(plan.features.automatedAlerts);
    default: {
      const _exhaustive: never = feature;
      return _exhaustive;
    }
  }
}

/**
 * Whether a workspace may add another store.
 * `storesLimit === null` means unlimited (legacy); current Business uses a finite cap.
 */
export function canCreateStore(
  currentStoreCount: number,
  storesLimit: number | null
): boolean {
  if (storesLimit == null) return true;
  return currentStoreCount < storesLimit;
}

export type StoreEnsureDecision =
  | { action: "update" }
  | { action: "insert" }
  | { action: "reject"; used: number; limit: number };

/**
 * Oldest-first ids that remain in-quota for this workspace.
 * Pass only this workspace's store ids — other workspaces must not be included.
 */
export function oldestAllowedStoreIds(
  storeIdsOldestFirst: string[],
  storesLimit: number | null | undefined
): string[] {
  if (storesLimit == null) return storeIdsOldestFirst;
  return storeIdsOldestFirst.slice(0, storesLimit);
}

/**
 * Decide insert vs update vs reject for ensureWorkspaceStore.
 * `storesLimit === undefined` skips enforcement (legacy callers).
 * `storesLimit === null` is unlimited (legacy); current Business uses a finite cap.
 *
 * Same-URL updates are allowed only for in-quota stores. An extra row that
 * already exists (e.g. inserted by a former client RLS bypass) is rejected
 * instead of being treated as a legitimate existing store.
 */
export function decideStoreEnsure(input: {
  existingId: string | null;
  currentCount: number;
  storesLimit: number | null | undefined;
  oldestAllowedStoreIds: string[];
}): StoreEnsureDecision {
  const { existingId, currentCount, storesLimit, oldestAllowedStoreIds } = input;

  if (existingId) {
    if (
      storesLimit != null &&
      currentCount > storesLimit &&
      !oldestAllowedStoreIds.includes(existingId)
    ) {
      return { action: "reject", used: currentCount, limit: storesLimit };
    }
    return { action: "update" };
  }

  if (typeof storesLimit === "number" && !canCreateStore(currentCount, storesLimit)) {
    return { action: "reject", used: currentCount, limit: storesLimit };
  }

  return { action: "insert" };
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

export function competitorMonitoringLockedMessage(): string {
  return "مراقبة المنافسين المتقدمة غير متاحة في باقتك الحالية. قم بالترقية لباقة الأعمال للمتابعة.";
}

export function weeklyMonitoringLockedMessage(): string {
  return "المراقبة الأسبوعية غير متاحة في باقتك الحالية. قم بالترقية لباقة الأعمال للمتابعة.";
}

export function automatedAlertsLockedMessage(): string {
  return "التنبيهات الآلية غير متاحة في باقتك الحالية. قم بالترقية لباقة الأعمال للمتابعة.";
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
    case "competitorMonitoring":
      return {
        error: competitorMonitoringLockedMessage(),
        code: ENTITLEMENT_CODES.COMPETITOR_MONITORING_LOCKED,
        plan: planId,
      };
    case "weeklyMonitoring":
      return {
        error: weeklyMonitoringLockedMessage(),
        code: ENTITLEMENT_CODES.WEEKLY_MONITORING_LOCKED,
        plan: planId,
      };
    case "automatedAlerts":
      return {
        error: automatedAlertsLockedMessage(),
        code: ENTITLEMENT_CODES.AUTOMATED_ALERTS_LOCKED,
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
