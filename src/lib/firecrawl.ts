import "server-only";
import type { ScrapedPage } from "./gemini";

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";

export function isFirecrawlConfigured(): boolean {
  return !!process.env.FIRECRAWL_API_KEY;
}

/**
 * Scrape a URL with Firecrawl. Returns markdown + metadata.
 * Returns null if Firecrawl isn't configured or the scrape fails.
 */
export async function scrapePage(url: string): Promise<ScrapedPage | null> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) {
    // Demo mode — return a minimal stub so the audit flow can proceed.
    return {
      url,
      title: extractTitleFromUrl(url),
      description: "",
      markdown: "Demo mode: Firecrawl is not configured. Add FIRECRAWL_API_KEY to enable real page scraping.",
    };
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
      // @ts-expect-error - Next.js supports this
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error("[firecrawl] scrape failed:", res.status, await res.text());
      return null;
    }

    const json = await res.json();
    const data = json.data ?? json;
    return {
      url,
      title: data.metadata?.title || extractTitleFromUrl(url),
      description: data.metadata?.description || "",
      markdown: data.markdown || "",
      html: data.html,
      images: data.metadata?.images,
    };
  } catch (err) {
    console.error("[firecrawl] error:", err);
    return null;
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
