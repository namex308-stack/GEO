/**
 * Product-page structured extraction (CSS / meta / OG / JSON-LD / text).
 * Pure helpers — no server-only import so vitest can cover them.
 */

import { decodeHtmlEntities } from "@/lib/text/decode-html";

export type ExtractedFaq = { q: string; a: string };

export type PageExtraction = {
  title: string | null;
  description: string | null;
  price: string | null;
  brand: string | null;
  rating: string | null;
  reviews: string | null;
  images: string[];
  faq: ExtractedFaq[];
  meta: Record<string, string>;
  openGraph: Record<string, string>;
  jsonLdTypes: string[];
  /** Truncated JSON-LD graph (Product / Offer / FAQ / Review signals). */
  schema: unknown[];
  headings: string[];
  links: number;
  hasPriceSignal: boolean;
  hasCtaSignal: boolean;
  primaryImageUrl: string | null;
  ogImage: string | null;
};

const META_KEYS = [
  "description",
  "keywords",
  "author",
  "robots",
  "viewport",
  "theme-color",
  "twitter:card",
  "twitter:title",
  "twitter:description",
  "twitter:image",
  "product:price:amount",
  "product:price:currency",
  "product:brand",
  "product:availability",
] as const;

const OG_KEYS = [
  "og:title",
  "og:description",
  "og:image",
  "og:url",
  "og:type",
  "og:site_name",
  "og:locale",
  "og:price:amount",
  "og:price:currency",
] as const;

export function emptyExtraction(): PageExtraction {
  return {
    title: null,
    description: null,
    price: null,
    brand: null,
    rating: null,
    reviews: null,
    images: [],
    faq: [],
    meta: {},
    openGraph: {},
    jsonLdTypes: [],
    schema: [],
    headings: [],
    links: 0,
    hasPriceSignal: false,
    hasCtaSignal: false,
    primaryImageUrl: null,
    ogImage: null,
  };
}

export function extractPageData(
  html: string | undefined,
  markdown: string,
  metadata: Record<string, unknown> | undefined,
  pageUrl: string
): PageExtraction {
  const out = emptyExtraction();
  out.headings = extractHeadings(markdown);
  out.links = extractLinkCount(markdown);
  out.hasPriceSignal = /\$|€|£|EGP|SAR|USD|AED|\d+[.,]\d{2}/.test(markdown);
  out.hasCtaSignal = /add to cart|buy now|shop now|checkout|اطلب|اشتر|أضف إلى السلة/i.test(markdown);

  out.title =
    (typeof metadata?.title === "string" && metadata.title) ||
    (html ? extractHtmlTitle(html) : "") ||
    null;
  out.description =
    (typeof metadata?.description === "string" && metadata.description) ||
    (html ? extractMetaContent(html, "description") || extractMetaContent(html, "og:description") : "") ||
    null;

  if (Array.isArray(metadata?.images)) {
    out.images = metadata.images.filter((u): u is string => typeof u === "string").slice(0, 20);
  }

  if (html) {
    out.meta = collectMeta(html, META_KEYS);
    out.openGraph = collectMeta(html, OG_KEYS);
    const schema = parseJsonLd(html);
    out.schema = schema.slice(0, 12);
    out.jsonLdTypes = collectJsonLdTypes(schema);

    applyJsonLdFields(schema, out, pageUrl);
    applyMetaFields(out);
    applyHtmlHeuristics(html, markdown, out, pageUrl);

    if (!out.images.length) {
      out.images = collectImageSrcs(html, pageUrl).slice(0, 20);
    }
  } else {
    // Firecrawl metadata-only path
    if (typeof metadata?.ogTitle === "string") out.openGraph["og:title"] = metadata.ogTitle;
    if (typeof metadata?.ogDescription === "string") {
      out.openGraph["og:description"] = metadata.ogDescription;
    }
    if (typeof metadata?.language === "string") out.meta.language = metadata.language;
    applyTextPriceBrand(markdown, out);
  }

  const ogImage =
    out.openGraph["og:image"] ||
    (typeof metadata?.ogImage === "string" && metadata.ogImage) ||
    (typeof metadata?.image === "string" && metadata.image) ||
    out.images[0] ||
    null;
  out.ogImage = ogImage;
  out.primaryImageUrl = ogImage;

  if (out.price) out.hasPriceSignal = true;
  if (out.title) out.title = decodeHtmlEntities(out.title);

  return out;
}

