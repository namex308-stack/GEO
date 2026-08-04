import "server-only";

import { createHash } from "node:crypto";
import type { NormalizedPage } from "@/lib/db/types";
import { classifyPageType } from "@/lib/firecrawl/classify";
import {
  extractHtmlTitle,
  extractMetaContent,
  extractPageData,
  extractionToStructuredData,
} from "@/lib/firecrawl/extract";
import { assertSafePublicHttpUrl } from "@/lib/url-safety";

export { classifyPageType };

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";
const FIRECRAWL_TIMEOUT_MS = 45_000;
const FALLBACK_TIMEOUT_MS = 20_000;
const MAX_HTML_BYTES = 2_000_000;

export function isFirecrawlConfigured(): boolean {
  return !!process.env.FIRECRAWL_API_KEY;
}

export const FIRECRAWL_NOT_CONFIGURED_MESSAGE =
  "وضع التطوير: أضف FIRECRAWL_API_KEY في ملف البيئة للحصول على تحليل حقيقي.";

export const FIRECRAWL_CREDITS_MESSAGE =
  "رصيد Firecrawl منتهٍ. أضف رصيداً عبر https://firecrawl.dev/pricing — سيتم استخدام الجلب المدمج بدلاً من ذلك.";

export const FIRECRAWL_CREDITS_BLOCKED_MESSAGE =
  "Firecrawl is out of credits, and the built-in fetch could not open this store (bot protection or a locked shop). Top up Firecrawl at https://firecrawl.dev/pricing, then retry.";

export const STORE_LOCKED_402_MESSAGE =
  "This store returned HTTP 402 (often a paused or unpaid Shopify plan). Reactivate the store or try a different public URL.";

export type ScrapeErrorCode = "NOT_CONFIGURED" | "CREDITS" | "FAILED" | "BLOCKED_URL" | null;

export type CrawlResult = {
  page: NormalizedPage | null;
  errorCode: ScrapeErrorCode;
  errorMessage?: string;
  source: "firecrawl" | "fallback" | "none";
};

type FallbackAttempt = {
  page: NormalizedPage | null;
  httpStatus: number | null;
  reason?: string;
};

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const BOT_UA = "Mozilla/5.0 (compatible; ConvAuditBot/1.0; +https://convaudit.com)";

/**
 * Crawl + classify + normalize a URL for the audit engine.
 * Prefer Firecrawl; on credit/API failure, fall back to a direct HTTP fetch
 * so audits can still analyze real page content.
 */
export async function crawlAndNormalize(url: string): Promise<NormalizedPage | null> {
  const result = await crawlWithFallback(url);
  return result.page;
}

export async function crawlWithFallback(url: string): Promise<CrawlResult> {
  const safe = assertSafePublicHttpUrl(url);
  if (!safe.ok) {
    return {
      page: null,
      errorCode: "BLOCKED_URL",
      errorMessage: safe.reason,
      source: "none",
    };
  }
  const target = safe.href;

  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) {
    console.warn("[firecrawl]", FIRECRAWL_NOT_CONFIGURED_MESSAGE);
    const fallback = await fetchPageFallback(target);
    if (fallback.page) {
      return { page: fallback.page, errorCode: "NOT_CONFIGURED", source: "fallback" };
    }
    return {
      page: null,
      errorCode: "NOT_CONFIGURED",
      errorMessage: fallback.reason
        ? `${FIRECRAWL_NOT_CONFIGURED_MESSAGE} (${fallback.reason})`
        : FIRECRAWL_NOT_CONFIGURED_MESSAGE,
      source: "none",
    };
  }

  const started = Date.now();
  try {
    const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        url: target,
        formats: ["markdown", "html"],
        onlyMainContent: true,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(FIRECRAWL_TIMEOUT_MS),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[firecrawl] scrape failed:", res.status, body);

      const credits = res.status === 402 || /insufficient\s*credits/i.test(body);
      if (credits) {
        console.warn("[firecrawl]", FIRECRAWL_CREDITS_MESSAGE);
      }

      const fallback = await fetchPageFallback(target);
      if (fallback.page) {
        return {
          page: fallback.page,
          errorCode: credits ? "CREDITS" : "FAILED",
          errorMessage: credits ? FIRECRAWL_CREDITS_MESSAGE : undefined,
          source: "fallback",
        };
      }

      return {
        page: null,
        errorCode: credits ? "CREDITS" : "FAILED",
        errorMessage: credits
          ? composeCreditsFailureMessage(target, fallback)
          : fallback.reason || "Could not reach the page, please check the URL.",
        source: "none",
      };
    }

    const json = await res.json();
    const data = json.data ?? json;
    const html: string | undefined = typeof data.html === "string" ? data.html.slice(0, MAX_HTML_BYTES) : undefined;
    const markdown: string = data.markdown || "";
    const extracted = extractPageData(html, markdown, data.metadata as Record<string, unknown> | undefined, target);
    const title = extracted.title || extractTitleFromUrl(target);
    const description = extracted.description || "";
    const pageType = classifyPageType(target, title, markdown);
    const structuredData = extractionToStructuredData(extracted);
    const normalizedMarkdown = normalizeMarkdown(markdown);
    const imageCount = extracted.images.length || (extracted.ogImage ? 1 : 0);

    return {
      page: {
        url: target,
        title,
        description,
        pageType,
        markdown: normalizedMarkdown,
        imageCount,
        contentHash: hashContent(target, normalizedMarkdown),
        structuredData,
        scrapeStatus: "ok",
        scrapeMs: Date.now() - started,
      },
      errorCode: null,
      source: "firecrawl",
    };
  } catch (err) {
    console.error("[firecrawl] error:", err);
    const fallback = await fetchPageFallback(target);
    if (fallback.page) {
      return { page: fallback.page, errorCode: "FAILED", source: "fallback" };
    }
    const timedOut =
      err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    return {
      page: null,
      errorCode: "FAILED",
      errorMessage: timedOut
        ? "The page took too long to load. Please try again."
        : fallback.reason || "Could not reach the page, please check the URL.",
      source: "none",
    };
  }
}

