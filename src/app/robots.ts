import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Signed-in app surface — never meant to be crawled or indexed. Kept in sync
 * with `PROTECTED_PATHS`/`AUTH_PATHS` in `src/lib/supabase/middleware.ts` and
 * mirrored by `robots: { index: false }` in each segment's own `layout.tsx`
 * (robots.txt only stops crawling; the meta tag is what actually keeps a
 * URL out of the index if it's ever linked from elsewhere).
 */
const PRIVATE_APP_PATHS = [
  "/dashboard",
  "/health",
  "/audit",
  "/history",
  "/reports",
  "/monitor",
  "/geo",
  "/settings",
  "/checkout",
  "/onboarding",
  "/auth",
];

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", ...PRIVATE_APP_PATHS],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
