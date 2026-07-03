import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scrapePage } from "@/lib/firecrawl";
import { runAudit } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/redis";
import type { OnboardingAnswers } from "@/lib/types";

const Body = z.object({
  productUrl: z.string().url(),
  storeUrl: z.string().url().optional().or(z.literal("")),
  competitorUrl: z.string().url().optional().or(z.literal("")),
  onboarding: z
    .object({
      platform: z.string(),
      challenge: z.string(),
      priceRange: z.string(),
      audience: z.string(),
      referral: z.string(),
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
    const { productUrl, competitorUrl, onboarding } = parsed.data;

    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "anonymous";
    const { success, remaining, limit } = await checkRateLimit(ip, "free");
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later or upgrade your plan." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
          },
        }
      );
    }

    // Scrape pages (Firecrawl — falls back to demo stub)
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

    // Run the AI audit (Gemini — falls back to sample)
    const audit = await runAudit(
      product,
      competitor,
      (onboarding as OnboardingAnswers) ?? null
    );

    return NextResponse.json({
      audit,
      meta: {
        rateLimit: { remaining, limit },
        demoMode: {
          firecrawl: !process.env.FIRECRAWL_API_KEY,
          gemini: !process.env.GEMINI_API_KEY,
        },
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
      competitorUrl: "string (optional)",
      onboarding: "OnboardingAnswers (optional)",
    },
  });
}
