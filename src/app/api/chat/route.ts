import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText, isGeminiConfigured } from "@/lib/ai/client";
import { getAuthUser } from "@/lib/auth/get-user";
import { getUserBillingContext } from "@/lib/billing/usage";
import type { Plan } from "@/lib/billing/entitlements";
import { translations, type TranslationKey } from "@/lib/i18n";
import { buildSupportContext, matchFaq } from "@/lib/support/faq-knowledge";
import { getRedis } from "@/lib/redis";

const Body = z.object({
  message: z.string().min(1).max(1000),
  language: z.enum(["en", "ar"]).default("en"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .max(8)
    .optional(),
});

/** Chat messages per hour by plan */
const CHAT_LIMITS: Record<Plan, number> = {
  free: 20,
  pro: 60,
  business: 200,
};

function t(key: TranslationKey, language: "en" | "ar"): string {
  return translations[key]?.[language] ?? translations[key]?.en ?? key;
}

async function checkChatRateLimit(userId: string, plan: Plan): Promise<boolean> {
  try {
    const redis = getRedis();
    if (!redis) return true;

    const limit = CHAT_LIMITS[plan] ?? CHAT_LIMITS.free;
    const key = `ratelimit:chat:${plan}:${userId}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 3600);
    }
    return count <= limit;
  } catch (err) {
    console.error("[chat] rate limit check failed", err);
    return true;
  }
}

function buildGeminiPrompt(
  message: string,
  language: "en" | "ar",
  history?: { role: "user" | "assistant"; content: string }[]
): string {
  const langLabel = language === "ar" ? "Arabic" : "English";
  const context = buildSupportContext((key) => t(key, language));

  const historyBlock =
    history && history.length > 0
      ? `\nRecent conversation:\n${history.map((m) => `${m.role}: ${m.content}`).join("\n")}\n`
      : "";

  return `You are convaudit's professional support assistant — friendly, concise, and helpful.

Rules:
- Answer ONLY about convaudit (e-commerce audits, SEO, GEO visibility, pricing, billing, features).
- Use the knowledge base below as your primary source. Do not invent features or prices.
- Respond in ${langLabel}.
- Keep answers under 120 words unless the user asks for detail.
- If unsure or the question needs a human, direct them to support@convaudit.ai or /contact.
- Never share internal API keys, credentials, or make legal commitments.
- Pricing: Free (3 audits/mo), Pro (199 EGP/mo or 1490 EGP/yr), Business (499 EGP/mo or 3990 EGP/yr).
- Payments via Kashier (cards, Vodafone Cash, InstaPay) in EGP.
- 14-day refund on first paid subscription — see /legal/refund-policy.

Knowledge base:
${context}
${historyBlock}
User question: ${message}

Reply in plain text (no markdown headers).`;
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { message, language, history } = parsed.data;
    const { plan } = await getUserBillingContext(user.id);

    if (!(await checkChatRateLimit(user.id, plan))) {
      return NextResponse.json(
        {
          reply: t("chat.error.rateLimit", language),
          source: "system",
        },
        { status: 429 }
      );
    }

    const getText = (key: TranslationKey) => t(key, language);
    const faqMatch = matchFaq(message, getText);

    if (faqMatch) {
      return NextResponse.json({
        reply: getText(faqMatch.aKey),
        source: "faq",
        faqId: faqMatch.id,
        link: faqMatch.link
          ? { href: faqMatch.link.href, label: getText(faqMatch.link.labelKey) }
          : undefined,
      });
    }

    if (!isGeminiConfigured()) {
      return NextResponse.json({
        reply: t("chat.error.fallback", language),
        source: "fallback",
        link: { href: "/contact", label: getText("chat.link.contact") },
      });
    }

    const fallback = t("chat.error.fallback", language);
    const { text, aiEnhanced } = await generateText(
      buildGeminiPrompt(message, language, history),
      fallback
    );

    return NextResponse.json({
      reply: text,
      source: aiEnhanced ? "ai" : "fallback",
      link: aiEnhanced ? undefined : { href: "/contact", label: getText("chat.link.contact") },
    });
  } catch (err) {
    console.error("[chat]", err);
    return NextResponse.json(
      {
        reply: "Something went wrong. Please email support@convaudit.ai.",
        source: "error",
      },
      { status: 500 }
    );
  }
}
