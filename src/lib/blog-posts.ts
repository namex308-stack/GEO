import type { TranslationKey } from "@/lib/i18n";

export interface BlogPostMeta {
  slug: string;
  titleKey: TranslationKey;
  excerptKey: TranslationKey;
  /**
   * ISO calendar date matching the existing Arabic display date in locale messages.
   * Used for Article JSON-LD only when not in the future (sitemap omits lastModified).
   */
  publishedOn: `${number}-${number}-${number}`;
}

/**
 * Slug → title/excerpt lookup for `generateMetadata` on `/blog/[slug]`.
 * Kept as its own minimal module (rather than importing the full `POSTS`
 * array from `blog/[slug]/page.tsx`) so this stays a plain server-safe
 * import with no dependency on that "use client" page component.
 *
 * `publishedOn` mirrors the existing `blog.postN.date` strings in `ar.ts`
 * (machine-readable form of the same dates — not new editorial dates).
 */
export const BLOG_POSTS: readonly BlogPostMeta[] = [
  {
    slug: "geo-ai-visibility-guide",
    titleKey: "blog.post1.title",
    excerptKey: "blog.post1.excerpt",
    publishedOn: "2026-10-15",
  },
  {
    slug: "conversion-rate-optimization",
    titleKey: "blog.post2.title",
    excerptKey: "blog.post2.excerpt",
    publishedOn: "2026-10-10",
  },
  {
    slug: "product-schema-markup",
    titleKey: "blog.post3.title",
    excerptKey: "blog.post3.excerpt",
    publishedOn: "2026-10-05",
  },
  {
    slug: "competitor-analysis-strategy",
    titleKey: "blog.post4.title",
    excerptKey: "blog.post4.excerpt",
    publishedOn: "2026-10-01",
  },
  {
    slug: "ai-product-descriptions",
    titleKey: "blog.post5.title",
    excerptKey: "blog.post5.excerpt",
    publishedOn: "2026-09-28",
  },
  {
    slug: "trust-signals-ecommerce",
    titleKey: "blog.post6.title",
    excerptKey: "blog.post6.excerpt",
    publishedOn: "2026-09-20",
  },
];

/** Stable slug list derived from `BLOG_POSTS` (single source of truth). */
export const BLOG_SLUGS = BLOG_POSTS.map((p) => p.slug);

export function getBlogPostMeta(slug: string): BlogPostMeta | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
