/**
 * Server-side onboarding completion policy.
 * Client `markComplete` / last-step number are never sufficient to complete.
 */

import { ONBOARDING_STEP_COUNT } from "@/lib/onboarding/constants";
import { STEP_SCHEMAS } from "@/lib/onboarding/schema";

export type OnboardingFieldSource = {
  businessName?: string;
  storeUrl?: string;
  country?: string;
  platform?: string;
  competitorUrl?: string;
};

export type OnboardingSaveDecision =
  | { action: "reject"; code: "INCOMPLETE_REQUIRED_FIELDS" }
  | { action: "save"; complete: boolean };

function overlay(
  incoming: string | undefined,
  existing: string | undefined
): string {
  if (incoming !== undefined) return incoming;
  return existing ?? "";
}

export function mergeOnboardingFields(
  existing: OnboardingFieldSource,
  incoming: OnboardingFieldSource
): OnboardingFieldSource {
  return {
    businessName: overlay(incoming.businessName, existing.businessName),
    storeUrl: overlay(incoming.storeUrl, existing.storeUrl),
    country: overlay(incoming.country, existing.country),
    platform: overlay(incoming.platform, existing.platform),
    competitorUrl: overlay(incoming.competitorUrl, existing.competitorUrl),
  };
}

/** Required wizard fields: business name, store URL, country, platform. */
export function hasRequiredOnboardingFields(
  answers: OnboardingFieldSource
): boolean {
  const storeUrl = (answers.storeUrl ?? "").trim();
  return (
    STEP_SCHEMAS["business-name"].safeParse({
      businessName: answers.businessName ?? "",
    }).success &&
    STEP_SCHEMAS["store-url"].safeParse({ storeUrl }).success &&
    STEP_SCHEMAS.country.safeParse({ country: answers.country ?? "" }).success &&
    STEP_SCHEMAS.platform.safeParse({ platform: answers.platform ?? "" }).success
  );
}

/**
 * Decide whether a PATCH may persist, and whether it may set
 * `onboarding_completed_at`. `markComplete` only detects a finish attempt
 * (to reject incomplete ones); it never grants completion.
 */
export function decideOnboardingSave(input: {
  existing: OnboardingFieldSource;
  incoming: OnboardingFieldSource;
  step: number;
  skip?: boolean;
  markComplete?: boolean;
}): OnboardingSaveDecision {
  const merged = mergeOnboardingFields(input.existing, input.incoming);
  if (input.skip && input.step >= ONBOARDING_STEP_COUNT) {
    merged.competitorUrl = "";
  }

  const fieldsOk = hasRequiredOnboardingFields(merged);
  const requestedFinish =
    Boolean(input.markComplete) || input.step >= ONBOARDING_STEP_COUNT;

  if (requestedFinish && !fieldsOk) {
    return { action: "reject", code: "INCOMPLETE_REQUIRED_FIELDS" };
  }

  return {
    action: "save",
    complete: fieldsOk && input.step >= ONBOARDING_STEP_COUNT,
  };
}
