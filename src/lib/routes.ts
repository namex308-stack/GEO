/**
 * Centralized route path constants. All ConvAudit routes stay Latin regardless
 * of UI locale — switching language never changes a URL. Keep new routes here
 * so links, redirects, and the sitemap stay consistent as pages are added.
 */

export const ROUTES = {
  home: "/",
  pricing: "/pricing",
  docs: "/docs",
  blog: "/blog",
  blogPost: (slug: string) => `/blog/${slug}`,
  affiliate: "/affiliate",
  security: "/security",
  privacy: "/privacy",
  status: "/status",
  roadmap: "/roadmap",
  changelog: "/changelog",

  auth: "/auth",
  dashboard: "/dashboard",
  history: "/history",
  settings: "/settings",
  settingsBilling: "/settings/billing",
  checkout: "/checkout",

  onboarding: "/onboarding",
  onboardingStep: (slug: string) => `/onboarding/${slug}`,
  onboardingDone: "/onboarding/done",

  auditNew: "/audit/new",
  auditReport: (id: string) => `/audit/${id}/report`,
  auditCompare: (id: string) => `/audit/${id}/compare`,
  auditGenerate: (id: string) => `/audit/${id}/generate`,
} as const;

/** Re-export from blog-posts so sitemap/routes stay aligned with metadata. */
export { BLOG_SLUGS } from "@/lib/blog-posts";
