import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scrapePage } from "@/lib/firecrawl";
import { generateContent } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/redis";
import { getAuthUser } from "@/lib/auth/get-user";
import { getSupabaseAdmin } from "@/lib/supabase";
import { assertCanGenerate, incrementGenerationUsage } from "@/lib/billing/usage";

const RecommendationSchema = z.object({
  id: z.string(),
  pillar: z.enum(["conversion", "seo", "geo", "trust"]),
  severity: z.enum(["critical", "warning", "opportunity"]),
  impact: z.enum(["high", "medium", "low"]),
  effort: z.enum(["quick", "medium", "involved"]),
  problem: z.string(),
  why: z.string().optional(),
  solution: z.string(),
});

const Body = z.object({
  productUrl: z.string().url(),
  auditId: z.string().uuid().optional(),
  auditContext: z
    .object({
      overallScore: z.number().optional(),
      breakdown: z
        .array(
          z.object({
            pillar: z.string(),
            score: z.number(),
            label: z.string(),
            summary: z.string().optional(),
          })
        )
        .optional(),
      recommendations: z.array(RecommendationSchema).optional(),
      customerEyeBlocker: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const billingCheck = await assertCanGenerate(user.id);
    if ("error" in billingCheck) {
      return NextResponse.json({ error: billingCheck.error }, { status: billingCheck.status });
    }

    const { plan } = billingCheck;
    const identifier = user.id;
    const { success } = await checkRateLimit(identifier, plan);
    if (!success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const page = await scrapePage(parsed.data.productUrl);
    if (!page) {
      return NextResponse.json({ error: "Could not read the page" }, { status: 422 });
    }

    const { content, aiEnhanced } = await generateContent(page, parsed.data.auditContext);
    const jsonLd = buildJsonLd(content, parsed.data.productUrl);
    const result = { ...content, jsonLd };

    const sb = getSupabaseAdmin();
    if (sb && parsed.data.auditId) {
      await sb.from("generated_content").insert({
        audit_id: parsed.data.auditId,
        user_id: user.id,
        content: result,
      });
    }

    await incrementGenerationUsage(user.id);

    return NextResponse.json({
      content: result,
      aiEnhanced,
      demoMode: {
        firecrawl: !process.env.FIRECRAWL_API_KEY?.trim(),
        gemini: !(process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY)?.trim() || !aiEnhanced,
      },
    });
  } catch (err) {
    console.error("[api/generate] error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

function buildJsonLd(content: any, url: string) {
  const schemas: Record<string, unknown>[] = [];

  schemas.push({
    "@context": "https://schema.org",
    "@type": "Product",
    name: content.title,
    description: content.metaDescription,
    url,
  });

  if (content.faq?.length) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: content.faq.map((f: any) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  return schemas;
}
