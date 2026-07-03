import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://storepulse.ai";
  const now = new Date();

  const routes = [
    { path: "", priority: 1, changeFreq: "weekly" as const },
    { path: "/#features", priority: 0.9, changeFreq: "monthly" as const },
    { path: "/#how", priority: 0.9, changeFreq: "monthly" as const },
    { path: "/#scores", priority: 0.8, changeFreq: "monthly" as const },
    { path: "/#pricing", priority: 0.9, changeFreq: "monthly" as const },
    { path: "/#faq", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/#concept", priority: 0.8, changeFreq: "monthly" as const },
    { path: "/#comparison", priority: 0.7, changeFreq: "monthly" as const },
    { path: "/#security", priority: 0.6, changeFreq: "monthly" as const },
    { path: "/#testimonials", priority: 0.6, changeFreq: "monthly" as const },
  ];

  return routes.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));
}