export function extractionToStructuredData(extracted: PageExtraction): Record<string, unknown> {
  return {
    metadata: {
      title: extracted.title,
      description: extracted.description,
      language: extracted.meta.language ?? extracted.meta["language"] ?? null,
      ...Object.fromEntries(
        Object.entries(extracted.meta).filter(([k]) =>
          ["keywords", "robots", "author", "twitter:card", "twitter:title"].includes(k)
        )
      ),
    },
    openGraph: extracted.openGraph,
    price: extracted.price,
    brand: extracted.brand,
    rating: extracted.rating,
    reviews: extracted.reviews,
    faq: extracted.faq,
    images: extracted.images,
    jsonLdTypes: extracted.jsonLdTypes,
    schema: extracted.schema,
    headings: extracted.headings,
    links: extracted.links,
    hasPriceSignal: extracted.hasPriceSignal,
    hasCtaSignal: extracted.hasCtaSignal,
    primaryImageUrl: extracted.primaryImageUrl,
    ogImage: extracted.ogImage,
  };
}

function collectMeta(html: string, keys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const v = extractMetaContent(html, key);
    if (v) out[key] = v;
  }
  return out;
}

function parseJsonLd(html: string): unknown[] {
  const items: unknown[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]!);
      flattenJsonLd(parsed, items);
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return items;
}

function flattenJsonLd(node: unknown, out: unknown[]): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) flattenJsonLd(item, out);
    return;
  }
  const obj = node as Record<string, unknown>;
  if (obj["@graph"] && Array.isArray(obj["@graph"])) {
    for (const item of obj["@graph"]) flattenJsonLd(item, out);
    return;
  }
  out.push(truncateSchemaNode(obj));
}

function truncateSchemaNode(obj: Record<string, unknown>): Record<string, unknown> {
  const keep = [
    "@type",
    "@id",
    "name",
    "brand",
    "description",
    "sku",
    "image",
    "offers",
    "aggregateRating",
    "review",
    "mainEntity",
    "acceptedAnswer",
    "text",
    "price",
    "priceCurrency",
    "availability",
    "url",
  ];
  const slim: Record<string, unknown> = {};
  for (const k of keep) {
    if (k in obj) slim[k] = slimValue(obj[k]);
  }
  return slim;
}

function slimValue(v: unknown): unknown {
  if (v == null) return v;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
  if (Array.isArray(v)) return v.slice(0, 8).map(slimValue);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (o.acceptedAnswer != null || normalizeTypes(o["@type"]).has("Question")) {
      return {
        "@type": o["@type"],
        name: o.name,
        text: typeof o.text === "string" ? o.text.slice(0, 400) : undefined,
        acceptedAnswer: slimValue(o.acceptedAnswer),
      };
    }
    if (typeof o.ratingValue !== "undefined") {
      return {
        "@type": o["@type"],
        ratingValue: o.ratingValue,
        reviewCount: o.reviewCount ?? o.ratingCount,
      };
    }
    if (typeof o.price === "string" || typeof o.price === "number") {
      return {
        "@type": o["@type"],
        price: o.price,
        priceCurrency: o.priceCurrency,
        availability: o.availability,
      };
    }
    if (typeof o.text === "string") return { text: o.text.slice(0, 400), name: o.name };
    if (typeof o.name === "string") return { name: o.name, "@type": o["@type"] };
  }
  return undefined;
}

function collectJsonLdTypes(schema: unknown[]): string[] {
  const types: string[] = [];
  for (const item of schema) {
    if (!item || typeof item !== "object") continue;
    const t = (item as Record<string, unknown>)["@type"];
    if (typeof t === "string") types.push(t);
    if (Array.isArray(t)) types.push(...t.filter((x): x is string => typeof x === "string"));
  }
  return [...new Set(types)];
}

