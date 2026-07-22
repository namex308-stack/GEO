import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth/get-user";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  ONBOARDING_ANSWER_KEYS,
  isQuizComplete,
} from "@/lib/onboarding/validate";
import {
  FLOW_STEPS,
  mergeOnboardingFlow,
  syncFlowToLocalStorage,
  type FlowStep,
} from "@/lib/workflow/flow-state";

const QuizBody = z.object({
  platform: z.string().min(1),
  storeStage: z.string().min(1),
  challenge: z.string().min(1),
  primaryGoal: z.string().min(1),
  priceRange: z.string().min(1),
  trafficSource: z.string().min(1),
});

const PatchBody = z.object({
  platform: z.string().min(1).optional(),
  storeStage: z.string().min(1).optional(),
  challenge: z.string().min(1).optional(),
  primaryGoal: z.string().min(1).optional(),
  priceRange: z.string().min(1).optional(),
  trafficSource: z.string().min(1).optional(),
  flowStep: z.enum(FLOW_STEPS as [FlowStep, ...FlowStep[]]).optional(),
  connectedWebsite: z.string().optional(),
  lastAuditId: z.string().optional(),
  flowComplete: z.string().optional(),
});

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("onboarding")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const onboarding = (profile?.onboarding as Record<string, string> | null) ?? null;

  return NextResponse.json({
    completed: isQuizComplete(onboarding),
    quizComplete: isQuizComplete(onboarding),
    flowComplete: onboarding?.flowComplete === "true",
    onboarding,
  });
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = QuizBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid onboarding answers", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("onboarding")
    .eq("id", user.id)
    .single();

  const prev = (existing?.onboarding as Record<string, string> | null) ?? {};
  const onboarding = mergeOnboardingFlow(prev, {
    ...parsed.data,
    flowStep: "connect",
  });

  for (const key of ONBOARDING_ANSWER_KEYS) {
    if (!onboarding[key]) {
      return NextResponse.json({ error: `Missing answer: ${key}` }, { status: 400 });
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, onboarding });
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid patch", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("onboarding")
    .eq("id", user.id)
    .single();

  const prev = (existing?.onboarding as Record<string, string> | null) ?? {};
  const patch = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined)
  ) as Record<string, string>;

  const onboarding = mergeOnboardingFlow(prev, patch);

  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Client-side localStorage sync is handled by callers via patchFlowState
  void syncFlowToLocalStorage;

  return NextResponse.json({ ok: true, onboarding });
}
