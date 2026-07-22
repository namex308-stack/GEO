import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";

import { getAuthUser } from "@/lib/auth/get-user";
import { getSupabaseAdmin } from "@/lib/supabase";
import { classifyAuditUrl } from "@/lib/url-validation";
import { checkRateLimit } from "@/lib/redis";
import { assertCanRunCrawl } from "@/lib/billing/usage";
import { runCrawlJob } from "@/lib/crawl/run-crawl-job";

const Body = z.object({
  siteUrl: z.string().url(),
  storeUrl: z.string().url().optional().or(z.literal("")),
  productUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
    }

    const { siteUrl } = parsed.data;
    const urlCheck = classifyAuditUrl(siteUrl);
    if (!urlCheck.valid) {
      return NextResponse.json({ error: urlCheck.reason }, { status: 400 });
    }

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to run crawls." }, { status: 401 });
    }

    const billingCheck = await assertCanRunCrawl(user.id);
    if ("error" in billingCheck) {
      return NextResponse.json({ error: billingCheck.error }, { status: billingCheck.status });
    }

    const { plan } = billingCheck;
    const { success, remaining, limit } = await checkRateLimit(user.id, plan);
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later or upgrade your plan." },
        { status: 429, headers: { "X-RateLimit-Limit": String(limit), "X-RateLimit-Remaining": String(remaining) } }
      );
    }

    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
    }

    const { data: audit, error } = await sb
      .from("audits")
      .insert({
        user_id: user.id,
        product_url: parsed.data.productUrl || siteUrl,
        store_url: parsed.data.storeUrl || siteUrl,
        site_url: siteUrl,
        audit_type: "crawl",
        status: "queued",
        crawl_progress: { phase: "discovering", totalPages: 0, completedPages: 0, message: "Starting crawl..." },
      })
      .select("id")
      .single();

    if (error || !audit) {
      return NextResponse.json({ error: "Failed to create crawl audit." }, { status: 500 });
    }

    after(async () => {
      await runCrawlJob(audit.id, plan);
    });

    return NextResponse.json({
      auditId: audit.id,
      status: "queued",
      meta: { plan, rateLimit: { remaining, limit } },
    });
  } catch (err) {
    console.error("[api/crawl] error:", err);
    return NextResponse.json({ error: "Crawl failed to start." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/crawl",
    body: { siteUrl: "string (required)", storeUrl: "string (optional)", productUrl: "string (optional)" },
  });
}
