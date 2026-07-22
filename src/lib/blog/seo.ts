import type { Metadata } from "next";
import { BRAND_NAME, BRAND_URL } from "@/lib/brand";

export type BlogFaqItem = {
  question: string;
  answer: string;
};

export type BlogSeoEntry = {
  /** Optimized <title> for search engines (50–60 chars target) */
  metaTitle: string;
  /** Meta description with primary + long-tail keywords (150–160 chars) */
  metaDescription: string;
  /** Short-tail and long-tail keywords for meta keywords + content targeting */
  keywords: readonly string[];
  /** People Also Ask / AI tool search questions with answers */
  faq: readonly BlogFaqItem[];
  /** ISO 8601 publish date */
  publishedAt: string;
  /** ISO 8601 last modified */
  modifiedAt: string;
  /** Cover image path under /public */
  coverImage: string;
  coverImageAlt: string;
  /** Author for Article schema */
  author: string;
};

const SEO: Record<string, BlogSeoEntry> = {
  "what-is-geo": {
    metaTitle: "What Is GEO? Generative Engine Optimization Guide 2026",
    metaDescription:
      "Learn what Generative Engine Optimization (GEO) is, why AI search matters for e-commerce, and 5 steps to get your products cited by ChatGPT, Perplexity & Gemini.",
    keywords: [
      "GEO",
      "generative engine optimization",
      "AI search optimization",
      "ChatGPT product visibility",
      "e-commerce AI discovery",
      "how to optimize for AI search",
      "GEO vs SEO",
      "AI assistant product recommendations",
    ],
    faq: [
      {
        question: "What is Generative Engine Optimization (GEO)?",
        answer:
          "GEO is the practice of optimizing web pages so AI assistants like ChatGPT, Perplexity, and Google AI Overviews can read, understand, and cite your products in their answers.",
      },
      {
        question: "Why does GEO matter for e-commerce stores?",
        answer:
          "Up to 27% of product searchers now use AI assistants for recommendations. If your product pages aren't machine-readable, you miss a growing discovery channel entirely.",
      },
      {
        question: "How is GEO different from traditional SEO?",
        answer:
          "SEO targets ranked links on Google and Bing. GEO targets cited answers in AI tools. SEO focuses on keywords and backlinks; GEO focuses on clarity, structured facts, and FAQ content.",
      },
      {
        question: "Which AI tools does GEO optimize for?",
        answer:
          "GEO helps visibility across ChatGPT, Perplexity, Google Gemini, Google AI Overviews, Claude, and other LLM-powered search and shopping assistants.",
      },
      {
        question: "How do I measure my GEO score?",
        answer:
          "Use an AI audit tool like convaudit to scan product URLs and get a GEO visibility score with actionable fixes for schema, FAQs, and content clarity.",
      },
    ],
    publishedAt: "2026-07-01T08:00:00Z",
    modifiedAt: "2026-07-10T12:00:00Z",
    coverImage: "/blog/what-is-geo.svg",
    coverImageAlt: "Generative Engine Optimization (GEO) concept — AI search visibility for e-commerce",
    author: "convaudit Team",
  },

  "geo-vs-seo": {
    metaTitle: "GEO vs SEO: Key Differences & Why You Need Both (2026)",
    metaDescription:
      "Compare GEO vs SEO for e-commerce: goals, tactics, and when you need both. Learn how AI search and Google rankings work together for product visibility.",
    keywords: [
      "GEO vs SEO",
      "generative engine optimization vs SEO",
      "AI search vs Google SEO",
      "e-commerce SEO strategy",
      "ChatGPT SEO",
      "LLM optimization",
      "dual SEO GEO strategy",
      "product page AI visibility",
    ],
    faq: [
      {
        question: "What is the difference between GEO and SEO?",
        answer:
          "SEO optimizes for search engine rankings (links on Google/Bing). GEO optimizes for AI-generated answers (citations in ChatGPT, Perplexity, Gemini). Both aim for visibility but through different surfaces.",
      },
      {
        question: "Do I need both SEO and GEO for my online store?",
        answer:
          "Yes. SEO drives organic traffic from traditional search. GEO ensures AI assistants recommend your products. Strong SEO foundations (schema, headings, speed) also help GEO.",
      },
      {
        question: "Can a page rank #1 on Google but be invisible to AI?",
        answer:
          "Yes. If product facts are buried in images, tabs, or vague marketing copy, AI assistants cannot parse them even when Google ranks the page highly.",
      },
      {
        question: "Does schema markup help both SEO and GEO?",
        answer:
          "Yes. Product schema, FAQ schema, and clean HTML structure help search crawlers and language models extract the same facts accurately.",
      },
    ],
    publishedAt: "2026-06-28T08:00:00Z",
    modifiedAt: "2026-07-10T12:00:00Z",
    coverImage: "/blog/geo-vs-seo.svg",
    coverImageAlt: "GEO vs SEO comparison chart for e-commerce product visibility",
    author: "convaudit Team",
  },

  "optimize-store-for-chatgpt": {
    metaTitle: "How to Optimize Your Store for ChatGPT & AI Shopping (2026)",
    metaDescription:
      "Step-by-step guide to make your e-commerce store readable and recommendable by ChatGPT. Add specs, FAQs, schema, and comparison facts AI can cite.",
    keywords: [
      "optimize store for ChatGPT",
      "ChatGPT e-commerce",
      "AI shopping optimization",
      "ChatGPT product recommendations",
      "make products AI readable",
      "ChatGPT SEO for stores",
      "LLM product visibility",
      "AI assistant shopping",
    ],
    faq: [
      {
        question: "How does ChatGPT discover and recommend products?",
        answer:
          "ChatGPT synthesizes answers from parseable page content: titles, bullet specs, FAQs, review summaries, and structured data. Image-only or opaque pages get skipped.",
      },
      {
        question: "What content should I add for ChatGPT visibility?",
        answer:
          "Lead with who the product is for, list key specs in plain text, answer top buyer questions on-page, and include price, sizing, materials, and return policy in visible HTML.",
      },
      {
        question: "Does ChatGPT use schema markup?",
        answer:
          "JSON-LD Product and FAQ schema helps models extract consistent facts. Pair schema with an FAQ block that mirrors real customer questions.",
      },
      {
        question: "How do I test if ChatGPT can recommend my products?",
        answer:
          "Run a GEO audit on your product URLs, fix low-trust signals, update content, and re-test. AI visibility is iterative — not a one-time fix.",
      },
    ],
    publishedAt: "2026-06-25T08:00:00Z",
    modifiedAt: "2026-07-10T12:00:00Z",
    coverImage: "/blog/optimize-store-for-chatgpt.svg",
    coverImageAlt: "E-commerce store optimized for ChatGPT and AI shopping assistants",
    author: "convaudit Team",
  },

  "product-page-seo-checklist": {
    metaTitle: "Product Page SEO Checklist: 15-Point Guide for E-commerce",
    metaDescription:
      "Complete product page SEO checklist: title tags, meta descriptions, H1, schema, images, internal links, Core Web Vitals, and post-launch checks for higher rankings.",
    keywords: [
      "product page SEO checklist",
      "e-commerce SEO checklist",
      "product page optimization",
      "meta tags product page",
      "product schema markup",
      "on-page SEO e-commerce",
      "product page title tag",
      "SEO audit product page",
    ],
    faq: [
      {
        question: "What should every product page include for SEO?",
        answer:
          "A unique title tag (50–60 chars), meta description with primary keyword, one H1 matching the product name, descriptive alt text, canonical URL, and Product schema.",
      },
      {
        question: "How long should a product page meta description be?",
        answer:
          "Aim for 150–160 characters. Include the primary keyword, a benefit, and a call to action. Each product page needs a unique description — no duplicates.",
      },
      {
        question: "What is Product schema and do I need it?",
        answer:
          "Product schema (JSON-LD) tells search engines your price, availability, SKU, and ratings. It enables rich results and helps AI assistants extract accurate product facts.",
      },
      {
        question: "How do I check product page SEO after launch?",
        answer:
          "Submit URLs in Google Search Console, verify rich results, add internal links from category pages, and monitor rankings plus AI visibility monthly.",
      },
    ],
    publishedAt: "2026-06-22T08:00:00Z",
    modifiedAt: "2026-07-10T12:00:00Z",
    coverImage: "/blog/product-page-seo-checklist.svg",
    coverImageAlt: "Product page SEO checklist with title tags, schema, and meta optimization",
    author: "convaudit Team",
  },

  "shopify-seo-guide": {
    metaTitle: "Shopify SEO Guide 2026: Rank Higher & Get AI Visibility",
    metaDescription:
      "Complete Shopify SEO guide: collections, product templates, schema, speed optimization, Arabic/multi-market stores, and GEO for AI shopping assistants.",
    keywords: [
      "Shopify SEO",
      "Shopify SEO guide",
      "Shopify product page SEO",
      "Shopify collections SEO",
      "Shopify schema markup",
      "Shopify speed optimization",
      "Shopify Arabic SEO",
      "Shopify GEO optimization",
    ],
    faq: [
      {
        question: "How do I improve SEO on Shopify?",
        answer:
          "Optimize collection descriptions (150+ words), customize title tags, add FAQ sections to product templates, compress images, audit apps for speed, and enable JSON-LD schema.",
      },
      {
        question: "Does Shopify have built-in SEO features?",
        answer:
          "Yes — clean URLs, automatic sitemaps, and mobile themes. But merchants still control titles, collections, meta descriptions, and app bloat that can hurt performance.",
      },
      {
        question: "How do I add FAQ schema on Shopify?",
        answer:
          "Use SEO apps or theme code to add FAQ sections in product templates. Pair visible FAQ content with JSON-LD FAQ schema for search and AI visibility.",
      },
      {
        question: "How do I optimize a Shopify store for Arabic SEO?",
        answer:
          "Use Shopify Markets or translation apps with hreflang. Keep Arabic product copy in HTML text — not image banners — so search engines and AI can read it.",
      },
    ],
    publishedAt: "2026-06-18T08:00:00Z",
    modifiedAt: "2026-07-10T12:00:00Z",
    coverImage: "/blog/shopify-seo-guide.svg",
    coverImageAlt: "Shopify SEO guide — collections, schema, and AI visibility optimization",
    author: "convaudit Team",
  },

  "woocommerce-seo-guide": {
    metaTitle: "WooCommerce SEO Guide 2026: WordPress Store Optimization",
    metaDescription:
      "WooCommerce SEO from setup to schema: permalinks, Yoast/Rank Math, product pages, reviews, performance on shared hosting, and GEO for AI visibility.",
    keywords: [
      "WooCommerce SEO",
      "WooCommerce SEO guide",
      "WordPress e-commerce SEO",
      "WooCommerce product schema",
      "WooCommerce SEO plugin",
      "WooCommerce performance SEO",
      "WooCommerce Arabic SEO",
      "WooCommerce GEO optimization",
    ],
    faq: [
      {
        question: "What is the best SEO setup for WooCommerce?",
        answer:
          "Set permalinks to /%postname%/, install Rank Math or Yoast, enable XML sitemaps, configure Product schema, and add unique descriptions to every product and category page.",
      },
      {
        question: "How do I add product schema in WooCommerce?",
        answer:
          "Enable product schema in your SEO plugin (Rank Math or Yoast). Sync real reviews from Judge.me or Trustpilot so aggregateRating appears in search results.",
      },
      {
        question: "Why is my WooCommerce store slow and how does it affect SEO?",
        answer:
          "Shared hosting, heavy page builders, and missing caching hurt TTFB. Use object caching, a CDN, and limit page builders on product templates — especially critical in MENA mobile markets.",
      },
      {
        question: "How do I optimize WooCommerce for AI search (GEO)?",
        answer:
          "Add FAQ blocks per product, visible specs tables, Arabic/English parity for cross-border sales, and audit with a GEO tool to score AI readability.",
      },
    ],
    publishedAt: "2026-06-15T08:00:00Z",
    modifiedAt: "2026-07-10T12:00:00Z",
    coverImage: "/blog/woocommerce-seo-guide.svg",
    coverImageAlt: "WooCommerce SEO guide — WordPress store optimization and schema setup",
    author: "convaudit Team",
  },

  "salla-seo-guide": {
    metaTitle: "Salla SEO Guide 2026: Rank Your Gulf E-commerce Store",
    metaDescription:
      "SEO best practices for Salla stores in Saudi Arabia and the Gulf: Arabic keywords, store settings, trust pages, Tamara/Tabby badges, and AI visibility.",
    keywords: [
      "Salla SEO",
      "Salla SEO guide",
      "Salla store optimization",
      "Arabic e-commerce SEO",
      "Saudi e-commerce SEO",
      "Salla Google ranking",
      "Gulf e-commerce SEO",
      "Salla GEO AI visibility",
    ],
    faq: [
      {
        question: "How do I improve SEO for my Salla store?",
        answer:
          "Connect a custom domain, verify Google Search Console, fill meta titles/descriptions for homepage and categories, compress product images, and add trust pages for shipping and returns.",
      },
      {
        question: "What Arabic keywords should Salla stores target?",
        answer:
          "Target how Gulf shoppers search: dialect + product type + benefit (e.g. 'عباية كريب اسود مقاسات كبيرة'). Use these phrases in titles and the first paragraph.",
      },
      {
        question: "Does Salla support schema markup for products?",
        answer:
          "Add structured FAQs on best sellers, keep specs in text not images, and link policies in the footer. Use external audit tools to verify AI readability.",
      },
      {
        question: "How do I get AI visibility for my Salla store?",
        answer:
          "Structure product pages with positioning statements, FAQ sections, and plain-text specs. Run monthly GEO audits on top SKUs to track AI citation scores.",
      },
    ],
    publishedAt: "2026-06-12T08:00:00Z",
    modifiedAt: "2026-07-10T12:00:00Z",
    coverImage: "/blog/salla-seo-guide.svg",
    coverImageAlt: "Salla SEO guide for Saudi and Gulf e-commerce stores",
    author: "convaudit Team",
  },

  "zid-seo-guide": {
    metaTitle: "Zid SEO Guide 2026: Grow Organic Traffic in Saudi & GCC",
    metaDescription:
      "Zid store SEO guide: Arabic keyword strategy, on-page best practices, technical hygiene, size guides, and GEO optimization for AI shopping in Saudi Arabia.",
    keywords: [
      "Zid SEO",
      "Zid SEO guide",
      "Zid store optimization",
      "Saudi e-commerce SEO",
      "Zid Arabic SEO",
      "GCC e-commerce ranking",
      "Zid product page SEO",
      "Zid GEO optimization",
    ],
    faq: [
      {
        question: "How do I improve SEO on a Zid store?",
        answer:
          "Use one primary keyword per product page, write unique Arabic meta descriptions, add alt text in Arabic, and build internal links from blog or lookbook content to products.",
      },
      {
        question: "What technical SEO steps does a Zid store need?",
        answer:
          "Connect a custom domain, enable SSL, submit sitemap to Google, fix broken links after theme changes, and avoid duplicate product URLs from variants.",
      },
      {
        question: "How do I compete in crowded Saudi e-commerce niches on Zid?",
        answer:
          "Differentiate with detailed Arabic descriptions, size guides, localized landing pages, comparison tables, and answers to 'مناسب لـ' (who is it for) questions in copy.",
      },
      {
        question: "Can I track AI visibility for my Zid catalog?",
        answer:
          "Yes. Use convaudit to scan product URLs and track GEO visibility scores over time as you add FAQs, schema, and structured content.",
      },
    ],
    publishedAt: "2026-06-10T08:00:00Z",
    modifiedAt: "2026-07-10T12:00:00Z",
    coverImage: "/blog/zid-seo-guide.svg",
    coverImageAlt: "Zid SEO guide — organic traffic growth for Saudi and GCC stores",
    author: "convaudit Team",
  },

  "ai-improve-product-descriptions": {
    metaTitle: "AI Product Descriptions: Write Better Copy for SEO & GEO",
    metaDescription:
      "Use AI to write product descriptions that rank on Google and get cited by ChatGPT. Workflow, prompts, quality control, and scaling across your catalog.",
    keywords: [
      "AI product descriptions",
      "AI copywriting e-commerce",
      "ChatGPT product descriptions",
      "AI SEO content",
      "product description generator",
      "AI content for e-commerce",
      "GEO product copy",
      "AI product page optimization",
    ],
    faq: [
      {
        question: "Can AI write good product descriptions for e-commerce?",
        answer:
          "Yes, when you feed the model product specs, audience, objections, and brand guidelines. Always human-edit the opening line, CTA, and fact-check prices and claims.",
      },
      {
        question: "How do I prompt AI for SEO-friendly product descriptions?",
        answer:
          "Ask for a positioning sentence, spec bullets, FAQ pair, and meta description in one prompt. Plain language ranks on Google and gets cited by AI assistants.",
      },
      {
        question: "What are the risks of using AI for product copy?",
        answer:
          "Generic output, hallucinated certifications, and wrong prices. Never publish AI copy without merchant review. A/B test on high-traffic SKUs first.",
      },
      {
        question: "How do I scale AI descriptions across a large catalog?",
        answer:
          "Prioritize top 20% revenue SKUs, use templates for variants, and re-audit quarterly so descriptions stay aligned with inventory and policies.",
      },
    ],
    publishedAt: "2026-06-08T08:00:00Z",
    modifiedAt: "2026-07-10T12:00:00Z",
    coverImage: "/blog/ai-improve-product-descriptions.svg",
    coverImageAlt: "AI-powered product description writing for SEO and GEO visibility",
    author: "convaudit Team",
  },

  "ai-visibility-ecommerce-guide": {
    metaTitle: "AI Visibility for E-commerce: Complete GEO Playbook (2026)",
    metaDescription:
      "End-to-end guide to AI visibility for online stores: clarity, structure, trust, freshness, catalog rollout, monitoring, and GEO scoring with convaudit.",
    keywords: [
      "AI visibility e-commerce",
      "GEO playbook",
      "AI search e-commerce",
      "product AI discoverability",
      "ChatGPT shopping visibility",
      "Perplexity product citations",
      "e-commerce GEO strategy",
      "AI discovery funnel",
    ],
    faq: [
      {
        question: "What is AI visibility for e-commerce?",
        answer:
          "AI visibility is how often and accurately AI assistants like ChatGPT, Perplexity, and Gemini cite and recommend your products when shoppers ask for suggestions.",
      },
      {
        question: "What are the four pillars of AI visibility?",
        answer:
          "Clarity (who/what/why), structure (headings, lists, schema), trust (reviews, policies, contact), and freshness (updated specs and stock). Weakness in any pillar lowers your GEO score.",
      },
      {
        question: "How do I roll out GEO optimization across my catalog?",
        answer:
          "Start with hero products, apply a standard template (positioning + specs + FAQ + schema), batch-update long-tail SKUs, and use full-site crawl audits for gaps.",
      },
      {
        question: "How do I monitor AI visibility over time?",
        answer:
          "Track GEO scores monthly, set alerts when competitors improve, and re-run audits after theme or app changes that might hide text from crawlers.",
      },
      {
        question: "What is the fastest way to improve AI visibility today?",
        answer:
          "Run a free convaudit scan on your top product URL, fix the top five recommendations, and expand to full-site crawl. AI visibility compounds like SEO — start early.",
      },
    ],
    publishedAt: "2026-06-05T08:00:00Z",
    modifiedAt: "2026-07-10T12:00:00Z",
    coverImage: "/blog/ai-visibility-ecommerce-guide.svg",
    coverImageAlt: "Complete AI visibility playbook for e-commerce stores and GEO optimization",
    author: "convaudit Team",
  },
};