function applyJsonLdFields(schema: unknown[], out: PageExtraction, pageUrl: string): void {
  for (const item of schema) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const types = normalizeTypes(obj["@type"]);

    if (types.has("Product") || types.has("ProductGroup") || types.has("IndividualProduct")) {
      if (!out.title && typeof obj.name === "string") out.title = obj.name;
      if (!out.description && typeof obj.description === "string") out.description = obj.description;
      if (!out.brand) out.brand = readBrand(obj.brand);
      if (!out.price) out.price = readOfferPrice(obj.offers);
      const rating = readAggregateRating(obj.aggregateRating);
      if (rating) {
        if (!out.rating) out.rating = rating.rating;
        if (!out.reviews) out.reviews = rating.reviews;
      }
      const imgs = readImages(obj.image, pageUrl);
      if (imgs.length && !out.images.length) out.images = imgs;
    }

    if (types.has("Offer") || types.has("AggregateOffer")) {
      if (!out.price) out.price = readOfferPrice(obj);
    }

    if (types.has("FAQPage")) {
      const faqs = readFaqEntities(obj.mainEntity);
      if (faqs.length) out.faq = [...out.faq, ...faqs].slice(0, 12);
    }

    if (types.has("Question")) {
      const faqs = readFaqEntities([obj]);
      if (faqs.length) out.faq = [...out.faq, ...faqs].slice(0, 12);
    }
  }
}

function applyMetaFields(out: PageExtraction): void {
  if (!out.price) {
    const amount = out.meta["product:price:amount"] || out.openGraph["og:price:amount"];
    const currency = out.meta["product:price:currency"] || out.openGraph["og:price:currency"];
    if (amount) out.price = currency ? `${amount} ${currency}` : amount;
  }
  if (!out.brand) out.brand = out.meta["product:brand"] || null;
  if (!out.title) out.title = out.openGraph["og:title"] || out.meta["twitter:title"] || null;
  if (!out.description) {
    out.description = out.openGraph["og:description"] || out.meta["twitter:description"] || null;
  }
}

