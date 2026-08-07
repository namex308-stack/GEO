import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  crawlWithFallback,
  FIRECRAWL_NOT_CONFIGURED_MESSAGE,
  isFirecrawlConfigured,
} from "@/lib/firecrawl";
import { isGeminiConfigured, runAudit, type AnalyzerName } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/redis";
import { requireApiUser } from "@/lib/auth/require-api-user";
import {
  createAuditRecord,
  ensurePersonalWorkspace,
  ensureWorkspaceStore,
  finishAnalysisRun,
  markAuditFailed,
  persistAuditResults,
  recordUsageEvent,
  releaseUsageQuota,
  saveAuditPage,
  startAnalysisRun,
  tryConsumeUsageQuota,
  updateAuditStatus,
} from "@/lib/db/audit-repository";
import { getCurrentUsagePeriod, getPlanForUser } from "@/lib/db/workspace-stats";
import { auditLimitReachedMessage } from "@/lib/billing/quota";
import { emitSubscriptionWarningNotification } from "@/lib/notifications/emit";
import type { AnalyzerJsonResult } from "@/lib/db/types";
import { assertSafePublicHttpUrl } from "@/lib/url-safety";
import { analyzeGeo } from "@/lib/audit/geo-analyzer";
import { applyGeoAnalysisToAudit } from "@/lib/audit/scoring";
import {
  getOnboardingState,
  toAnalyzerOnboarding,
  type OnboardingState,
} from "@/lib/db/onboarding-repository";
import { normalizeAppLocale } from "@/lib/locale";
import type { OnboardingAnswers } from "@/lib/types";

const OptionalHttpUrl = z.string().url().optional().or(z.literal(""));

const Body = z
  .object({
    productUrl: OptionalHttpUrl,
    storeUrl: OptionalHttpUrl,
    competitorUrl: OptionalHttpUrl,
    onboarding: z.record(z.string(), z.string()).optional(),
    /** Reserved for future locale variants (e.g. `ar-gulf`); output is always Arabic today. */
    locale: z.literal("ar").optional(),
  })
  .superRefine((data, ctx) => {
    const hasProduct = Boolean(data.productUrl?.trim());
    const hasStore = Boolean(data.storeUrl?.trim());
    if (!hasProduct && !hasStore) {
      ctx.addIssue({
        code: "custom",
        path: ["productUrl"],
        message: "أدخل رابط منتج أو رابط متجر على الأقل.",
      });
    }
  });

function validateCrawlUrl(label: string, raw: string): string | null {
  const safe = assertSafePublicHttpUrl(raw);
  if (!safe.ok) return `${label}: ${safe.reason}`;
  return null;
}

