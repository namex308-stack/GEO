import "server-only";
import type { ScrapedPage } from "./types";

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";

export function isFirecrawlConfigured(): boolean {
  return !!process.env.FIRECRAWL_API_KEY?.trim();
}

/**
 * Scrape a URL with Firecrawl. Returns markdown + metadata.
 * Returns null if Firecrawl isn't configured or the scrape fails.
 * Does NOT return silent demo content — callers must handle null.
 */
export async function scrapePage(url: string): Promise<ScrapedPage | null> {
  const key = process.env.FIRECRAWL_API_KEY?.trim();
  if (!key) {
    console.error("[firecrawl] FIRECRAWL_API_KEY is not configured");
    return null;
  }

  try {
    const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html"],
        onlyMainContent: true,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[firecrawl] scrape failed:", res.status, await res.text());
      return null;
    }

    const json = await res.json();
    const data = json.data ?? json;
    const markdown = typeof data.markdown === "string" ? data.markdown.trim() : "";
    if (!markdown) {
      console.error("[firecrawl] scrape returned empty markdown for", url);
      return null;
    }

    return {
      url,
      title: data.metadata?.title || extractTitleFromUrl(url),
      description: data.metadata?.description || "",
      markdown,
      html: data.html,
      images: data.metadata?.images,
    };
  } catch (err) {
    console.error("[firecrawl] error:", err);
    return null;
  }
}

/**
 * Discover site URLs via Firecrawl map or sitemap fallback.
 */
export async function discoverSiteUrls(siteUrl: string, maxPages: number): Promise<string[]> {
  const key = process.env.FIRECRAWL_API_KEY?.trim();
  const origin = normalizeOrigin(siteUrl);

  if (key) {
    try {
      const res = await fetch(`${FIRECRAWL_BASE}/map`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          url: origin,
          limit: maxPages,
          includeSubdomains: false,
        }),
        cache: "no-store",
      });

      if (res.ok) {
        const json = await res.json();
        const links: string[] = json.links ?? json.data?.links ?? [];
        const unique = dedupeUrls(links, origin);
        if (unique.length > 0) return unique.slice(0, maxPages);
      } else {
        console.error("[firecrawl] map failed:", res.status, await res.text());
      }
    } catch (err) {
      console.error("[firecrawl] map error:", err);
    }
  }

  const sitemapUrls = await parseSitemap(origin, maxPages);
  if (sitemapUrls.length > 0) return sitemapUrls;

  return [origin];
}

function normalizeOrigin(url: string): string {
  try {
    const u = new URL(url);
    return u.origin;
  } catch {
    return url;
  }
}

function dedupeUrls(urls: string[], origin: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of urls) {
    try {
      const u = new URL(raw, origin);
      if (u.origin !== origin) continue;
      const normalized = u.href.replace(/\/$/, "") || u.origin;
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push(normalized);
      }
    } catch {
      // skip invalid
    }
  }

  return result;
}

async function parseSitemap(origin: string, maxPages: number): Promise<string[]> {
  try {
    const res = await fetch(`${origin}/sitemap.xml`, { cache: "no-store" });
    if (!res.ok) return [];

    const xml = await res.text();
    const locMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)];
    const urls = locMatches
      .map((m) => m[1]?.trim())
      .filter((u): u is string => !!u && u.startsWith(origin));

    return dedupeUrls(urls, origin).slice(0, maxPages);
  } catch {
    return [];
  }
}

function extractTitleFromUrl(url: string): string {
  try {
    const seg = new URL(url).pathname.split("/").filter(Boolean).pop() || "";
    return seg.replace(/[-_]/g, " ").replace(/\.\w+$/, "").replace(/\b\w/g, (c) => c.toUpperCase()) || "Product page";
  } catch {
    return "Product page";
  }
}
