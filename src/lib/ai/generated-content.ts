import { z } from "zod";
import type { NormalizedPage } from "@/lib/db/types";

export const GeneratedContentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(8000),
  faq: z
    .array(
      z.object({
        q: z.string().min(1).max(300),
        a: z.string().min(1).max(2000),
      })
    )
    .max(12)
    .default([]),
  metaDescription: z.string().min(1).max(320),
  adCopy: z
    .array(
      z.object({
        platform: z.string().min(1).max(80),
        headline: z.string().min(1).max(200),
        body: z.string().min(1).max(1000),
        cta: z.string().min(1).max(80),
      })
    )
    .max(6)
    .default([]),
  source: z.enum(["gemini", "page"]).optional(),
});

export type GeneratedContent = z.infer<typeof GeneratedContentSchema>;

export function parseGeneratedContent(raw: unknown): GeneratedContent | null {
  const parsed = GeneratedContentSchema.safeParse(raw);
  if (!parsed.success) return null;
  return {
    ...parsed.data,
    title: parsed.data.title.trim().slice(0, 120),
    description: parsed.data.description.trim(),
    metaDescription: parsed.data.metaDescription.trim().slice(0, 160),
    faq: parsed.data.faq.slice(0, 8),
    adCopy: parsed.data.adCopy.slice(0, 3),
  };
}

/**
 * Build copy strictly from crawled page fields — never marketing sample text.
 */
export function generatedContentFromPage(page: NormalizedPage): GeneratedContent {
  const sd = page.structuredData ?? {};
  const title = (page.title || "منتج").trim().slice(0, 70);
  const description =
    (page.description || "").trim() ||
    page.markdown.slice(0, 600).trim() ||
    `صفحة المنتج على ${page.url}`;

  const faqFromPage = Array.isArray(sd.faq)
    ? (sd.faq as { q?: string; a?: string }[])
        .filter((f) => typeof f?.q === "string" && typeof f?.a === "string")
        .map((f) => ({ q: String(f.q).slice(0, 200), a: String(f.a).slice(0, 600) }))
        .slice(0, 5)
    : [];

  const price = typeof sd.price === "string" ? sd.price : null;
  const brand = typeof sd.brand === "string" ? sd.brand : null;

  return {
    title,
    description,
    faq: faqFromPage,
    metaDescription: description.slice(0, 155),
    adCopy: [
      {
        platform: "Meta / Instagram",
        headline: title.slice(0, 60),
        body: [description.slice(0, 180), price ? `السعر: ${price}` : null, brand ? `العلامة: ${brand}` : null]
          .filter(Boolean)
          .join(" · "),
        cta: "تسوّق الآن",
      },
      {
        platform: "TikTok",
        headline: title.slice(0, 50),
        body: description.slice(0, 140),
        cta: "اعرف المزيد",
      },
      {
        platform: "Google Search",
        headline: title.slice(0, 60),
        body: description.slice(0, 140),
        cta: "اشترِ الآن",
      },
    ],
    source: "page",
  };
}
