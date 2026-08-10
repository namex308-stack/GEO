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
      productUrl = productUrl || stored.audit.productUrl;
    }

    if (!productUrl) {
      return NextResponse.json({ error: "productUrl أو auditId مطلوب" }, { status: 400 });
    }

    const safeUrl = assertSafePublicHttpUrl(productUrl);
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

    const page = await crawlAndNormalize(safeUrl.href);
    if (!page) {
      if (usageEventId) await releaseUsageQuota(usageEventId);
      return NextResponse.json({ error: "تعذّر قراءة الصفحة" }, { status: 422 });
    }

    // ConvAudit is Arabic-only today; the locale layer is the extension point for future dialects.
    const outputLocale = normalizeAppLocale("ar");
    const content = await generateContent(page, outputLocale);

    const { tokensUsed, ...payload } = content;
    const durationMs = Math.max(0, Date.now() - started);
    const generationId = await saveGeneratedContentForAudit({
      workspaceId,
      userId: auth.user.id,
      auditId,
      productUrl: safeUrl.href,
      content: toJsonValue(payload),
      model: isGeminiConfigured() && content.source === "gemini" ? getGeminiModelId() : "page",
      generationType,
      status: "completed",
      durationMs,
      tokensUsed: tokensUsed ?? null,
    });

    return NextResponse.json({
      content: payload,
      generationId,
      auditId,
      generationType,
      durationMs,
      tokensUsed: tokensUsed ?? null,
      demoMode: !isGeminiConfigured() || content.source === "page",
      source: content.source ?? "page",
    });
  } catch (err) {
    if (usageEventId) await releaseUsageQuota(usageEventId);
    console.error("[api/generate] error:", err);
    return NextResponse.json({ error: "فشل التوليد" }, { status: 500 });
  }
}
