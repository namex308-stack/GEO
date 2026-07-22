export interface QuickFix {
  title: string;
  description: string;
  codeSnippet: string;
  steps: string[];
}

/** Canonical issue codes → ready-to-apply fix payloads for Pro/Business users. */
export const QUICK_FIXES_DB: Record<string, QuickFix> = {
  MISSING_META_TITLE: {
    title: "Add a meta title tag",
    description: "Search engines and AI assistants use the <title> tag as the primary label for your page.",
    codeSnippet: `<head>
  <title>Your Product Name — Benefit-Driven Headline | Brand</title>
</head>`,
    steps: [
      "Open your theme or page editor (Shopify: Online Store → Themes → Edit code → theme.liquid).",
      "Locate the <title> tag inside <head>.",
      "Replace with a 30–70 character title that leads with the product benefit.",
      "Save and re-run your GEOZ audit to confirm the fix.",
    ],
  },
  MISSING_META_DESCRIPTION: {
    title: "Add a meta description",
    description: "A compelling meta description improves click-through rates from Google and AI summaries.",
    codeSnippet: `<head>
  <meta name="description" content="Shop [Product] — [Key benefit]. Free shipping, easy returns. Order today.">
</head>`,
    steps: [
      "In your page or product SEO settings, find the Meta description field.",
      "Write 120–160 characters focused on benefits, not features.",
      "Include a soft CTA (e.g. 'Shop now', 'Order today').",
      "Publish and verify in GEOZ.",
    ],
  },
  MISSING_H1: {
    title: "Add a single H1 heading",
    description: "Every product page needs exactly one H1 that states what you're selling.",
    codeSnippet: `<h1>Premium Wireless Earbuds — 40hr Battery, Studio Sound</h1>`,
    steps: [
      "Ensure only one <h1> exists on the product page.",
      "Make the H1 benefit-led and match your meta title intent.",
      "Remove duplicate H1s from hidden sections or widgets.",
    ],
  },
  SLOW_IMAGES: {
    title: "Optimize and lazy-load images",
    description: "Large unoptimized images slow page load and hurt conversion on mobile.",
    codeSnippet: `<img
  src="product-hero.webp"
  alt="Wireless earbuds in charging case"
  width="800"
  height="800"
  loading="lazy"
  decoding="async"
/>`,
    steps: [
      "Convert hero images to WebP or AVIF (target < 150 KB).",
      "Add width/height attributes to prevent layout shift.",
      "Enable lazy loading for below-the-fold images.",
      "Use your CDN or platform image optimizer (Shopify: use ?width= params).",
    ],
  },
  MISSING_IMAGE_ALT: {
    title: "Add descriptive alt text to images",
    description: "Alt text improves accessibility, SEO, and AI understanding of your product visuals.",
    codeSnippet: `<img src="product.jpg" alt="Black wireless earbuds with charging case on white background" />`,
    steps: [
      "Audit all product images for empty or generic alt attributes.",
      "Describe what the image shows plus the product context.",
      "Avoid keyword stuffing — write for humans and screen readers.",
    ],
  },
  MISSING_OG_TAGS: {
    title: "Add Open Graph tags for social sharing",
    description: "OG tags control how your product appears when shared on social platforms.",
    codeSnippet: `<meta property="og:title" content="Premium Wireless Earbuds" />
<meta property="og:description" content="40-hour battery. Studio-quality sound." />
<meta property="og:image" content="https://yoursite.com/og-product.jpg" />
<meta property="og:url" content="https://yoursite.com/products/earbuds" />`,
    steps: [
      "Add og:title, og:description, og:image, and og:url in <head>.",
      "Use a 1200×630px image for og:image.",
      "Test with Facebook Sharing Debugger or LinkedIn Post Inspector.",
    ],
  },
  MISSING_CANONICAL: {
    title: "Set a canonical URL",
    description: "Canonical tags prevent duplicate-content penalties when the same product has multiple URLs.",
    codeSnippet: `<link rel="canonical" href="https://yoursite.com/products/wireless-earbuds" />`,
    steps: [
      "Add a <link rel=\"canonical\"> pointing to the preferred product URL.",
      "Ensure query parameters (utm_, sort) don't create competing canonicals.",
    ],
  },
  WEAK_CTA: {
    title: "Strengthen your call-to-action",
    description: "A low-contrast or buried CTA costs you sales — make the primary action unmistakable.",
    codeSnippet: `<button class="cta-primary" type="button">
  Add to Cart — Free Shipping Today
</button>

<style>
  .cta-primary {
    background: #FF6600;
    color: #fff;
    font-weight: 700;
    padding: 14px 28px;
    border-radius: 8px;
    width: 100%;
    max-width: 400px;
  }
</style>`,
    steps: [
      "Place the primary CTA above the fold on mobile.",
      "Use high-contrast colors (brand orange on white/dark).",
      "Add urgency or value (free shipping, limited stock) in button copy.",
    ],
  },
  MISSING_FAQ_SCHEMA: {
    title: "Add FAQ structured data",
    description: "FAQ schema helps AI engines cite your product when answering shopper questions.",
    codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "How long does the battery last?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "Up to 40 hours with the charging case."
    }
  }]
}
</script>`,
    steps: [
      "List 3–5 real customer questions on the product page.",
      "Add FAQPage JSON-LD in <head> or before </body>.",
      "Validate with Google Rich Results Test.",
    ],
  },
  MISSING_PRODUCT_SCHEMA: {
    title: "Add Product JSON-LD schema",
    description: "Product schema gives Google and AI assistants structured price, availability, and review data.",
    codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Premium Wireless Earbuds",
  "description": "Studio-quality sound with 40-hour battery.",
  "image": "https://yoursite.com/product.jpg",
  "offers": {
    "@type": "Offer",
    "price": "89.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}
</script>`,
    steps: [
      "Include name, description, image, and Offer with price + availability.",
      "Match schema values to visible on-page content.",
      "Re-test with Rich Results Test after publishing.",
    ],
  },
  NO_HTTPS: {
    title: "Enable HTTPS site-wide",
    description: "Browsers flag HTTP stores as insecure — shoppers and search engines distrust them.",
    codeSnippet: `# .htaccess redirect (Apache)
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]`,
    steps: [
      "Install an SSL certificate (most hosts provide free Let's Encrypt).",
      "Force HTTPS redirects for all pages.",
      "Update internal links and sitemap to https:// URLs.",
    ],
  },
  MISSING_PRIVACY_POLICY: {
    title: "Add a privacy policy page",
    description: "A visible privacy policy is required for trust, ad platforms, and payment processors.",
    codeSnippet: `<footer>
  <a href="/pages/privacy-policy">Privacy Policy</a>
  <a href="/pages/terms-of-service">Terms of Service</a>
</footer>`,
    steps: [
      "Create a /privacy-policy page covering data collection and cookies.",
      "Link it in the site footer on every page.",
      "Keep it updated when you add analytics or email capture.",
    ],
  },
  MISSING_REVIEWS: {
    title: "Display customer reviews",
    description: "Social proof near the buy button is one of the highest-impact conversion levers.",
    codeSnippet: `<div class="reviews-widget" data-product-id="12345">
  <!-- Shopify: use a reviews app (Judge.me, Loox, etc.) -->
  <div itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
    <span itemprop="ratingValue">4.8</span> / 5
    (<span itemprop="reviewCount">247</span> reviews)
  </div>
</div>`,
    steps: [
      "Install a reviews app compatible with your platform.",
      "Show star rating and review count above the fold.",
      "Enable review schema for rich snippets.",
    ],
  },
  THIN_CONTENT: {
    title: "Expand product description depth",
    description: "Thin descriptions fail both SEO and AI readability — aim for benefit-led depth.",
    codeSnippet: `<section class="product-description">
  <h2>Why customers choose this</h2>
  <ul>
    <li><strong>40-hour battery</strong> — a full week without charging</li>
    <li><strong>Studio sound</strong> — custom-tuned drivers</li>
    <li><strong>IPX5 waterproof</strong> — gym and rain ready</li>
  </ul>
</section>`,
    steps: [
      "Replace feature lists with benefit statements.",
      "Add 150+ words of unique copy per product.",
      "Include use cases, specs table, and care instructions.",
    ],
  },
};

