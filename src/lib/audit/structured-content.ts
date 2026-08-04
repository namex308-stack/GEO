/**
 * Structured-content detection for GEO (AI Visibility) analysis.
 * Pure, deterministic — operates on NormalizedPage / structuredData only.
 */

import type { NormalizedPage } from "@/lib/db/types";

export type StructuredFaq = { q: string; a: string };

export type StructuredContentSignals = {
  faqCount: number;
  hasFaq: boolean;
  hasFaqSchema: boolean;
  hasProductSchema: boolean;
  hasOrganizationSchema: boolean;
  hasBreadcrumbSchema: boolean;
  jsonLdTypes: string[];
  headings: string[];
  headingCount: number;
  hasH1LikeHeading: boolean;
  headingDepthScore: number;
  wordCount: number;
  paragraphCount: number;
  listItemCount: number;
  internalLinkCount: number;
  externalLinkCount: number;
  totalLinkCount: number;
  hasBrand: boolean;
  hasPrice: boolean;
  hasProductName: boolean;
  hasCategoryHint: boolean;
  hasTitle: boolean;
  hasDescription: boolean;
  hasOgTitle: boolean;
  hasOgDescription: boolean;
  hasOgImage: boolean;
  descriptionLength: number;
  avgSentenceLength: number;
  hasBenefitStatement: boolean;
  hasQuestionPatterns: boolean;
};

const EMPTY: StructuredContentSignals = {
  faqCount: 0,
  hasFaq: false,
  hasFaqSchema: false,
  hasProductSchema: false,
  hasOrganizationSchema: false,
  hasBreadcrumbSchema: false,
  jsonLdTypes: [],
  headings: [],
  headingCount: 0,
  hasH1LikeHeading: false,
  headingDepthScore: 0,
  wordCount: 0,
  paragraphCount: 0,
  listItemCount: 0,
  internalLinkCount: 0,
  externalLinkCount: 0,
  totalLinkCount: 0,
  hasBrand: false,
  hasPrice: false,
  hasProductName: false,
  hasCategoryHint: false,
  hasTitle: false,
  hasDescription: false,
  hasOgTitle: false,
  hasOgDescription: false,
  hasOgImage: false,
  descriptionLength: 0,
  avgSentenceLength: 0,
  hasBenefitStatement: false,
  hasQuestionPatterns: false,
};

/** Detect GEO-relevant structured content signals from a normalized page. */
export function detectStructuredContent(page: NormalizedPage | null | undefined): StructuredContentSignals {
  if (!page) return { ...EMPTY };

  try {
    const sd = asRecord(page.structuredData);
    const markdown = typeof page.markdown === "string" ? page.markdown : "";
    const title = (page.title || "").trim();
    const description = (page.description || "").trim();

    const jsonLdTypes = normalizeTypes(sd.jsonLdTypes);
    const faqs = readFaqs(sd.faq);
    const headings = readHeadings(sd.headings, markdown);
    const openGraph = asRecord(sd.openGraph);
    const metaFromSd = asRecord(sd.metadata);
    const metaFallback = asRecord(sd.meta);
    const meta = Object.keys(metaFromSd).length > 0 ? metaFromSd : metaFallback;

    const host = safeHostname(page.url);
    const links = analyzeLinks(markdown, host);
    const wordCount = countWords(markdown);
    const paragraphCount = countParagraphs(markdown);
    const listItemCount = countListItems(markdown);
    const sentences = splitSentences(markdown);
    const avgSentenceLength =
      sentences.length > 0
        ? sentences.reduce((sum, s) => sum + countWords(s), 0) / sentences.length
        : 0;

    const hasFaqSchema = jsonLdTypes.some((t) => /faqpage/i.test(t));
    const hasProductSchema = jsonLdTypes.some((t) =>
      /^(product|productgroup|individualproduct)$/i.test(t)
    );
    const hasOrganizationSchema = jsonLdTypes.some((t) =>
      /^(organization|corporation|localbusiness|store|onlinebusiness)$/i.test(t)
    );
    const hasBreadcrumbSchema = jsonLdTypes.some((t) => /breadcrumb/i.test(t));

    const brand = typeof sd.brand === "string" && sd.brand.trim().length > 0;
    const price = Boolean(sd.price || sd.hasPriceSignal);
    const descLen = description.length || (typeof sd.description === "string" ? sd.description.length : 0);

    return {
      faqCount: faqs.length,
      hasFaq: faqs.length > 0 || hasFaqSchema || hasFaqHeading(headings, markdown),
      hasFaqSchema,
      hasProductSchema,
      hasOrganizationSchema,
      hasBreadcrumbSchema,
      jsonLdTypes,
      headings,
      headingCount: headings.length,
      hasH1LikeHeading: headings.length > 0 || /^#\s+\S/m.test(markdown),
      headingDepthScore: scoreHeadingDepth(markdown, headings.length),
      wordCount,
      paragraphCount,
      listItemCount,
      internalLinkCount: links.internal,
      externalLinkCount: links.external,
      totalLinkCount: links.total,
      hasBrand: brand,
      hasPrice: price,
      hasProductName: title.length >= 3,
      hasCategoryHint: /\/(collections?|categor(?:y|ies)|shop)\//i.test(page.url) ||
        headings.some((h) => /collection|category|shop/i.test(h)),
      hasTitle: title.length > 0 || Boolean(openGraph["og:title"] || meta?.title),
      hasDescription: descLen > 0,
      hasOgTitle: Boolean(openGraph["og:title"]),
      hasOgDescription: Boolean(openGraph["og:description"]),
      hasOgImage: Boolean(openGraph["og:image"] || sd.ogImage || sd.primaryImageUrl),
      descriptionLength: descLen,
      avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
      hasBenefitStatement: detectBenefitStatement(markdown, description),
      hasQuestionPatterns: /\?/.test(markdown) || faqs.length > 0,
    };
  } catch {
    return { ...EMPTY };
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function normalizeTypes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim())
    ),
  ];
}

