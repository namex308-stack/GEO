import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthUser } from "@/lib/auth/get-user";
import { getSupabaseAdmin } from "@/lib/supabase";
import { classifyAuditUrl } from "@/lib/url-validation";
import { assertCanEnableMonitoring } from "@/lib/billing/usage";
import { nextWeeklyRun } from "@/lib/monitoring/run-monitoring";

const Body = z.object({
  siteUrl: z.string().url(),
  storeUrl: z.string().url().optional().or(z.literal("")),
  productUrl: z.string().url().optional().or(z.literal("")),
  label: z.string().max(120).optional(),
});

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

    const { data: jobs, error } = await sb
      .from("monitoring_jobs")
      .select(`
        id, site_url, store_url, product_url, label, enabled,
        last_run_at, next_run_at, last_audit_id, previous_audit_id, created_at
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const enriched = await Promise.all(
      (jobs ?? []).map(async (job) => {
        let lastScore: number | null = null;
        let prevScore: number | null = null;
        let alertCount = 0;

        if (job.last_audit_id) {
          const { data } = await sb.from("audits").select("overall_score, crawl_summary").eq("id", job.last_audit_id).single();
          lastScore = data?.overall_score ?? null;
          const summary = data?.crawl_summary as { pagesWithIssues?: number } | null;
          alertCount = summary?.pagesWithIssues ?? 0;
        }
        if (job.previous_audit_id) {
          const { data } = await sb.from("audits").select("overall_score").eq("id", job.previous_audit_id).single();
          prevScore = data?.overall_score ?? null;
        }

        return {
          ...job,
          lastScore,
          prevScore,
          alertCount,
        };
      })
    );

    return NextResponse.json({ jobs: enriched });
  } catch (err) {
    console.error("[api/monitoring] GET error:", err);
    return NextResponse.json({ error: "Failed to load monitoring jobs." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const billingCheck = await assertCanEnableMonitoring(user.id);
    if ("error" in billingCheck) {
      return NextResponse.json({ error: billingCheck.error }, { status: billingCheck.status });
    }

    const json = await req.json();
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const urlCheck = classifyAuditUrl(parsed.data.siteUrl);
    if (!urlCheck.valid) {
      return NextResponse.json({ error: urlCheck.reason }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

    const label = parsed.data.label || new URL(parsed.data.siteUrl).hostname;

    const { data: job, error } = await sb
      .from("monitoring_jobs")
      .insert({
        user_id: user.id,
        site_url: parsed.data.siteUrl,
        store_url: parsed.data.storeUrl || parsed.data.siteUrl,
        product_url: parsed.data.productUrl || null,
        label,
        enabled: true,
        next_run_at: nextWeeklyRun().toISOString(),
      })
      .select("*")
      .single();

    if (error || !job) {
      return NextResponse.json({ error: "Failed to create monitoring job." }, { status: 500 });
    }

    return NextResponse.json({ job });
  } catch (err) {
    console.error("[api/monitoring] POST error:", err);
    return NextResponse.json({ error: "Failed to enable monitoring." }, { status: 500 });
  }
}
