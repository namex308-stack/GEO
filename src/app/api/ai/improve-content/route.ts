import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth/get-user";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateText } from "@/lib/ai/client";
import { assertCanGenerate, getUserBillingContext, incrementGenerationUsage } from "@/lib/billing/usage";
import { checkRateLimit } from "@/lib/redis";
import { canAccessFeature } from "@/lib/plan-gates";
import type { PlanId } from "@/lib/billing/plans";

const Body = z.object({
  originalText: z.string().min(1).max(5000),
  contentType: z.enum(["title", "description"]),
  userPlan: z.enum(["free", "pro", "business"]).optional(),
});

function buildPrompt(originalText: string, contentType: "title" | "description"): string {
  const typeLabel = contentType === "title" ? "product title" : "product description";

  return `You are an expert e-commerce copywriter. Rewrite the following ${typeLabel} to be highly converting, sales-focused, and professional.

Rules:
- Lead with customer benefits, not features
- Use clear, confident language that drives purchases
- Keep SEO and AI-readability in mind
- For titles: 30–70 characters ideal
- For descriptions: use short paragraphs and bullet points where helpful
- Return ONLY the rewritten copy — no quotes, labels, or explanation

Original ${typeLabel}:
${originalText}`;
}

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

    const ctx = await getUserBillingContext(user.id);
    const plan: PlanId = ctx.plan;

    if (!canAccessFeature(plan, "contentImprover")) {
      return NextResponse.json(
        { error: "Content Improver requires a Pro or Business plan." },
        { status: 403 }
      );
    }

    const billingCheck = await assertCanGenerate(user.id);
    if ("error" in billingCheck) {
      return NextResponse.json({ error: billingCheck.error }, { status: billingCheck.status });
    }

    const { success } = await checkRateLimit(user.id, plan);
    if (!success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { originalText, contentType } = parsed.data;
    const prompt = buildPrompt(originalText, contentType);
    const { text: improvedText, aiEnhanced } = await generateText(prompt, originalText);

    const sb = getSupabaseAdmin();
    if (sb) {
      const { error: insertError } = await sb.from("ai_generations").insert({
        user_id: user.id,
        original_text: originalText,
        improved_text: improvedText,
        generation_type: contentType,
      });

      if (insertError) {
        console.error("[api/ai/improve-content] insert failed:", insertError.message);
      }
    }

    await incrementGenerationUsage(user.id);

    return NextResponse.json({
      improvedText,
      contentType,
      aiEnhanced,
    });
  } catch (err) {
    console.error("[api/ai/improve-content] error:", err);
    return NextResponse.json({ error: "Content improvement failed" }, { status: 500 });
  }
}