function applyHtmlHeuristics(
  html: string,
  markdown: string,
  out: PageExtraction,
  pageUrl: string
): void {
  applyTextPriceBrand(markdown, out);

  if (!out.rating) {
    const ratingMatch =
      html.match(/itemprop=["']ratingValue["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/content=["']([^"']+)["'][^>]*itemprop=["']ratingValue["']/i) ||
      markdown.match(/\b([0-5](?:\.\d)?)\s*\/\s*5\b/) ||
      markdown.match(/\b([0-5](?:\.\d)?)\s*stars?\b/i);
    if (ratingMatch?.[1]) out.rating = ratingMatch[1];
  }

  if (!out.reviews) {
    const reviewMatch =
      html.match(/itemprop=["']reviewCount["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/content=["']([^"']+)["'][^>]*itemprop=["']reviewCount["']/i) ||
      markdown.match(/\b(\d[\d,]*)\s+reviews?\b/i);
    if (reviewMatch?.[1]) out.reviews = reviewMatch[1].replace(/,/g, "");
  }

  if (!out.faq.length) {
    out.faq = extractFaqFromHtml(html).slice(0, 12);
  }

  if (!out.primaryImageUrl) {
    const first = extractFirstImageSrc(html, pageUrl);
    if (first) {
      out.primaryImageUrl = first;
      if (!out.images.includes(first)) out.images = [first, ...out.images].slice(0, 20);
    }
  }
}

function applyTextPriceBrand(text: string, out: PageExtraction): void {
  if (!out.price) {
    const m =
      text.match(/(?:EGP|SAR|USD|AED|€|£|\$)\s*[\d.,]+/i) ||
      text.match(/[\d.,]+\s*(?:EGP|SAR|USD|AED)/i);
    if (m) out.price = m[0]!.replace(/\s+/g, " ").trim();
  }
  if (!out.brand) {
    const brandLine = text.match(/\bBrand[:\s]+([A-Za-z0-9][\w &.-]{1,40})/i);
    if (brandLine?.[1]) out.brand = brandLine[1].trim();
  }
}

function extractFaqFromHtml(html: string): ExtractedFaq[] {
  const faqs: ExtractedFaq[] = [];
  const detailsRe = /<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi;
  let m: RegExpExecArray | null;
  while ((m = detailsRe.exec(html)) !== null) {
    const q = stripTags(m[1]!).trim();
    const a = stripTags(m[2]!).trim();
    if (q && a) faqs.push({ q: q.slice(0, 200), a: a.slice(0, 600) });
  }
  return faqs;
}

function normalizeTypes(t: unknown): Set<string> {
  const set = new Set<string>();
  if (typeof t === "string") set.add(t);
  if (Array.isArray(t)) for (const x of t) if (typeof x === "string") set.add(x);
  return set;
}

function readBrand(brand: unknown): string | null {
  if (typeof brand === "string") return brand;
  if (brand && typeof brand === "object" && typeof (brand as { name?: string }).name === "string") {
    return (brand as { name: string }).name;
  }
  return null;
}

function readOfferPrice(offers: unknown): string | null {
  if (!offers) return null;
  const list = Array.isArray(offers) ? offers : [offers];
  for (const offer of list) {
    if (!offer || typeof offer !== "object") continue;
    const o = offer as Record<string, unknown>;
    const price = o.price ?? o.lowPrice;
    if (price == null) continue;
    const currency = typeof o.priceCurrency === "string" ? o.priceCurrency : "";
    return currency ? `${price} ${currency}` : String(price);
  }
  return null;
}

function readAggregateRating(
  rating: unknown
): { rating: string; reviews: string | null } | null {
  if (!rating || typeof rating !== "object") return null;
  const r = rating as Record<string, unknown>;
  if (r.ratingValue == null) return null;
  const count = r.reviewCount ?? r.ratingCount;
  return {
    rating: String(r.ratingValue),
    reviews: count != null ? String(count) : null,
  };
}

function readFaqEntities(mainEntity: unknown): ExtractedFaq[] {
  if (!mainEntity) return [];
  const list = Array.isArray(mainEntity) ? mainEntity : [mainEntity];
  const faqs: ExtractedFaq[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const q = item as Record<string, unknown>;
    const question = typeof q.name === "string" ? q.name : typeof q.text === "string" ? q.text : "";
    const answerNode = q.acceptedAnswer;
    let answer = "";
    if (typeof answerNode === "string") answer = answerNode;
    else if (answerNode && typeof answerNode === "object") {
      const a = answerNode as Record<string, unknown>;
      if (typeof a.text === "string") answer = a.text;
    }
    if (question && answer) faqs.push({ q: question.slice(0, 200), a: answer.slice(0, 600) });
  }
  return faqs;
}

function readImages(image: unknown, pageUrl: string): string[] {
  if (!image) return [];
  const list = Array.isArray(image) ? image : [image];
  const out: string[] = [];
  for (const item of list) {
    if (typeof item === "string") {
      try {
        out.push(new URL(item, pageUrl).href);
      } catch {
        /* skip */
      }
    } else if (item && typeof item === "object" && typeof (item as { url?: string }).url === "string") {
      try {
        out.push(new URL((item as { url: string }).url, pageUrl).href);
      } catch {
        /* skip */
      }
    }
  }
  return out;
}

export function extractHtmlTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const raw = m?.[1]?.replace(/\s+/g, " ").trim() || "";
  return decodeHtmlEntities(raw);
}

export function extractMetaContent(html: string, name: string): string {
  const re = new RegExp(
    `<meta[^>]*(?:name|property)=["']${escapeRegExp(name)}["'][^>]*content=["']([^"']*)["'][^>]*>|<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${escapeRegExp(name)}["'][^>]*>`,
    "i"
  );
  const m = html.match(re);
  return (m?.[1] || m?.[2] || "").trim();
}

export function extractFirstImageSrc(html: string, pageUrl: string): string | undefined {
  const re = /<img[^>]+src=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const src = match[1]?.trim();
    if (!src || src.startsWith("data:") || src.length < 8) continue;
    try {
      return new URL(src, pageUrl).href;
    } catch {
      continue;
    }
  }
  return undefined;
}

function collectImageSrcs(html: string, pageUrl: string): string[] {
  const out: string[] = [];
  const re = /<img[^>]+src=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const src = match[1]?.trim();
    if (!src || src.startsWith("data:") || src.length < 8) continue;
    try {
      const abs = new URL(src, pageUrl).href;
      if (!out.includes(abs)) out.push(abs);
    } catch {
      continue;
    }
  }
  return out;
}

export function extractHeadings(markdown: string): string[] {
  return markdown
    .split("\n")
    .filter((l) => /^#{1,3}\s+/.test(l))
    .slice(0, 20)
    .map((l) => l.replace(/^#{1,3}\s+/, "").trim());
}

export function extractLinkCount(markdown: string): number {
  return (markdown.match(/\[[^\]]+\]\([^)]+\)/g) ?? []).length;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