async function runAuditPipeline(input: {
  auditId: string;
  workspaceId: string;
  primaryUrl: string;
  resolvedStoreUrl: string | undefined;
  resolvedCompetitorUrl: string | undefined;
  storeId: string | null;
  onboarding: OnboardingAnswers | null;
  onboardingState: OnboardingState;
  usageEventId: string | null;
}): Promise<void> {
  const {
    auditId,
    workspaceId,
    primaryUrl,
    resolvedStoreUrl,
    resolvedCompetitorUrl,
    storeId,
    onboarding,
    onboardingState,
    usageEventId,
  } = input;

  try {
    await updateAuditStatus(auditId, "scraping");

    const emptyCompetitor = {
      page: null,
      errorCode: null,
      source: "none" as const,
    };

    const [productResult, competitorResult] = await Promise.all([
      crawlWithFallback(primaryUrl),
      resolvedCompetitorUrl
        ? crawlWithFallback(resolvedCompetitorUrl)
        : Promise.resolve(emptyCompetitor),
    ]);

    const product = productResult.page;
    const competitor = competitorResult.page;

    if (!product) {
      const message =
        productResult.errorMessage ||
        (productResult.errorCode === "NOT_CONFIGURED"
          ? FIRECRAWL_NOT_CONFIGURED_MESSAGE
          : productResult.errorCode === "BLOCKED_URL"
            ? "لا يمكن استخراج هذا الرابط."
            : "تعذّر الوصول إلى الصفحة، تحقق من الرابط.");
      await markAuditFailed(auditId, message);
      if (usageEventId) await releaseUsageQuota(usageEventId);
      return;
    }

    await saveAuditPage(auditId, "primary", product);
    if (competitor) await saveAuditPage(auditId, "competitor", competitor);
    await updateAuditStatus(auditId, "analyzing");

    const runIds = new Map<AnalyzerName, string>();
    const outputLocale = normalizeAppLocale("ar");

    const audit = await runAudit(product, competitor, onboarding, {
      outputLocale,
      onAnalyzerStart: async (analyzer: AnalyzerName) => {
        const id = await startAnalysisRun(auditId, analyzer);
        if (id) runIds.set(analyzer, id);
      },
      onAnalyzerComplete: async (analyzer: AnalyzerName, result: AnalyzerJsonResult) => {
        const id = runIds.get(analyzer);
        if (id) await finishAnalysisRun(id, result);
      },
    });

    const geoAnalysis = analyzeGeo(product);
    const withGeo = applyGeoAnalysisToAudit(audit, geoAnalysis);
    const usedFallback = productResult.source === "fallback";
    const withMeta = {
      ...withGeo,
      storeUrl: resolvedStoreUrl || withGeo.storeUrl,
      competitorUrl: resolvedCompetitorUrl || withGeo.competitorUrl,
      demoMode: withGeo.demoMode ?? !isGeminiConfigured(),
      crawlMetadata: {
        source: productResult.source,
        scrapeMs: product.scrapeMs,
        pageType: product.pageType,
        imageCount: product.imageCount,
        contentHash: product.contentHash,
        warning:
          productResult.errorCode === "CREDITS"
            ? productResult.errorMessage
            : usedFallback && !isFirecrawlConfigured()
              ? FIRECRAWL_NOT_CONFIGURED_MESSAGE
              : undefined,
        scrapedAt: new Date().toISOString(),
      },
    };

    await persistAuditResults(auditId, workspaceId, withMeta);

    if (storeId || resolvedStoreUrl) {
      const sd = product.structuredData as Record<string, unknown>;
      const currency =
        (typeof sd.priceCurrency === "string" && sd.priceCurrency) ||
        (typeof sd.currency === "string" && sd.currency) ||
        null;
      await ensureWorkspaceStore({
        workspaceId,
        storeUrl: resolvedStoreUrl || primaryUrl,
        name: withMeta.storeName || onboardingState.businessName || undefined,
        platform: onboardingState.platform || null,
        country: onboardingState.country || null,
        language: onboardingState.primaryLanguage || null,
        currency,
        detectedTheme: onboardingState.platform || null,
        verifiedAt: onboardingState.storeVerifiedAt,
        markCrawled: true,
      });
    }

    if (resolvedCompetitorUrl) {
      await recordUsageEvent(workspaceId, "competitor_compare", { type: "audit", id: auditId });
    }
  } catch (err) {
    console.error("[api/audit] pipeline error:", err);
    await markAuditFailed(auditId, "فشل التحليل. حاول مرة أخرى.");
    if (usageEventId) await releaseUsageQuota(usageEventId);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const json = await req.json();
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "طلب غير صالح", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const productUrlInput = parsed.data.productUrl?.trim() || "";
    const storeUrlInput = parsed.data.storeUrl?.trim() || "";
    const competitorUrlInput = parsed.data.competitorUrl?.trim() || "";

    const onboardingState = await getOnboardingState(auth.user.id);
    if (!onboardingState?.completed) {
      return NextResponse.json(
        {
          error: "أكمل التهيئة قبل تشغيل تحليل.",
          code: "ONBOARDING_REQUIRED",
          resumePath: onboardingState?.resumePath ?? "/onboarding",
        },
        { status: 403 }
      );
    }
    const onboarding = toAnalyzerOnboarding(onboardingState);

    const primaryUrl = productUrlInput || storeUrlInput;
    const resolvedStoreUrl =
      storeUrlInput || onboardingState.storeUrl || undefined;
    const competitorCandidate =
      competitorUrlInput || onboardingState.competitorUrl || undefined;

    const urlError =
      validateCrawlUrl(productUrlInput ? "رابط المنتج" : "رابط المتجر", primaryUrl) ||
      (resolvedStoreUrl && resolvedStoreUrl !== primaryUrl
        ? validateCrawlUrl("رابط المتجر", resolvedStoreUrl)
        : null) ||
      (competitorCandidate ? validateCrawlUrl("رابط المنافس", competitorCandidate) : null);
    if (urlError) {
      return NextResponse.json({ error: urlError, code: "BLOCKED_URL" }, { status: 400 });
    }

    const workspaceId = await ensurePersonalWorkspace(auth.user.id);
    if (!workspaceId) {
      return NextResponse.json(
        { error: "تعذّر تجهيز مساحة العمل. حاول مرة أخرى." },
        { status: 503 }
      );
    }

    const plan = await getPlanForUser(auth.user.id);

    const rateKey = `user:${auth.user.id}`;
    const { success, remaining, limit } = await checkRateLimit(rateKey, plan.planId);
    if (!success) {
      return NextResponse.json(
        { error: "تم تجاوز الحد المسموح. حاول لاحقاً أو قم بترقية باقتك." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
          },
        }
      );
    }

    let resolvedCompetitorUrl = competitorCandidate;
    if (resolvedCompetitorUrl && !plan.features.competitor) {
      if (competitorUrlInput) {
        return NextResponse.json(
          {
            error: "مقارنة المنافسين غير متاحة في باقتك الحالية. قم بالترقية للمتابعة.",
            code: "COMPETITOR_LOCKED",
            plan: plan.planId,
          },
          { status: 403 }
        );
      }
      resolvedCompetitorUrl = undefined;
    }

    const storeId = resolvedStoreUrl
      ? await ensureWorkspaceStore({
          workspaceId,
          storeUrl: resolvedStoreUrl,
          name: onboardingState.businessName || onboardingState.homepageTitle || undefined,
          platform: onboardingState.platform || null,
          country: onboardingState.country || null,
          language: onboardingState.primaryLanguage || null,
          verifiedAt: onboardingState.storeVerifiedAt,
          markCrawled: true,
        })
      : null;

    const auditId = await createAuditRecord({
      workspaceId,
      userId: auth.user.id,
      productUrl: primaryUrl,
      storeUrl: resolvedStoreUrl,
      competitorUrl: resolvedCompetitorUrl,
      storeId,
    });

    if (!auditId) {
      return NextResponse.json(
        { error: "تعذّر إنشاء سجل التحليل. حاول مرة أخرى." },
        { status: 503 }
      );
    }

    const { start: periodStart, end: periodEnd } = getCurrentUsagePeriod();
    const quota = await tryConsumeUsageQuota({
      workspaceId,
      metric: "audit",
      limit: plan.auditsPerMonth,
      periodStart,
      periodEnd,
      ref: { type: "audit", id: auditId },
    });

    if (!quota.allowed) {
      const message =
        plan.auditsPerMonth != null
          ? auditLimitReachedMessage(plan.displayName, quota.used, plan.auditsPerMonth)
          : "تعذّر تأكيد باقتك. حاول مرة أخرى.";
      await markAuditFailed(auditId, message);
      await emitSubscriptionWarningNotification({
        workspaceId,
        kind: "quota_exhausted",
        metricLabel: "تحليلات الشهر",
      });
      return NextResponse.json(
        {
          error: message,
          code: "AUDIT_LIMIT_REACHED",
          plan: plan.planId,
          limit: plan.auditsPerMonth,
          used: quota.used,
        },
        { status: 403 }
      );
    }

    const usageEventId = quota.usageEventId;

    after(() =>
      runAuditPipeline({
        auditId,
        workspaceId,
        primaryUrl,
        resolvedStoreUrl,
        resolvedCompetitorUrl,
        storeId,
        onboarding,
        onboardingState,
        usageEventId,
      })
    );

    return NextResponse.json({
      audit: {
        id: auditId,
        productUrl: primaryUrl,
        storeUrl: resolvedStoreUrl,
        competitorUrl: resolvedCompetitorUrl,
        status: "queued",
      },
      meta: {
        rateLimit: { remaining, limit },
        auditId,
        workspaceId,
        accepted: true,
        demoMode: {
          firecrawl: !isFirecrawlConfigured(),
          gemini: !isGeminiConfigured(),
        },
      },
    });
  } catch (err) {
    console.error("[api/audit] error:", err);
    return NextResponse.json({ error: "فشل التحليل. حاول مرة أخرى." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/audit",
    auth: "Required (Supabase session cookie).",
    body: {
      productUrl: "string (optional — required if storeUrl is empty)",
      storeUrl: "string (optional — required if productUrl is empty)",
      competitorUrl: "string (optional)",
      locale: "ar (optional — reserved for future Arabic dialect variants)",
    },
    notes:
      "Provide at least one of productUrl or storeUrl. Onboarding context is loaded from the user profile (required before audit). Returns auditId immediately; crawl/AI continue in the background — poll GET /api/audit/:id or open /scanning.",
  });
}
