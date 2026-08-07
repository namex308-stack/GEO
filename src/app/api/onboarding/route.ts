import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/require-api-user";
import {
  getOnboardingState,
  saveOnboardingStep,
  updateOnboardingAnswers,
} from "@/lib/db/onboarding-repository";
import { ONBOARDING_STEPS, isOptionalStep, slugFromStepNumber } from "@/lib/onboarding/constants";
import { probeStoreUrl } from "@/lib/onboarding/probe-store";
import {
  OnboardingProfilePartialSchema,
  SaveOnboardingBodySchema,
  STEP_SCHEMAS,
  normalizeStoreUrl,
} from "@/lib/onboarding/schema";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const state = await getOnboardingState(auth.user.id);
  if (!state) {
    return NextResponse.json({ error: "تعذّر تحميل ملف الإعداد." }, { status: 503 });
  }

  return NextResponse.json({ onboarding: state });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "بيانات JSON غير صالحة." }, { status: 400 });
  }

  const mode = (json as { mode?: string } | null)?.mode;

  // Settings full edit — update answers without advancing the wizard.
  if (mode === "settings") {
    const parsed = z
      .object({ answers: OnboardingProfilePartialSchema })
      .safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "إجابات الإعداد غير صالحة", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const state = await updateOnboardingAnswers(auth.user.id, parsed.data.answers);
    if (!state) {
      return NextResponse.json({ error: "تعذّر حفظ إجابات الإعداد." }, { status: 503 });
    }
    return NextResponse.json({ onboarding: state });
  }

  const parsed = SaveOnboardingBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "بيانات الإعداد غير صالحة", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { step, answers, skip, markComplete } = parsed.data;
  const slug = slugFromStepNumber(step);
  const schema = STEP_SCHEMAS[slug];

  if (!skip) {
    const stepCheck = schema.safeParse(answers);
    if (!stepCheck.success) {
      return NextResponse.json(
        { error: "فشل التحقق من صحة البيانات", details: stepCheck.error.flatten() },
        { status: 400 }
      );
    }
  } else if (!isOptionalStep(slug)) {
    return NextResponse.json({ error: "هذه الخطوة مطلوبة ولا يمكن تخطيها." }, { status: 400 });
  }

  let mergedAnswers = { ...answers };

  // Arabic-first product default — language step removed from the wizard.
  if (!mergedAnswers.primaryLanguage) {
    mergedAnswers.primaryLanguage = "ar";
  }

  // Store URL step: verify reachability, detect platform, persist probe metadata.
  if (slug === "store-url" && !skip) {
    const probe = await probeStoreUrl(answers.storeUrl ?? "");
    if (!probe.ok) {
      return NextResponse.json(
        { error: probe.error, code: probe.code },
        { status: 422 }
      );
    }

    mergedAnswers = {
      ...mergedAnswers,
      storeUrl: probe.storeUrl,
      storeDomain: probe.domain,
      homepageTitle: probe.homepageTitle,
      platform: probe.platform,
      platformConfidence: probe.confidence,
      storeVerifiedAt: new Date().toISOString(),
      primaryLanguage: mergedAnswers.primaryLanguage || "ar",
    };
  }

  // Keep competitor optional URL normalized when provided.
  if (slug === "competitor" && mergedAnswers.competitorUrl) {
    mergedAnswers.competitorUrl = normalizeStoreUrl(mergedAnswers.competitorUrl);
  }

  const state = await saveOnboardingStep({
    userId: auth.user.id,
    step,
    answers: mergedAnswers,
    skip,
    markComplete: markComplete || step >= ONBOARDING_STEPS.length,
  });

  if (!state) {
    return NextResponse.json({ error: "تعذّر حفظ خطوة الإعداد." }, { status: 503 });
  }

  return NextResponse.json({ onboarding: state });
}