export function getBlogSeo(slug: string): BlogSeoEntry | undefined {
  return SEO[slug];
}

export function buildBlogPostMetadata(slug: string, displayTitle: string): Metadata {
  const seo = getBlogSeo(slug);
  if (!seo) {
    return { title: "Article Not Found" };
  }

  const url = `${BRAND_URL}/blog/${slug}`;
  const imageUrl = `${BRAND_URL}${seo.coverImage}`;

  return {
    title: seo.metaTitle,
    description: seo.metaDescription,
    keywords: [...seo.keywords],
    authors: [{ name: seo.author }],
    creator: BRAND_NAME,
    publisher: BRAND_NAME,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDescription,
      url,
      siteName: BRAND_NAME,
      type: "article",
      publishedTime: seo.publishedAt,
      modifiedTime: seo.modifiedAt,
      authors: [seo.author],
      tags: [...seo.keywords.slice(0, 5)],
      locale: "en_US",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: seo.coverImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.metaTitle,
      description: seo.metaDescription,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export function buildBlogListingMetadata(): Metadata {
  return {
    title: "E-commerce SEO & GEO Blog — Guides for Shopify, Salla, Zid & AI Visibility",
    description:
      "Expert guides on e-commerce SEO, Generative Engine Optimization (GEO), ChatGPT visibility, product page checklists, and platform-specific tips for Shopify, WooCommerce, Salla & Zid.",
    keywords: [
      "e-commerce SEO blog",
      "GEO guides",
      "AI visibility tips",
      "Shopify SEO blog",
      "Salla SEO guide",
      "product page optimization",
      "ChatGPT e-commerce",
    ],
    alternates: { canonical: "/blog" },
    openGraph: {
      title: "E-commerce SEO & GEO Blog | convaudit",
      description:
        "Expert guides on SEO, GEO, AI visibility, and platform optimization for online stores.",
      url: `${BRAND_URL}/blog`,
      siteName: BRAND_NAME,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: "E-commerce SEO & GEO Blog | convaudit",
      description: "Expert guides on SEO, GEO, and AI visibility for e-commerce stores.",
    },
  };
}

/** JSON-LD Article + FAQPage schema for rich results and AI citation */
export function buildBlogJsonLd(slug: string, headline: string) {
  const seo = getBlogSeo(slug);
  if (!seo) return null;

  const url = `${BRAND_URL}/blog/${slug}`;
  const imageUrl = `${BRAND_URL}${seo.coverImage}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline,
        description: seo.metaDescription,
        image: imageUrl,
        datePublished: seo.publishedAt,
        dateModified: seo.modifiedAt,
        author: { "@type": "Organization", name: seo.author, url: BRAND_URL },
        publisher: {
          "@type": "Organization",
          name: BRAND_NAME,
          url: BRAND_URL,
          logo: { "@type": "ImageObject", url: `${BRAND_URL}/logo.svg` },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        keywords: seo.keywords.join(", "),
        articleSection: "E-commerce SEO & GEO",
        inLanguage: ["en", "ar"],
      },
      {
        "@type": "FAQPage",
        mainEntity: seo.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BRAND_URL },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${BRAND_URL}/blog` },
          { "@type": "ListItem", position: 3, name: headline, item: url },
        ],
      },
    ],
  };
}