function readFaqs(value: unknown): StructuredFaq[] {
  if (!Array.isArray(value)) return [];
  const out: StructuredFaq[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const q = typeof row.q === "string" ? row.q : typeof row.question === "string" ? row.question : "";
    const a = typeof row.a === "string" ? row.a : typeof row.answer === "string" ? row.answer : "";
    if (q.trim() && a.trim()) out.push({ q: q.trim(), a: a.trim() });
  }
  return out;
}

function readHeadings(fromSd: unknown, markdown: string): string[] {
  if (Array.isArray(fromSd)) {
    const list = fromSd.filter((h): h is string => typeof h === "string" && h.trim().length > 0);
    if (list.length) return list.slice(0, 30);
  }
  return markdown
    .split("\n")
    .filter((l) => /^#{1,3}\s+\S/.test(l))
    .slice(0, 30)
    .map((l) => l.replace(/^#{1,3}\s+/, "").trim());
}

function hasFaqHeading(headings: string[], markdown: string): boolean {
  if (headings.some((h) => /faq|frequently asked|أسئلة|سؤال/i.test(h))) return true;
  return /(?:^|\n)#{1,3}\s+.*\b(faq|frequently asked)\b/i.test(markdown);
}

function scoreHeadingDepth(markdown: string, headingCount: number): number {
  if (headingCount <= 0) return 0;
  const h1 = (markdown.match(/^#\s+\S/gm) ?? []).length;
  const h2 = (markdown.match(/^##\s+\S/gm) ?? []).length;
  const h3 = (markdown.match(/^###\s+\S/gm) ?? []).length;
  let score = 0;
  if (h1 >= 1 || headingCount >= 1) score += 0.35;
  if (h2 >= 2 || headingCount >= 3) score += 0.35;
  if (h3 >= 1 || headingCount >= 5) score += 0.3;
  return Math.min(1, score);
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

function countParagraphs(markdown: string): number {
  return markdown
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 40 && !/^#{1,6}\s/.test(p)).length;
}

function countListItems(markdown: string): number {
  return (markdown.match(/^\s*[-*+]\s+\S/gm) ?? []).length +
    (markdown.match(/^\s*\d+\.\s+\S/gm) ?? []).length;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?؟])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
}

function detectBenefitStatement(markdown: string, description: string): boolean {
  const sample = `${description}\n${markdown}`.slice(0, 2500);
  return /\b(for|helps?|designed for|ideal for|perfect for|مناسب|يساعد|مصمم)\b/i.test(sample);
}

function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

function analyzeLinks(
  markdown: string,
  host: string | null
): { internal: number; external: number; total: number } {
  const matches = markdown.match(/\[[^\]]+\]\(([^)]+)\)/g) ?? [];
  let internal = 0;
  let external = 0;

  for (const match of matches) {
    const hrefMatch = match.match(/\(([^)]+)\)/);
    const href = hrefMatch?.[1]?.trim() ?? "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      continue;
    }
    if (href.startsWith("/") || href.startsWith("./") || href.startsWith("../")) {
      internal += 1;
      continue;
    }
    try {
      const linkHost = new URL(href).hostname.replace(/^www\./i, "").toLowerCase();
      if (host && (linkHost === host || linkHost.endsWith(`.${host}`))) internal += 1;
      else external += 1;
    } catch {
      // Relative or malformed — treat as internal when host is known
      if (host) internal += 1;
    }
  }

  // structuredData.links is a count from extraction when markdown links are sparse
  const total = internal + external;
  return { internal, external, total };
}
