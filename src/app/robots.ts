import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/settings",
          "/settings/",
          "/audit/",
          "/history",
          "/onboarding",
          "/onboarding/",
          "/tools/",
          "/ai",
          "/ai-center",
          "/auth",
          "/login",
          "/signup",
          "/billing",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
