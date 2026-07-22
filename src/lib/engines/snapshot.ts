import type { PageSnapshot } from "./types";



export function buildSnapshot(

  url: string,

  scraped: { markdown: string; html?: string },

  siteSignals?: { hasRobotsTxt: boolean; hasSitemap: boolean }

): PageSnapshot {

  const html = scraped.html ?? "";

  const md = scraped.markdown ?? "";



  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  const title = titleMatch?.[1]?.trim() ?? extractFirstLine(md);



  const metaDescMatch =

    html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) ||

    html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);

  const metaDescription = metaDescMatch?.[1]?.trim() ?? "";



  const ogTitleMatch =

    html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i) ||

    html.match(/<meta\s+content=["']([^"']*)["']\s+property=["']og:title["']/i);

  const ogDescMatch =

    html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i) ||

    html.match(/<meta\s+content=["']([^"']*)["']\s+property=["']og:description["']/i);

  const openGraphTitle = ogTitleMatch?.[1]?.trim() ?? "";

  const openGraphDescription = ogDescMatch?.[1]?.trim() ?? "";

  const hasOpenGraphImage = /<meta[^>]*property=["']og:image["']/i.test(html);



  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];

  const h1 = h1Matches.map((m) => stripTags(m[1]).trim()).filter(Boolean);



  const headingMatches = [...html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)];

  const headings = headingMatches.map((m) => ({

    level: parseInt(m[1]),

    text: stripTags(m[2]).trim(),

  }));



  const imgMatches = [...html.matchAll(/<img[\s>]/gi)];

  const images = imgMatches.length;



  let pageOrigin = "";

  try {

    pageOrigin = new URL(url).origin;

  } catch {

    pageOrigin = "";

  }



  const linkMatches = [...html.matchAll(/<a\s[^>]*href=["']([^"']*?)["'][^>]*>([\s\S]*?)<\/a>/gi)];

  const links = linkMatches.map((m) => ({ href: m[1], text: stripTags(m[2]).trim() }));

  const internalLinkCount = links.filter((l) => {

    if (!l.href || l.href.startsWith("#") || l.href.startsWith("mailto:") || l.href.startsWith("tel:"))

      return false;

    try {

      const href = l.href.startsWith("http") ? l.href : new URL(l.href, url).href;

      return href.startsWith(pageOrigin);

    } catch {

      return l.href.startsWith("/");

    }

  }).length;



  const hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(html);

  const hasHttps = url.startsWith("https://");

  const schemaOrg = extractSchemaOrg(html);

  const pageWeightKb = Math.round((html.length + md.length) / 1024);

  const hasViewportMeta = /<meta[^>]*name=["']viewport["']/i.test(html);
  const formCount = (html.match(/<form[\s>]/gi) || []).length;
  const hasSearchInput =
    /type=["']search["']|name=["']q["']|placeholder=["'][^"']*(search|بحث)[^"']*["']/i.test(html) ||
    /search|بحث/i.test(md);
  const hasCartCues =
    /add to cart|cart|basket|buy now|checkout|أضف للسلة|السلة|اشتر/i.test(html) || /cart|checkout|سلة/i.test(md);



  return {

    url,

    title,

    metaDescription,

    h1,

    headings,

    html,

    markdown: md,

    images,

    links,

    hasCanonical,

    hasHttps,

    schemaOrg,

    openGraphTitle,

    openGraphDescription,

    hasOpenGraphImage,

    internalLinkCount,

    pageWeightKb,

    siteHasRobotsTxt: siteSignals?.hasRobotsTxt ?? false,

    siteHasSitemap: siteSignals?.hasSitemap ?? false,

    hasViewportMeta,
    formCount,
    hasSearchInput,
    hasCartCues,

  };

}



function extractFirstLine(md: string): string {

  const line = md.split("\n").find((l) => l.trim().length > 0) ?? "";

  return line.replace(/^#+\s*/, "").trim();

}



function stripTags(s: string): string {

  return s.replace(/<[^>]*>/g, "");

}



function extractSchemaOrg(html: string): Record<string, unknown>[] {

  const matches = [

    ...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),

  ];

  const result: Record<string, unknown>[] = [];

  for (const m of matches) {

    try {

      const parsed = JSON.parse(m[1]);

      if (Array.isArray(parsed)) result.push(...parsed);

      else result.push(parsed);

    } catch {

      /* ignore invalid JSON-LD */

    }

  }

  return result;

}


