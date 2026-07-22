import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog/posts";
import { getBlogSeo } from "@/lib/blog/seo";
import { getSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  const routes = [
    { path: "", priority: 1, changeFreq: "weekly" as const },
    { path: "/features", priority: 0.9, changeFreq: "monthly" as const },
    { path: "/how-it-works", priority: 0.9, changeFreq: "monthly" as const },
    { path: "/ai-generator", priority: 0.85, changeFreq: "monthly" as const },
    { path: "/geo-visibility", priority: 0.85, changeFreq: "monthly" as const },
    { path: "/pricing", priority: 0.9, changeFreq: "monthly" as const },
    { path: "/blog", priority: 0.8, changeFreq: "weekly" as const },
    { path: "/about", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/contact", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/docs", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/affiliate", priority: 0.6, changeFreq: "monthly" as const },
    { path: "/privacy", priority: 0.4, changeFreq: "yearly" as const },
    { path: "/terms", priority: 0.4, changeFreq: "yearly" as const },
    { path: "/legal/refund-policy", priority: 0.4, changeFreq: "yearly" as const },
  ];

  const blogRoutes = BLOG_POSTS.map((post) => {
    const seo = getBlogSeo(post.slug);
    return {
      url: `${base}/blog/${post.slug}`,
      lastModified: seo ? new Date(seo.modifiedAt) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    };
  });

  return [
    ...routes.map((r) => ({
      url: `${base}${r.path}`,
      lastModified: now,
      changeFrequency: r.changeFreq,
      priority: r.priority,
    })),
    ...blogRoutes,
  ];
}
