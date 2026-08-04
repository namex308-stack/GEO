import type { MetadataRoute } from "next";
import { BLOG_SLUGS, ROUTES } from "@/lib/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://convaudit.com";
  const now = new Date();

  const routes = [
    { path: ROUTES.home, priority: 1, changeFreq: "weekly" as const },
    { path: ROUTES.pricing, priority: 0.9, changeFreq: "monthly" as const },
    { path: ROUTES.docs, priority: 0.7, changeFreq: "monthly" as const },
    { path: ROUTES.blog, priority: 0.8, changeFreq: "weekly" as const },
    ...BLOG_SLUGS.map((slug) => ({
      path: ROUTES.blogPost(slug),
      priority: 0.6,
      changeFreq: "monthly" as const,
    })),
    { path: ROUTES.affiliate, priority: 0.5, changeFreq: "monthly" as const },
    { path: ROUTES.security, priority: 0.5, changeFreq: "monthly" as const },
    { path: ROUTES.privacy, priority: 0.5, changeFreq: "monthly" as const },
    { path: ROUTES.status, priority: 0.4, changeFreq: "weekly" as const },
    { path: ROUTES.roadmap, priority: 0.4, changeFreq: "monthly" as const },
    { path: ROUTES.changelog, priority: 0.4, changeFreq: "weekly" as const },
  ];

  return routes.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));
}
