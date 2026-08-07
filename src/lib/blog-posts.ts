import type { TranslationKey } from "@/lib/i18n";

export interface BlogPostMeta {
  slug: string;
  titleKey: TranslationKey;
  excerptKey: TranslationKey;
}

/**
 * Slug → title/excerpt lookup for `generateMetadata` on `/blog/[slug]`.
 * Kept as its own minimal module (rather than importing the full `POSTS`
 * array from `blog/[slug]/page.tsx`) so this stays a plain server-safe
 * import with no dependency on that "use client" page component.
 */
export const BLOG_POSTS: readonly BlogPostMeta[] = [
  { slug: "geo-ai-visibility-guide", titleKey: "blog.post1.title", excerptKey: "blog.post1.excerpt" },
  { slug: "conversion-rate-optimization", titleKey: "blog.post2.title", excerptKey: "blog.post2.excerpt" },
  { slug: "product-schema-markup", titleKey: "blog.post3.title", excerptKey: "blog.post3.excerpt" },
  { slug: "competitor-analysis-strategy", titleKey: "blog.post4.title", excerptKey: "blog.post4.excerpt" },
  { slug: "ai-product-descriptions", titleKey: "blog.post5.title", excerptKey: "blog.post5.excerpt" },
  { slug: "trust-signals-ecommerce", titleKey: "blog.post6.title", excerptKey: "blog.post6.excerpt" },
];
