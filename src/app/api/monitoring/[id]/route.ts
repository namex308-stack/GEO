import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthUser } from "@/lib/auth/get-user";
import { getSupabaseAdmin } from "@/lib/supabase";
import { compareAudits, type AuditComparison } from "@/lib/crawl/summary";
import type { Audit } from "@/lib/database.types";
import type { ScoreBreakdown } from "@/lib/types";

const PatchBody = z.object({
  enabled: z.boolean().optional(),
  label: z.string().max(120).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    const sb = getSupabaseAdmin();

    if (!sb || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: job, error } = await sb
      .from("monitoring_jobs")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: "Monitoring job not found" }, { status: 404 });
    }

    let comparison: AuditComparison | null = null;
    let currentAudit: Audit | null = null;
    let previousAudit: Audit | null = null;

    if (job.last_audit_id) {
      const { data } = await sb.from("audits").select("*").eq("id", job.last_audit_id).single();
      currentAudit = data;
    }
    if (job.previous_audit_id) {
      const { data } = await sb.from("audits").select("*").eq("id", job.previous_audit_id).single();
      previousAudit = data;
    }

    if (currentAudit && previousAudit) {
      comparison = compareAudits(
        {
          overall_score: previousAudit.overall_score,
          breakdown: previousAudit.breakdown as ScoreBreakdown[],
          recommendations: previousAudit.recommendations as unknown[],
        },
        {
          overall_score: currentAudit.overall_score,
          breakdown: currentAudit.breakdown as ScoreBreakdown[],
          recommendations: currentAudit.recommendations as unknown[],
        }
      );
    }

    const { data: notifications } = await sb
      .from("notifications")
      .select("id, type, subject, status, sent_at, created_at")
      .eq("monitoring_job_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      job,
      currentAudit,
      previousAudit,
      comparison,
      notifications: notifications ?? [],
    });
  } catch (err) {
    console.error("[api/monitoring/[id]] GET error:", err);
    return NextResponse.json({ error: "Failed to load monitoring job." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    const sb = getSupabaseAdmin();

    if (!sb || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = PatchBody.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.data.enabled !== undefined) updates.enabled = parsed.data.enabled;
    if (parsed.data.label !== undefined) updates.label = parsed.data.label;

    const { data: job, error } = await sb
      .from("monitoring_jobs")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !job) {
      return NextResponse.json({ error: "Monitoring job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (err) {
    console.error("[api/monitoring/[id]] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update monitoring job." }, { status: 500 });
  }
}
