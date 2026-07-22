export interface SiteSignals {
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
}

export async function fetchSiteSignals(pageUrl: string): Promise<SiteSignals> {
  try {
    const origin = new URL(pageUrl).origin;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const [robotsRes, sitemapRes] = await Promise.all([
      fetch(`${origin}/robots.txt`, { signal: controller.signal, cache: "no-store" }).catch(() => null),
      fetch(`${origin}/sitemap.xml`, { signal: controller.signal, cache: "no-store" }).catch(() => null),
    ]);

    clearTimeout(timeout);

    return {
      hasRobotsTxt: robotsRes?.ok ?? false,
      hasSitemap: sitemapRes?.ok ?? false,
    };
  } catch {
    return { hasRobotsTxt: false, hasSitemap: false };
  }
}
