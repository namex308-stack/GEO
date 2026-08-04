/**
 * Onboarding profile persistence — Supabase profiles table is the source of truth.
 */

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  ONBOARDING_STEP_COUNT,
  computeResumeStep,
  onboardingPathForStep,
} from "@/lib/onboarding/constants";
import { normalizeStoreUrl, type OnboardingProfilePartial } from "@/lib/onboarding/schema";
import type { OnboardingAnswers } from "@/lib/types";

export type OnboardingProfileRow = {
  businessName: string;
  storeUrl: string;
  country: string;
  primaryLanguage: string;
  platform: string;
  storeSize: string;
  businessCategory: string;
  primaryGoal: string;
  monthlyTraffic: string;
  monthlyOrders: string;
  mainChallenge: string;
  competitorUrl: string;
  storeDomain: string;
  homepageTitle: string;
  platformConfidence: number | null;
  storeVerifiedAt: string | null;
  onboardingStep: number;
  onboardingCompletedAt: string | null;
};

export type OnboardingState = OnboardingProfileRow & {
  completed: boolean;
  resumePath: string;
};

const EMPTY: OnboardingProfileRow = {
  businessName: "",
  storeUrl: "",
  country: "",
  primaryLanguage: "",
  platform: "",
  storeSize: "",
  businessCategory: "",
  primaryGoal: "",
  monthlyTraffic: "",
  monthlyOrders: "",
  mainChallenge: "",
  competitorUrl: "",
  storeDomain: "",
  homepageTitle: "",
  platformConfidence: null,
  storeVerifiedAt: null,
  onboardingStep: 1,
  onboardingCompletedAt: null,
};

type ProfileRow = {
  business_name: string | null;
  store_url: string | null;
  country: string | null;
  primary_language: string | null;
  platform: string | null;
  store_size: string | null;
  business_category: string | null;
  primary_goal: string | null;
  monthly_traffic: string | null;
  monthly_orders: string | null;
  main_challenge: string | null;
  competitor_url: string | null;
  store_domain: string | null;
  homepage_title: string | null;
  platform_confidence: number | string | null;
  store_verified_at: string | null;
  onboarding_step: number | null;
  onboarding_completed_at: string | null;
};

function mapConfidence(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(1, n));
}

function mapRow(row: ProfileRow | null | undefined): OnboardingProfileRow {
  if (!row) return { ...EMPTY };
  return {
    businessName: row.business_name ?? "",
    storeUrl: row.store_url ?? "",
    country: row.country ?? "",
    primaryLanguage: row.primary_language ?? "",
    platform: row.platform ?? "",
    storeSize: row.store_size ?? "",
    businessCategory: row.business_category ?? "",
    primaryGoal: row.primary_goal ?? "",
    monthlyTraffic: row.monthly_traffic ?? "",
    monthlyOrders: row.monthly_orders ?? "",
    mainChallenge: row.main_challenge ?? "",
    competitorUrl: row.competitor_url ?? "",
    storeDomain: row.store_domain ?? "",
    homepageTitle: row.homepage_title ?? "",
    platformConfidence: mapConfidence(row.platform_confidence),
    storeVerifiedAt: row.store_verified_at,
    onboardingStep: Math.max(1, Math.min(ONBOARDING_STEP_COUNT + 1, row.onboarding_step ?? 1)),
    onboardingCompletedAt: row.onboarding_completed_at,
  };
}

function toState(profile: OnboardingProfileRow): OnboardingState {
  const completed = Boolean(profile.onboardingCompletedAt);
  // Prefer answered fields over a stale step counter (schema splits / resume).
  const resumeStep = completed
    ? ONBOARDING_STEP_COUNT + 1
    : computeResumeStep(profile);
  return {
    ...profile,
    onboardingStep: resumeStep,
    completed,
    resumePath: completed ? "/onboarding/done" : onboardingPathForStep(resumeStep),
  };
}

const SELECT_COLS =
  "business_name, store_url, country, primary_language, platform, store_size, business_category, primary_goal, monthly_traffic, monthly_orders, main_challenge, competitor_url, store_domain, homepage_title, platform_confidence, store_verified_at, onboarding_step, onboarding_completed_at";

async function ensureProfileRow(userId: string): Promise<void> {
  const sb = await createSupabaseServerClient();
  if (!sb) return;

  const { data } = await sb.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (data) return;

  const { error } = await sb.from("profiles").insert({ id: userId });
  if (error) {
    // Fall back to admin if RLS insert fails (e.g. older policies).
    const admin = getSupabaseAdmin();
    if (admin) {
      await admin.from("profiles").upsert({ id: userId }, { onConflict: "id" });
    } else {
      console.error("[onboarding] ensure profile failed:", error.message);
    }
  }
}

export async function getOnboardingState(userId: string): Promise<OnboardingState | null> {
  const sb = await createSupabaseServerClient();
  if (!sb) return null;

  await ensureProfileRow(userId);

  const { data, error } = await sb
    .from("profiles")
    .select(SELECT_COLS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[onboarding] get failed:", error.message);
    return toState({ ...EMPTY });
  }

  return toState(mapRow(data as ProfileRow | null));
}