function composeCreditsFailureMessage(url: string, fallback: FallbackAttempt): string {
  if (fallback.httpStatus === 402 || isLikelyShopifyHost(url)) {
    if (fallback.httpStatus === 402) {
      return `${FIRECRAWL_CREDITS_BLOCKED_MESSAGE} ${STORE_LOCKED_402_MESSAGE}`;
    }
  }
  if (fallback.httpStatus === 403) {
    return `${FIRECRAWL_CREDITS_BLOCKED_MESSAGE} The site blocked direct fetch (HTTP 403 / bot challenge).`;
  }
  if (fallback.reason) {
    return `${FIRECRAWL_CREDITS_BLOCKED_MESSAGE} ${fallback.reason}`;
  }
  return FIRECRAWL_CREDITS_BLOCKED_MESSAGE;
}

function isLikelyShopifyHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.endsWith(".myshopify.com") || host.includes("shopify");
  } catch {
    return false;
  }
}

/** Direct fetch fallback when Firecrawl is unavailable or out of credits. */
async function fetchPageFallback(url: string): Promise<FallbackAttempt> {
  // Browser UA first (Shopify / Cloudflare often reject the bot UA).
  const attempts = [BROWSER_UA, BOT_UA];
  let lastStatus: number | null = null;
  let lastReason: string | undefined;

  for (const userAgent of attempts) {
    const started = Date.now();
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": userAgent,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
          "Cache-Control": "no-cache",
        },
        redirect: "follow",
        cache: "no-store",
        signal: AbortSignal.timeout(FALLBACK_TIMEOUT_MS),
      });

      lastStatus = res.status;

      if (!res.ok) {
        console.error("[scrape-fallback] HTTP", res.status, url);
        lastReason =
          res.status === 402
            ? STORE_LOCKED_402_MESSAGE
            : res.status === 403
              ? "The site blocked direct fetch (HTTP 403)."
              : `Direct fetch failed (HTTP ${res.status}).`;
        // Retry with the next UA on challenge/forbidden; 402 from Shopify is usually final.
        if (res.status === 402) {
          return { page: null, httpStatus: 402, reason: STORE_LOCKED_402_MESSAGE };
        }
        continue;
      }

      const finalUrl = res.url || url;
      const safeFinal = assertSafePublicHttpUrl(finalUrl);
      if (!safeFinal.ok) {
        console.error("[scrape-fallback] blocked redirect target:", finalUrl);
        return {
          page: null,
          httpStatus: res.status,
          reason: "The page redirected to a blocked host.",
        };
      }

      const htmlRaw = await res.text();
      if (!htmlRaw || htmlRaw.length < 50) {
        lastReason = "The page returned empty HTML.";
        continue;
      }

      // Cloudflare challenge pages are not useful store content.
      if (/cf-mitigated|just a moment|challenge-platform|cdn-cgi\/challenge/i.test(htmlRaw)) {
        console.warn("[scrape-fallback] Cloudflare challenge page, trying next UA");
        lastReason = "Cloudflare bot challenge blocked direct fetch.";
        lastStatus = 403;
        continue;
      }

      const html = htmlRaw.slice(0, MAX_HTML_BYTES);
      const markdown = htmlToRoughMarkdown(html);
      const normalizedMarkdown = normalizeMarkdown(markdown);
      const extracted = extractPageData(
        html,
        normalizedMarkdown,
        {
          title: extractHtmlTitle(html),
          description:
            extractMetaContent(html, "description") || extractMetaContent(html, "og:description"),
        },
        safeFinal.href
      );
      const title = extracted.title || extractTitleFromUrl(safeFinal.href);
      const description = extracted.description || "";
      const pageType = classifyPageType(safeFinal.href, title, normalizedMarkdown);
      const imageCount =
        extracted.images.length ||
        (html.match(/<img\b/gi) ?? []).length ||
        (extracted.ogImage ? 1 : 0);

      return {
        page: {
          url: safeFinal.href,
          title,
          description,
          pageType,
          markdown: normalizedMarkdown,
          imageCount,
          contentHash: hashContent(safeFinal.href, normalizedMarkdown),
          structuredData: {
            ...extractionToStructuredData(extracted),
            scrapeSource: "fallback",
          },
          scrapeStatus: "ok",
          scrapeMs: Date.now() - started,
        },
        httpStatus: res.status,
      };
    } catch (err) {
      console.error("[scrape-fallback] error:", err);
      lastReason = "Direct fetch threw a network error.";
    }
  }

  return { page: null, httpStatus: lastStatus, reason: lastReason };
}

function htmlToRoughMarkdown(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  text = text
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)");

  text = text.replace(/<[^>]+>/g, " ");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeMarkdown(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 24_000);
}

function hashContent(url: string, markdown: string): string {
  return createHash("sha256").update(`${url}\n${markdown}`).digest("hex");
}

function extractTitleFromUrl(url: string): string {
  try {
    const seg = new URL(url).pathname.split("/").filter(Boolean).pop() || "";
    return (
      seg
        .replace(/[-_]/g, " ")
        .replace(/\.\w+$/, "")
        .replace(/\b\w/g, (c) => c.toUpperCase()) || "Product page"
    );
  } catch {
    return "Product page";
  }
}
