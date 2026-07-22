import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { scrapePage } from "@/lib/firecrawl";

import { runAudit } from "@/lib/gemini";

import { checkRateLimit } from "@/lib/redis";

import { classifyAuditUrl } from "@/lib/url-validation";

import { getSupabaseAdmin } from "@/lib/supabase";

import { getAuthUser } from "@/lib/auth/get-user";

import type { OnboardingAnswers } from "@/lib/types";

import {

  assertCanRunAudit,

  filterAuditForPlan,

  incrementAuditUsage,

} from "@/lib/billing/usage";

import { canAccessFeature } from "@/lib/plan-gates";



const Body = z.object({

  productUrl: z.string().url(),

  storeUrl: z.string().url().optional().or(z.literal("")),

  competitorUrl: z.string().url().optional().or(z.literal("")),

  fullCrawl: z.boolean().optional(),

  onboarding: z

    .object({

      platform: z.string(),

      storeStage: z.string(),

      challenge: z.string(),

      primaryGoal: z.string(),

      priceRange: z.string(),

      trafficSource: z.string(),

    })

    .optional(),

});



export async function POST(req: NextRequest) {

  try {

    const json = await req.json();

    const parsed = Body.safeParse(json);

    if (!parsed.success) {

      return NextResponse.json(

        { error: "Invalid request", details: parsed.error.flatten() },

        { status: 400 }

      );

    }

    let { productUrl, competitorUrl, onboarding, fullCrawl } = parsed.data;



    if (fullCrawl) {

      return NextResponse.json(

        { error: "Use POST /api/crawl for full website crawls." },

        { status: 400 }

      );

    }



    const productCheck = classifyAuditUrl(productUrl);

    if (!productCheck.valid) {

      return NextResponse.json({ error: productCheck.reason }, { status: 400 });

    }



    const user = await getAuthUser();

    if (!user) {

      return NextResponse.json({ error: "Sign in to run audits." }, { status: 401 });

    }



    const billingCheck = await assertCanRunAudit(user.id);

    if ("error" in billingCheck) {

      return NextResponse.json({ error: billingCheck.error }, { status: billingCheck.status });

    }



    const { plan } = billingCheck;



    if (competitorUrl && !canAccessFeature(plan, "competitor")) {

      return NextResponse.json(

        { error: "Competitor comparison requires a Pro or Business plan." },

        { status: 403 }

      );

    }



    if (competitorUrl) {

      const compCheck = classifyAuditUrl(competitorUrl);

      if (!compCheck.valid) {

        return NextResponse.json({ error: compCheck.reason }, { status: 400 });

      }

    } else {

      competitorUrl = "";

    }



    const identifier = user.id;

    const { success, remaining, limit } = await checkRateLimit(identifier, plan);

    if (!success) {

      return NextResponse.json(

        { error: "Rate limit exceeded. Try again later or upgrade your plan." },

        { status: 429, headers: { "X-RateLimit-Limit": String(limit), "X-RateLimit-Remaining": String(remaining) } }

      );

    }



    const [product, competitor] = await Promise.all([

      scrapePage(productUrl),

      competitorUrl ? scrapePage(competitorUrl) : Promise.resolve(null),

    ]);



    if (!product) {

      return NextResponse.json(

        { error: "Could not read the product page. Check the URL and try again." },

        { status: 422 }

      );

    }



    const rawAudit = await runAudit(

      product,

      competitor,

      (onboarding as OnboardingAnswers) ?? null

    );



    const audit = filterAuditForPlan(rawAudit, plan);



    const sb = getSupabaseAdmin();

    let auditId: string | null = null;

    if (sb) {

      const { data: inserted, error: insertError } = await sb.from("audits").insert({

        user_id: user.id,

        product_url: productUrl,

        store_url: parsed.data.storeUrl || null,

        competitor_url: competitorUrl || null,

        audit_type: "single",

        status: "complete",

        overall_score: audit.overallScore,

        competitor_score: audit.competitorScore ?? null,

        breakdown: audit.breakdown,

        competitor_breakdown: audit.competitorBreakdown ?? null,

        geo_readability: audit.geoReadability,

        recommendations: audit.recommendations,

        product_name: audit.productName,

        store_name: audit.storeName,

        engine_results: rawAudit.engineResults ?? { aiEnhanced: rawAudit.aiEnhanced ?? false },

        eye_test_result: rawAudit.customerEyeTest ?? null,

        completed_at: new Date().toISOString(),

      }).select("id").single();



      if (insertError) {

        console.error("[api/audit] DB insert failed:", insertError.message);

      } else {

        auditId = inserted?.id ?? null;

      }



      await incrementAuditUsage(user.id);

    }



    return NextResponse.json({

      audit,

      auditId,

      meta: {

        plan,

        rateLimit: { remaining, limit },

        demoMode: {

          firecrawl: !process.env.FIRECRAWL_API_KEY?.trim(),

          gemini: !(process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY)?.trim(),

        },

        aiEnhanced: rawAudit.aiEnhanced ?? false,

      },

    });

  } catch (err) {

    console.error("[api/audit] error:", err);

    return NextResponse.json({ error: "Audit failed. Please try again." }, { status: 500 });

  }

}



export async function GET() {

  return NextResponse.json({

    endpoint: "POST /api/audit",

    body: {

      productUrl: "string (required)",

      storeUrl: "string (optional)",

      competitorUrl: "string (optional, Pro+)",

      onboarding: "OnboardingAnswers (optional)",

    },

  });

}

