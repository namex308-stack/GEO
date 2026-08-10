// Quick test to identify offending URLs
import { MARKETING_PLANS } from "./src/lib/billing/plans.ts";
import { translate } from "./src/lib/locale/t.ts";
import { ROUTES } from "./src/lib/routes.ts";
import { absoluteUrl, getSiteUrl } from "./src/lib/site-url.ts";
import { HOME_FAQ_KEYS } from "./src/lib/seo/faq-keys.ts";

process.env.NEXT_PUBLIC_APP_URL = "https://convaudit.example";

const SCHEMA_CONTEXT = "https://schema.org";
const ORG_FRAGMENT = "#organization";
const WEBSITE_FRAGMENT = "#website";

function organizationSchemaId(base = getSiteUrl()) {
  return `${base}${ORG_FRAGMENT}`;
}

function websiteSchemaId(base = getSiteUrl()) {
  return `${base}${WEBSITE_FRAGMENT}`;
}

const SOFTWARE_DESCRIPTION =
  "منصة تحليل تجارة إلكترونية بالذكاء الاصطناعي تحلل أي متجر أو صفحة منتج وتقيّمه في التحويل، SEO، الظهور في محركات الذكاء الاصطناعي (GEO) والثقة — مع إصلاحات جاهزة للنشر.";

function organizationNode(base) {
  return {
    "@type": "Organization",
    "@id": organizationSchemaId(base),
    name: "ConvAudit",
    url: base,
    logo: absoluteUrl("/icon.svg"),
    description: SOFTWARE_DESCRIPTION,
  };
}

function webSiteNode(base) {
  return {
    "@type": "WebSite",
    "@id": websiteSchemaId(base),
    name: "ConvAudit",
    url: base,
    inLanguage: "ar",
    description: SOFTWARE_DESCRIPTION,
    publisher: { "@id": organizationSchemaId(base) },
  };
}

function softwareApplicationNode(base) {
  return {
    "@type": "SoftwareApplication",
    name: "ConvAudit",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: base,
    image: absoluteUrl("/opengraph-image"),
    description: SOFTWARE_DESCRIPTION,
    provider: { "@id": organizationSchemaId(base) },
    offers: MARKETING_PLANS.map((plan) => ({
      "@type": "Offer",
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
    "@type": "FAQPage",
    mainEntity: HOME_FAQ_KEYS.map(({ qKey, aKey }) => ({
      "@type": "Question",
      name: translate(qKey),
      acceptedAnswer: {
        "@type": "Answer",
        text: translate(aKey),
      },
    })),
  };
}

function buildHomeJsonLdGraph() {
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

function collectJsonLdUrls(node, out = []) {
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
    const obj = node;
    for (const [key, value] of Object.entries(obj)) {
      if (key === "@context") continue;
      collectJsonLdUrls(value, out);
    }
  }
  return out;
}

const graph = buildHomeJsonLdGraph();
const urls = collectJsonLdUrls(graph);

console.log("=== Collected URLs ===");
urls.forEach((url, idx) => {
  console.log(`[${idx}] ${url}`);
});

console.log("\n=== Offending URLs (not starting with https://convaudit.example) ===");
const CANONICAL = "https://convaudit.example";
urls.filter(url => !url.startsWith(CANONICAL)).forEach((url) => {
  console.log(`✗ ${url}`);
});