/** Lightweight gate check for middleware / server layouts. */
export async function isOnboardingComplete(userId: string): Promise<boolean | null> {
  const sb = await createSupabaseServerClient();
  if (!sb) return null;

  const { data, error } = await sb
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[onboarding] complete check failed:", error.message);
    return null;
  }

  return Boolean(data?.onboarding_completed_at);
}

function applyAnswerPatch(
  patch: Record<string, unknown>,
  a: OnboardingProfilePartial
): void {
  if (a.businessName !== undefined) patch.business_name = a.businessName.trim();
  if (a.storeUrl !== undefined) patch.store_url = normalizeStoreUrl(a.storeUrl);
  if (a.country !== undefined) patch.country = a.country;
  if (a.primaryLanguage !== undefined) patch.primary_language = a.primaryLanguage;
  if (a.platform !== undefined) patch.platform = a.platform;
  if (a.storeSize !== undefined) patch.store_size = a.storeSize;
  if (a.businessCategory !== undefined) patch.business_category = a.businessCategory;
  if (a.primaryGoal !== undefined) patch.primary_goal = a.primaryGoal;
  if (a.monthlyTraffic !== undefined) patch.monthly_traffic = a.monthlyTraffic;
  if (a.monthlyOrders !== undefined) patch.monthly_orders = a.monthlyOrders;
  if (a.mainChallenge !== undefined) patch.main_challenge = a.mainChallenge;
  if (a.competitorUrl !== undefined) {
    patch.competitor_url = a.competitorUrl.trim()
      ? normalizeStoreUrl(a.competitorUrl)
      : "";
  }
  if (a.storeDomain !== undefined) patch.store_domain = a.storeDomain.trim();
  if (a.homepageTitle !== undefined) patch.homepage_title = a.homepageTitle.trim();
  if (a.platformConfidence !== undefined) {
    patch.platform_confidence = a.platformConfidence;
  }
  if (a.storeVerifiedAt !== undefined) patch.store_verified_at = a.storeVerifiedAt;
}

export async function saveOnboardingStep(input: {
  userId: string;
  step: number;
  answers: OnboardingProfilePartial;
  skip?: boolean;
  markComplete?: boolean;
}): Promise<OnboardingState | null> {
  const sb = await createSupabaseServerClient();
  if (!sb) return null;

  await ensureProfileRow(input.userId);

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  applyAnswerPatch(patch, input.answers);

  if (input.skip && input.step === ONBOARDING_STEP_COUNT) {
    patch.competitor_url = "";
  }

  const nextStep = Math.min(ONBOARDING_STEP_COUNT + 1, input.step + 1);
  patch.onboarding_step = nextStep;

  const shouldComplete =
    Boolean(input.markComplete) || input.step >= ONBOARDING_STEP_COUNT;

  if (shouldComplete) {
    patch.onboarding_completed_at = new Date().toISOString();
    patch.onboarding_step = ONBOARDING_STEP_COUNT + 1;
  }

  const { data, error } = await sb
    .from("profiles")
    .update(patch)
    .eq("id", input.userId)
    .select(SELECT_COLS)
    .maybeSingle();

  if (error) {
    console.error("[onboarding] save failed:", error.message);
    return null;
  }

  return toState(mapRow(data as ProfileRow | null));
}

/** Full profile update from Settings (does not reset completion). */
export async function updateOnboardingAnswers(
  userId: string,
  answers: OnboardingProfilePartial
): Promise<OnboardingState | null> {
  const sb = await createSupabaseServerClient();
  if (!sb) return null;

  await ensureProfileRow(userId);

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  applyAnswerPatch(patch, answers);

  const { data, error } = await sb
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select(SELECT_COLS)
    .maybeSingle();

  if (error) {
    console.error("[onboarding] update failed:", error.message);
    return null;
  }

  return toState(mapRow(data as ProfileRow | null));
}

/** Map persisted profile → analyzer OnboardingAnswers (never mock). */
export function toAnalyzerOnboarding(state: OnboardingProfileRow | null): OnboardingAnswers | null {
  if (!state) return null;
  if (!state.platform && !state.mainChallenge && !state.businessCategory) return null;

  return {
    businessName: state.businessName,
    storeUrl: state.storeUrl,
    country: state.country,
    primaryLanguage: state.primaryLanguage,
    platform: state.platform,
    storeSize: state.storeSize,
    businessCategory: state.businessCategory,
    primaryGoal: state.primaryGoal,
    monthlyTraffic: state.monthlyTraffic,
    monthlyOrders: state.monthlyOrders,
    mainChallenge: state.mainChallenge,
    competitorUrl: state.competitorUrl,
    // Legacy aliases consumed by sanitize / prompts
    challenge: state.mainChallenge,
    audience: state.businessCategory,
    priceRange: state.storeSize,
    referral: state.primaryGoal,
  };
}
