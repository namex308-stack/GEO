import { MARKETING_PLANS } from "@/lib/billing/plans";
import { translate } from "@/lib/locale/t";
import { ROUTES } from "@/lib/routes";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";
import { HOME_FAQ_KEYS } from "@/lib/seo/faq-keys";
import { isCalendarDateOnOrBeforeToday } from "@/lib/seo/dates";

export { HOME_FAQ_KEYS } from "@/lib/seo/faq-keys";

const SCHEMA_CONTEXT = "https://schema.org";
const ORG_FRAGMENT = "#organization";
const WEBSITE_FRAGMENT = "#website";

/** Stable `@id` for the site Organization (used in `@graph` to avoid duplicate nodes). */
export function organizationSchemaId(base = getSiteUrl()): string {
  return `${base}${ORG_FRAGMENT}`;
}

function websiteSchemaId(base = getSiteUrl()): string {
  return `${base}${WEBSITE_FRAGMENT}`;
}

/**
 * Product description for schema — factual, aligned with homepage pillars.
 * No fixed SLAs or invented statistics.
 */
const SOFTWARE_DESCRIPTION =
  "منصة تحليل تجارة إلكترونية بالذكاء الاصطناعي تحلل أي متجر أو صفحة منتج وتقيّمه في التحويل، SEO، الظهور في م[...]";

function organizationNode(base: string) {
  return {
    "@type": "Organization" as const,
    "@id": organizationSchemaId(base),
    name: "ConvAudit",
    url: base,
    logo: absoluteUrl("/icon.svg"),
    description: SOFTWARE_DESCRIPTION,
  };
}

function webSiteNode(base: string) {
  return {
    "@type": "WebSite" as const,
    "@id": websiteSchemaId(base),
    name: "ConvAudit",
    url: base,
    inLanguage: "ar",
    description: SOFTWARE_DESCRIPTION,
    publisher: { "@id": organizationSchemaId(base) },
  };
}

function softwareApplicationNode(base: string) {
  return {
    "@type": "SoftwareApplication" as const,
    name: "ConvAudit",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: base,
    image: absoluteUrl("/opengraph-image"),
    description: SOFTWARE_DESCRIPTION,
    provider: { "@id": organizationSchemaId(base) },
    offers: MARKETING_PLANS.map((plan) => ({
      "@type": "Offer" as const,
      name: plan.name,
      price: String(plan.monthlyPrice),
      priceCurrency: "EGP",
      url: absoluteUrl(ROUTES.pricing),
    })),
    featureList: [
      "تقييم التحويل",
      "تقييم SEO",
      "تقييم الظهور في ChatGPT وPerplexity وGoogle AI",
      "تقييم الثقة",
      "مقارنة بالمنافسين",
      "مولّد ذكاء اصطناعي (عناوين، أوصاف، أسئلة شائعة، Meta، نصوص إعلانية)",
    ],
  };
}

function faqPageNode() {
  return {
    "@type": "FAQPage" as const,
    mainEntity: HOME_FAQ_KEYS.map(({ qKey, aKey }) => ({
      "@type": "Question" as const,
      name: translate(qKey),
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: translate(aKey),
      },
    })),
  };
}

/** Standalone Organization block (tests / reuse). */
export function buildOrganizationJsonLd() {
  const base = getSiteUrl();
  return {
    "@context": SCHEMA_CONTEXT,
    ...organizationNode(base),
  };
}

export function buildWebSiteJsonLd() {
  const base = getSiteUrl();
  return {
    "@context": SCHEMA_CONTEXT,
    ...webSiteNode(base),
  };
}

/**
 * Offer prices mirror `MARKETING_PLANS` / Kashier EGP amounts — never invent USD.
 */
export function buildSoftwareApplicationJsonLd() {
  const base = getSiteUrl();
  return {
    "@context": SCHEMA_CONTEXT,
    ...softwareApplicationNode(base),
  };
}

export function buildFaqPageJsonLd() {
  return {
    "@context": SCHEMA_CONTEXT,
    ...faqPageNode(),
  };
}

export function buildBlogArticleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  publishedOn?: string;
}) {
  const base = getSiteUrl();
  const url = absoluteUrl(input.path);
  const orgId = organizationSchemaId(base);

  const jsonLd: Record<string, unknown> = {
    "@context": SCHEMA_CONTEXT,
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    inLanguage: "ar",
    image: [absoluteUrl("/opengraph-image")],
    author: {
      "@type": "Organization",
      "@id": orgId,
      name: "ConvAudit",
      url: base,
    },
    publisher: {
      "@type": "Organization",
      "@id": orgId,
      name: "ConvAudit",
      url: base,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon.svg"),
      },
    },
  };

  // Emit datePublished only when the calendar date is not in the future.
  // Do not invent dateModified — we have no reliable modified timestamp.
  if (input.publishedOn && isCalendarDateOnOrBeforeToday(input.publishedOn)) {
    jsonLd.datePublished = input.publishedOn;
  }

  return jsonLd;
}

/**
 * Homepage graph — one JSON-LD script, linked entities via `@id` (no duplicate Organization nodes).
 */
export function buildHomeJsonLdGraph() {
  const base = getSiteUrl();
  return {
    "@context": SCHEMA_CONTEXT,
    "@graph": [
      organizationNode(base),
      webSiteNode(base),
      softwareApplicationNode(base),
      faqPageNode(),
    ],
  };
}

/** Collect every absolute URL string embedded in a JSON-LD object (for tests). */
export function collectJsonLdUrls(node: unknown, out: string[] = []): string[] {
  if (node === null || node === undefined) return out;
  if (typeof node === "string") {
    if (/^https?:\/\//i.test(node)) out.push(node);
    return out;
  }
  if (Array.isArray(node)) {
    for (const item of node) collectJsonLdUrls(item, out);
    return out;
  }
  if (typeof node === "object") {
    // Ignore the @context property — it's an external JSON-LD context
    // (e.g. "https://schema.org") and not a site-owned canonical URL.
    const obj = node as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if (key === "@context") continue;
      collectJsonLdUrls(value, out);
    }
  }
  return out;
}
