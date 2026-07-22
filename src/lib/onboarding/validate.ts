import type { OnboardingAnswers } from "@/lib/types";
import {
  getFlowStep,
  isGuidedFlowComplete,
  resumePathForFlow,
  type FlowStep,
} from "@/lib/workflow/flow-state";

export const ONBOARDING_ANSWER_KEYS: (keyof OnboardingAnswers)[] = [
  "platform",
  "storeStage",
  "challenge",
  "primaryGoal",
  "priceRange",
  "trafficSource",
];

/** Quiz answers complete (legacy name kept for middleware compat). */
export function isOnboardingComplete(
  data: Record<string, string> | null | undefined
): boolean {
  return isQuizComplete(data);
}

export function isQuizComplete(
  data: Record<string, string> | null | undefined
): boolean {
  if (!data) return false;
  return ONBOARDING_ANSWER_KEYS.every(
    (key) => typeof data[key] === "string" && data[key].length > 0
  );
}

export { getFlowStep, isGuidedFlowComplete, resumePathForFlow };
export type { FlowStep };

/**
 * True when user must stay in the guided funnel (quiz incomplete OR
 * quiz done but first-run flow not marked complete).
 * Legacy users (quiz done, no flowStep) are treated as complete so they
 * are not trapped after this rollout.
 */
export function needsGuidedOnboarding(
  data: Record<string, string> | null | undefined
): boolean {
  if (!isQuizComplete(data)) return true;
  if (isGuidedFlowComplete(data)) return false;
  // Legacy: completed quiz before flow tracking existed
  if (!data?.flowStep) return false;
  return true;
}