/** Maps engine rule IDs (and recommendation id suffixes) to canonical issue codes. */
export const RULE_TO_ISSUE_CODE: Record<string, string> = {
  "seo-title-len": "MISSING_META_TITLE",
  "seo-desc-len": "MISSING_META_DESCRIPTION",
  "seo-h1": "MISSING_H1",
  "seo-img-alt": "MISSING_IMAGE_ALT",
  "seo-og": "MISSING_OG_TAGS",
  "seo-canonical": "MISSING_CANONICAL",
  "cro-cta": "WEAK_CTA",
  "cro-images": "SLOW_IMAGES",
  "geo-faq": "MISSING_FAQ_SCHEMA",
  "geo-schema": "MISSING_PRODUCT_SCHEMA",
  "geo-product-schema": "MISSING_PRODUCT_SCHEMA",
  "trust-https": "NO_HTTPS",
  "trust-privacy": "MISSING_PRIVACY_POLICY",
  "trust-reviews": "MISSING_REVIEWS",
  "content-depth": "THIN_CONTENT",
  "perf-page-weight": "SLOW_IMAGES",
};

/** Keyword fallbacks when rule id is not present (e.g. Gemini-generated recs). */
const PROBLEM_KEYWORDS: [RegExp, string][] = [
  [/meta\s*title|title\s*tag|seo\s*title/i, "MISSING_META_TITLE"],
  [/meta\s*description/i, "MISSING_META_DESCRIPTION"],
  [/\bh1\b|heading/i, "MISSING_H1"],
  [/image|alt\s*text|lazy|webp|optimi[sz]/i, "SLOW_IMAGES"],
  [/open\s*graph|og\s*tag|social\s*share/i, "MISSING_OG_TAGS"],
  [/canonical/i, "MISSING_CANONICAL"],
  [/cta|call[\s-]to[\s-]action|button/i, "WEAK_CTA"],
  [/faq|structured\s*data|schema|json-ld/i, "MISSING_FAQ_SCHEMA"],
  [/product\s*schema/i, "MISSING_PRODUCT_SCHEMA"],
  [/https|ssl|secure/i, "NO_HTTPS"],
  [/privacy/i, "MISSING_PRIVACY_POLICY"],
  [/review|rating|social\s*proof/i, "MISSING_REVIEWS"],
  [/description|content\s*depth|thin/i, "THIN_CONTENT"],
];

export function resolveIssueCode(issueId: string, problem?: string): string | null {
  for (const segment of issueId.split("-").length > 2 ? [issueId.split("-").slice(1).join("-")] : [issueId]) {
    if (RULE_TO_ISSUE_CODE[segment]) return RULE_TO_ISSUE_CODE[segment];
  }

  const rulePart = issueId.includes("-") ? issueId.split("-").slice(1).join("-") : issueId;
  if (RULE_TO_ISSUE_CODE[rulePart]) return RULE_TO_ISSUE_CODE[rulePart];

  const haystack = `${issueId} ${problem ?? ""}`;
  for (const [pattern, code] of PROBLEM_KEYWORDS) {
    if (pattern.test(haystack)) return code;
  }

  return null;
}

export function lookupQuickFix(issueCode: string): QuickFix | null {
  return QUICK_FIXES_DB[issueCode] ?? null;
}
