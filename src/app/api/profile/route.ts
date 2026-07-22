import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthUser } from "@/lib/auth/get-user";
import { getSupabaseAdmin } from "@/lib/supabase";
import { resolveEffectivePlan } from "@/lib/billing/dev-unlock";
import type { PlanId } from "@/lib/billing/plans";

const PatchBody = z.object({
  name: z.string().min(1).max(120).optional(),
  company: z.string().max(120).optional(),
  country: z.string().max(80).optional(),
});

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const { data: profile, error } = await sb
      .from("profiles")
      .select("id, name, email, plan, onboarding, created_at")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const onboarding = (profile.onboarding as Record<string, string> | null) ?? {};

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: profile.name ?? user.user_metadata?.full_name ?? "",
        email: profile.email ?? user.email ?? "",
        plan: resolveEffectivePlan(profile.plan as PlanId),
        company: onboarding.company ?? "",
        country: onboarding.country ?? "",
        createdAt: profile.created_at,
        flowStep: onboarding.flowStep ?? null,
        connectedWebsite: onboarding.connectedWebsite ?? null,
        lastAuditId: onboarding.lastAuditId ?? null,
        flowComplete: onboarding.flowComplete === "true",
      },
    });
  } catch (err) {
    console.error("[api/profile] GET error:", err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = PatchBody.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const { data: existing } = await sb
      .from("profiles")
      .select("onboarding")
      .eq("id", user.id)
      .single();

    const onboarding = { ...((existing?.onboarding as Record<string, string> | null) ?? {}) };
    if (parsed.data.company !== undefined) onboarding.company = parsed.data.company;
    if (parsed.data.country !== undefined) onboarding.country = parsed.data.country;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      onboarding,
    };
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;

    const { data: profile, error } = await sb
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("id, name, email, plan, onboarding, created_at")
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    const merged = (profile.onboarding as Record<string, string> | null) ?? {};

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: profile.name ?? "",
        email: profile.email ?? user.email ?? "",
        plan: resolveEffectivePlan(profile.plan as PlanId),
        company: merged.company ?? "",
        country: merged.country ?? "",
        createdAt: profile.created_at,
      },
    });
  } catch (err) {
    console.error("[api/profile] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
