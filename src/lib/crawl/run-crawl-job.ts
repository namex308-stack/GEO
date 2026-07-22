import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase";
import { discoverSiteUrls, scrapePage } from "@/lib/firecrawl";
import { analyzePage } from "@/lib/crawl/analyze-page";
import { buildCrawlSummary } from "@/lib/crawl/summary";
import { fetchSiteSignals } from "@/lib/engines/site-signals";
import { interpretResults } from "@/lib/ai/interpreter";
import { analyzeContentWithAI } from "@/lib/ai/content-analysis";
import { buildSnapshot } from "@/lib/engines/snapshot";
import { runScoringSystem } from "@/lib/engines/scoring-system";
import { getMaxCrawlPagesForPlan, incrementAuditUsage } from "@/lib/billing/usage";
import type { Plan } from "@/lib/billing/entitlements";
import type { Recommendation } from "@/lib/types";

export interface CrawlProgress {
  phase: "discovering" | "crawling" | "analyzing" | "complete" | "failed";
  totalPages: number;
  completedPages: number;
  currentUrl?: string;
  message?: string;
}

async function updateProgress(auditId: string, progress: CrawlProgress) {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb.from("audits").update({ crawl_progress: progress }).eq("id", auditId);
}

export async function runCrawlJob(auditId: string, plan: Plan) {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const { data: audit } = await sb.from("audits").select("*").eq("id", auditId).single();
  if (!audit || audit.audit_type !== "crawl") return;

  const siteUrl = audit.site_url || audit.store_url || audit.product_url;
  const maxPages = getMaxCrawlPagesForPlan(plan);

  try {
    await sb.from("audits").update({ status: "scraping" }).eq("id", auditId);
    await updateProgress(auditId, { phase: "discovering", totalPages: 0, completedPages: 0, message: "Discovering pages..." });

    const urls = await discoverSiteUrls(siteUrl, maxPages);
    await updateProgress(auditId, {
      phase: "crawling",
      totalPages: urls.length,
      completedPages: 0,
      message: `Found ${urls.length} pages`,
    });

    const pageRows = urls.map((url, i) => ({
      audit_id: auditId,
      user_id: audit.user_id,
      url,
      status: "pending" as const,
      sort_order: i,
    }));

    const { data: insertedPages } = await sb.from("crawled_pages").insert(pageRows).select("id, url, sort_order");
    if (!insertedPages?.length) {
      throw new Error("Failed to create crawled page records.");
    }

    const siteSignals = await fetchSiteSignals(siteUrl);
    const analyzed: Array<{
      url: string;
      title: string;
      score: number;
      breakdown: import("@/lib/types").ScoreBreakdown[];
      geoReadability: { chatgpt: number; perplexity: number; googleAI: number };
      hasIssues: boolean;
      markdown: string;
      html?: string;
    }> = [];

    for (let i = 0; i < insertedPages.length; i++) {
      const pageRow = insertedPages[i];
      await updateProgress(auditId, {
        phase: "analyzing",
        totalPages: insertedPages.length,
        completedPages: i,
        currentUrl: pageRow.url,
        message: `Analyzing page ${i + 1} of ${insertedPages.length}`,
      });

      await sb.from("crawled_pages").update({ status: "analyzing" }).eq("id", pageRow.id);

      const scraped = await scrapePage(pageRow.url);
      if (!scraped) {
        await sb.from("crawled_pages").update({ status: "failed", error_message: "Could not scrape page" }).eq("id", pageRow.id);
        continue;
      }

      const result = await analyzePage(scraped, siteSignals);

      await sb.from("crawled_pages").update({ status: "complete", title: scraped.title }).eq("id", pageRow.id);

      await sb.from("page_results").insert({
        crawled_page_id: pageRow.id,
        audit_id: auditId,
        user_id: audit.user_id,
        overall_score: result.overallScore,
        breakdown: result.breakdown,
        geo_readability: result.geoReadability,
        recommendations: [],
        has_issues: result.hasIssues,
      });

      analyzed.push({
        url: pageRow.url,
        title: scraped.title,
        score: result.overallScore,
        breakdown: result.breakdown,
        geoReadability: result.geoReadability,
        hasIssues: result.hasIssues,
        markdown: scraped.markdown,
        html: scraped.html,
      });
    }

    if (analyzed.length === 0) {
      throw new Error("No pages could be scraped. Check Firecrawl configuration and site accessibility.");
    }

    const summary = buildCrawlSummary(analyzed);
    const primary = [...analyzed].sort((a, b) => b.score - a.score)[0];

    // Gemini pass on the best-scoring page (links Firecrawl crawl → AI recommendations)
    await updateProgress(auditId, {
      phase: "analyzing",
      totalPages: summary.totalPages,
      completedPages: summary.totalPages,
      currentUrl: primary.url,
      message: "Generating AI recommendations...",
    });

    let recommendations: Recommendation[] = [];
    let aiEnhanced = false;
    let pillarSummaries: Record<string, string> = {};
    let engineResults: Record<string, unknown> | null = null;

    try {
      const snapshot = buildSnapshot(primary.url, { markdown: primary.markdown, html: primary.html }, siteSignals);
      const scoring = runScoringSystem(snapshot);
      const interpretation = await interpretResults(scoring.breakdown, primary.markdown);
      const contentAnalysis = await analyzeContentWithAI(primary.markdown);
      recommendations = interpretation.recommendations;
      aiEnhanced = interpretation.aiEnhanced;
      pillarSummaries = interpretation.pillarSummaries;
      engineResults = {
        version: 1,
        generatedAt: new Date().toISOString(),
        aiEnhanced,
        crawl: true,
        engines: {
          overallScore: scoring.overallScore,
          breakdown: scoring.breakdown,
        },
        categories: scoring.categoryResults,
        contentAnalysis,
        interpretation: { pillarSummaries, compareGaps: interpretation.compareGaps },
        geoReadability: primary.geoReadability,
      };

      // Enrich primary breakdown summaries from Gemini
      if (Object.keys(pillarSummaries).length > 0) {
        primary.breakdown = primary.breakdown.map((b) => ({
          ...b,
          summary: pillarSummaries[b.pillar] ?? b.summary,
        }));
      }

      // Attach recommendations to the primary page_results row
      const { data: primaryPage } = await sb
        .from("crawled_pages")
        .select("id")
        .eq("audit_id", auditId)
        .eq("url", primary.url)
        .maybeSingle();

      if (primaryPage?.id) {
        await sb
          .from("page_results")
          .update({ recommendations })
          .eq("crawled_page_id", primaryPage.id);
      }
    } catch (err) {
      console.error("[crawl-job] Gemini interpretation failed:", err);
    }

    await sb.from("audits").update({
      status: "complete",
      overall_score: summary.averageScore,
      breakdown: primary.breakdown,
      geo_readability: primary.geoReadability,
      recommendations,
      engine_results: engineResults ?? { aiEnhanced: false, crawl: true },
      crawl_summary: summary,
      crawl_progress: {
        phase: "complete",
        totalPages: summary.totalPages,
        completedPages: summary.totalPages,
        message: "Crawl complete",
      },
      product_name: primary.title ?? "Site crawl",
      store_name: new URL(siteUrl).hostname,
      completed_at: new Date().toISOString(),
    }).eq("id", auditId);

    await incrementAuditUsage(audit.user_id);
  } catch (err) {
    console.error("[crawl-job] failed:", err);
    await sb.from("audits").update({
      status: "failed",
      error_message: err instanceof Error ? err.message : "Crawl failed",
      crawl_progress: {
        phase: "failed",
        totalPages: 0,
        completedPages: 0,
        message: err instanceof Error ? err.message : "Crawl failed",
      },
    }).eq("id", auditId);
  }
}
