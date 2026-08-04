import { NextRequest, NextResponse } from "next/server";
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
  saveAuditPage,
  startAnalysisRun,
  updateAuditStatus,
} from "@/lib/db/audit-repository";
import type { AnalyzerJsonResult } from "@/lib/db/types";
import { assertSafePublicHttpUrl } from "@/lib/url-safety";
import { analyzeGeo } from "@/lib/audit/geo-analyzer";
import { applyGeoAnalysisToAudit } from "@/lib/audit/scoring";
import {
  getOnboardingState,
  toAnalyzerOnboarding,
} from "@/lib/db/onboarding-repository";
import { normalizeAppLocale } from "@/lib/locale";

const Body = z.object({
  productUrl: z.string().url(),
  storeUrl: z.string().url().optional().or(z.literal("")),
  competitorUrl: z.string().url().optional().or(z.literal("")),
  onboarding: z.record(z.string(), z.string()).optional(),
  /** Reserved for future locale variants (e.g. `ar-gulf`); output is always Arabic today. */
  locale: z.literal("ar").optional(),
});

function validateCrawlUrl(label: string, raw: string): string | null {
  const safe = assertSafePublicHttpUrl(raw);
  if (!safe.ok) return `${label}: ${safe.reason}`;
  return null;
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
    const { productUrl, storeUrl, competitorUrl } = parsed.data;

    // Supabase profile is the source of truth for onboarding personalization.
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

    const resolvedStoreUrl =
      (storeUrl && storeUrl.trim()) ||
      onboardingState.storeUrl ||
      undefined;
    const resolvedCompetitorUrl =
      (competitorUrl && competitorUrl.trim()) ||
      onboardingState.competitorUrl ||
      undefined;

    const urlError =
      validateCrawlUrl("رابط المنتج", productUrl) ||
      (resolvedStoreUrl ? validateCrawlUrl("رابط المتجر", resolvedStoreUrl) : null) ||
      (resolvedCompetitorUrl ? validateCrawlUrl("رابط المنافس", resolvedCompetitorUrl) : null);
    if (urlError) {
      return NextResponse.json({ error: urlError, code: "BLOCKED_URL" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
    const rateKey = `user:${auth.user.id}`;
    const { success, remaining, limit } = await checkRateLimit(rateKey, "free");
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

    const workspaceId = await ensurePersonalWorkspace(auth.user.id);
    if (!workspaceId) {
      return NextResponse.json(
        { error: "تعذّر تجهيز مساحة العمل. حاول مرة أخرى." },
        { status: 503 }
      );
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
      productUrl,
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

    await updateAuditStatus(auditId, "scraping");

    const emptyCompetitor = {
      page: null,
      errorCode: null,
      source: "none" as const,
    };

    const [productResult, competitorResult] = await Promise.all([
      crawlWithFallback(productUrl),
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
      if (auditId) await markAuditFailed(auditId, message);
      return NextResponse.json(
        {
          error: message,
          code: productResult.errorCode ?? "SCRAPE_FAILED",
        },
        {
          status:
            productResult.errorCode === "NOT_CONFIGURED" || productResult.errorCode === "CREDITS"
              ? 503
              : productResult.errorCode === "BLOCKED_URL"
                ? 400
                : 422,
        }
      );
    }

    await saveAuditPage(auditId, "primary", product);
    if (competitor) await saveAuditPage(auditId, "competitor", competitor);
    await updateAuditStatus(auditId, "analyzing");

    const runIds = new Map<AnalyzerName, string>();

    // ConvAudit is Arabic-only today; the locale layer is the extension point for future dialects.
    const outputLocale = normalizeAppLocale("ar");

    const audit = await runAudit(
      product,
      competitor,
      onboarding,
      {
        outputLocale,
        onAnalyzerStart: async (analyzer: AnalyzerName) => {
          const id = await startAnalysisRun(auditId, analyzer);
          if (id) runIds.set(analyzer, id);
        },
        onAnalyzerComplete: async (analyzer: AnalyzerName, result: AnalyzerJsonResult) => {
          const id = runIds.get(analyzer);
          if (id) await finishAnalysisRun(id, result);
        },
      }
    );

    // Ensure GEO analysis is attached (deterministic rule engine) for every audit.
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
        storeUrl: resolvedStoreUrl || productUrl,
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
    await recordUsageEvent(workspaceId, "audit", { type: "audit", id: auditId });
    if (resolvedCompetitorUrl) {
      await recordUsageEvent(workspaceId, "competitor_compare", { type: "audit", id: auditId });
    }

    return NextResponse.json({
      audit: { ...withMeta, id: auditId },
      meta: {
        rateLimit: { remaining, limit },
        auditId,
        workspaceId,
        scrapeSource: productResult.source,
        warning:
          productResult.errorCode === "CREDITS"
            ? productResult.errorMessage
            : usedFallback && !isFirecrawlConfigured()
              ? FIRECRAWL_NOT_CONFIGURED_MESSAGE
              : undefined,
        demoMode: {
          firecrawl: !isFirecrawlConfigured() || usedFallback,
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
      productUrl: "string (required)",
      storeUrl: "string (optional)",
      competitorUrl: "string (optional)",
      locale: "ar (optional — reserved for future Arabic dialect variants)",
    },
    notes: "Onboarding context is loaded from the user profile (required before audit).",
  });
}
