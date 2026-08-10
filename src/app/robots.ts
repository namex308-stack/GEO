import type { MetadataRoute } from "next";
import { ROBOTS_DISALLOW_PATHS } from "@/lib/seo/private-app-paths";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

/**
 * Crawl policy for all bots (Google, Bing, AI crawlers, etc.).
 *
 * - Public marketing/content stays crawlable (`Allow: /`).
 * - Private app prefixes + `/api/` are disallowed (see `ROBOTS_DISALLOW_PATHS`).
 * - One `*` rule is enough: identical per-bot allow rules are not restrictions
 *   and add no policy difference.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...ROBOTS_DISALLOW_PATHS],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: base,
  };
}
