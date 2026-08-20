import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { crawlAndNormalize } from "@/lib/firecrawl";
import { generateContent, getGeminiModelId, isGeminiConfigured } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/redis";
import { requireApiUser } from "@/lib/auth/require-api-user";
import {
  ensurePersonalWorkspace,
  getAuditByIdForUser,
  releaseUsageQuota,
  saveGeneratedContentForAudit,
  tryConsumeUsageQuota,
} from "@/lib/db/audit-repository";
import { getCurrentUsagePeriod, getPlanForUser } from "@/lib/db/workspace-stats";
import { aiLimitReachedMessage } from "@/lib/billing/quota";
import {
  aiGeneratorLockedMessage,
  ENTITLEMENT_CODES,
  isPlanFeatureEnabled,
} from "@/lib/billing/entitlements";
import { assertSafePublicHttpUrl } from "@/lib/url-safety";
import { normalizeAppLocale } from "@/lib/locale";
import { toJsonValue } from "@/lib/audits/parse";

const Body = z.object({
  productUrl: z.string().url().optional(),
  auditId: z.string().uuid().optional(),
  generationType: z
    .enum(["product_content", "title", "description", "faq", "ad_copy"])
    .optional(),
  /** Reserved for future locale variants (e.g. `ar-gulf`); output is always Arabic today. */
  locale: z.literal("ar").optional(),
});

export async function POST(req: NextRequest) {
  const started = Date.now();
  let usageEventId: string | null = null;
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const json = await req.json();
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
    }

    let productUrl = parsed.data.productUrl;
    let auditId = parsed.data.auditId ?? null;
    const generationType = parsed.data.generationType ?? "product_content";

    if (auditId) {
      const stored = await getAuditByIdForUser(auditId, auth.user.id);
      if (!stored) {
        return NextResponse.json({ error: "التحليل غير موجود" }, { status: 404 });
      }
      productUrl =
        productUrl || stored.audit.productUrl || stored.audit.storeUrl || undefined;
    }

    if (!productUrl) {
      return NextResponse.json({ error: "productUrl أو auditId مطلوب" }, { status: 400 });
    }

    const safeUrl = await assertSafePublicHttpUrl(productUrl);
    if (!safeUrl.ok) {
      return NextResponse.json({ error: safeUrl.reason, code: "BLOCKED_URL" }, { status: 400 });
    }

    const workspaceId = await ensurePersonalWorkspace(auth.user.id);
    if (!workspaceId) {
      return NextResponse.json({ error: "تعذّر تجهيز مساحة العمل" }, { status: 503 });
    }

    const plan = await getPlanForUser(auth.user.id);

    const rateKey = `user:${auth.user.id}`;
    const { success } = await checkRateLimit(rateKey, plan.planId);
    if (!success) {
      return NextResponse.json({ error: "تم تجاوز الحد المسموح" }, { status: 429 });
    }

    if (!isPlanFeatureEnabled(plan, "aiGenerator")) {
      return NextResponse.json(
        {
          error: aiGeneratorLockedMessage(),
          code: ENTITLEMENT_CODES.AI_GENERATOR_LOCKED,
          plan: plan.planId,
        },
        { status: 403 }
      );
    }

    const page = await crawlAndNormalize(safeUrl.href);
    if (!page) {
      return NextResponse.json({ error: "تعذّر قراءة الصفحة" }, { status: 422 });
    }

    // ConvAudit is Arabic-only today; the locale layer is the extension point for future dialects.
    const outputLocale = normalizeAppLocale(parsed.data.locale ?? "ar");
    const geminiConfigured = isGeminiConfigured();
    const generated = await generateContent(page, outputLocale);

    if (!generated.ok) {
      await saveGeneratedContentForAudit({
        workspaceId,
        userId: auth.user.id,
        auditId,
        productUrl: safeUrl.href,
        content: toJsonValue({ error: generated.error, code: generated.code }),
        model: geminiConfigured ? getGeminiModelId() : "page",
        generationType,
        status: "failed",
        durationMs: Math.max(0, Date.now() - started),
        tokensUsed: null,
      });
      return NextResponse.json(
        { error: generated.error, code: generated.code },
        { status: 502 }
      );
    }

    // Page scrape is only allowed when Gemini is not configured — never burns AI quota.
    if (generated.source === "page") {
      if (geminiConfigured) {
        // Defensive: configured Gemini must never succeed as page scrape.
        return NextResponse.json(
          {
            error: "فشل توليد المحتوى بالذكاء الاصطناعي. حاول مرة أخرى.",
            code: "GEMINI_FAILED",
          },
          { status: 502 }
        );
      }

      const durationMs = Math.max(0, Date.now() - started);
      const generationId = await saveGeneratedContentForAudit({
        workspaceId,
        userId: auth.user.id,
        auditId,
        productUrl: safeUrl.href,
        content: toJsonValue(generated.content),
        model: "page",
        generationType,
        status: "completed",
        durationMs,
        tokensUsed: null,
      });

      return NextResponse.json({
        content: generated.content,
        generationId,
        auditId,
        generationType,
        durationMs,
        tokensUsed: null,
        demoMode: true,
        source: "page",
      });
    }

    // Real Gemini success — reserve AI quota only now.
    const { start: periodStart, end: periodEnd } = getCurrentUsagePeriod();
    const quota = await tryConsumeUsageQuota({
      workspaceId,
      metric: "ai_generation",
      limit: plan.aiGensPerMonth,
      periodStart,
      periodEnd,
    });

    if (!quota.allowed) {
      const message =
        plan.aiGensPerMonth != null
          ? aiLimitReachedMessage(plan.displayName, quota.used, plan.aiGensPerMonth)
          : "تعذّر تأكيد باقتك. حاول مرة أخرى.";
      return NextResponse.json(
        {
          error: message,
          code: "AI_LIMIT_REACHED",
          plan: plan.planId,
          limit: plan.aiGensPerMonth,
          used: quota.used,
        },
        { status: 403 }
      );
    }
    usageEventId = quota.usageEventId;

    const durationMs = Math.max(0, Date.now() - started);
    const generationId = await saveGeneratedContentForAudit({
      workspaceId,
      userId: auth.user.id,
      auditId,
      productUrl: safeUrl.href,
      content: toJsonValue(generated.content),
      model: getGeminiModelId(),
      generationType,
      status: "completed",
      durationMs,
      tokensUsed: generated.tokensUsed,
    });

    return NextResponse.json({
      content: generated.content,
      generationId,
      auditId,
      generationType,
      durationMs,
      tokensUsed: generated.tokensUsed,
      demoMode: false,
      source: "gemini",
    });
  } catch (err) {
    if (usageEventId) await releaseUsageQuota(usageEventId);
    console.error("[api/generate] error:", err);
    return NextResponse.json({ error: "فشل التوليد" }, { status: 500 });
  }
}
