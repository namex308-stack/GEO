import type { AuditData, Plan, Recommendation } from "./types";

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Starter",
    price: 0,
    priceLabel: "$0",
    period: "forever",
    tagline: "Test the waters with your first audits.",
    auditsPerMonth: "3 audits / month",
    features: [
      "3 full audits per month",
      "Conversion, SEO, GEO & Trust scores",
      "Top 5 AI recommendations",
      "Single store",
      "Email support",
    ],
    cta: "Start Free",
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    priceLabel: "$29",
    period: "per month",
    tagline: "For growing stores that want to win every page.",
    auditsPerMonth: "Unlimited audits",
    features: [
      "Unlimited audits",
      "Competitor comparison",
      "AI Generator (titles, descriptions, FAQ, meta, ad copy)",
      "All 20+ recommendations per audit",
      "GEO readability for ChatGPT, Perplexity & Google AI",
      "3 stores",
      "Priority support",
    ],
    highlight: true,
    cta: "Go Pro",
  },
  {
    id: "business",
    name: "Business",
    price: 79,
    priceLabel: "$79",
    period: "per month",
    tagline: "Scale across teams, stores & markets.",
    auditsPerMonth: "Everything in Pro",
    features: [
      "Unlimited stores",
      "5 team seats included",
      "White-label PDF reports",
      "Scheduled re-audits & monitoring",
      "API access (1,000 calls/mo)",
      "Dedicated success manager",
      "Custom GEO market targeting",
    ],
    cta: "Start Business",
  },
];

export const SAMPLE_AUDIT: AuditData = {
  productUrl: "https://shop.example.com/products/argan-glow-serum",
  storeUrl: "https://shop.example.com",
  competitorUrl: "https://competitor.com/products/vitamin-c-serum",
  storeName: "ArganBloom",
  productName: "Pure Argan Glow Serum 30ml",
  overallScore: 82,
  competitorScore: 74,
  breakdown: [
    {
      pillar: "conversion",
      score: 78,
      max: 100,
      label: "Conversion",
      summary:
        "Strong price point and imagery, but the description leans on features instead of benefits and the CTA blends in.",
    },
    {
      pillar: "seo",
      score: 85,
      max: 100,
      label: "SEO",
      summary:
        "Clean meta title and H1, but missing Product schema markup and long-tail keywords for 'argan oil face serum'.",
    },
    {
      pillar: "geo",
      score: 71,
      max: 100,
      label: "GEO / AI Visibility",
      summary:
        "AI assistants can partially read the page, but lack structured Q&A and clear benefit statements to recommend you.",
    },
    {
      pillar: "trust",
      score: 88,
      max: 100,
      label: "Trust",
      summary:
        "Return policy and reviews are present. Missing a visible shipping estimate and a security badge at checkout.",
    },
  ],
  competitorBreakdown: [
    { pillar: "conversion", score: 80, max: 100, label: "Conversion", summary: "" },
    { pillar: "seo", score: 68, max: 100, label: "SEO", summary: "" },
    { pillar: "geo", score: 62, max: 100, label: "GEO / AI Visibility", summary: "" },
    { pillar: "trust", score: 86, max: 100, label: "Trust", summary: "" },
  ],
  geoReadability: {
    chatgpt: 73,
    perplexity: 69,
    googleAI: 71,
  },
  recommendations: [
    {
      id: "r1",
      pillar: "conversion",
      severity: "critical",
      impact: "high",
      effort: "quick",
      estimatedLift: "+6 to +10 pts",
      category: "Copy & messaging",
      problem:
        "The product description lists ingredients and features but never states the core benefit the shopper feels.",
      solution:
        "Rewrite the first paragraph as a benefit-led hook: 'Wake up to visibly smoother, hydrated skin in 7 nights — powered by cold-pressed Moroccan argan oil.' Lead with the outcome, then prove it.",
    },
    {
      id: "r2",
      pillar: "conversion",
      severity: "warning",
      impact: "high",
      effort: "quick",
      estimatedLift: "+3 to +5 pts",
      category: "Design & CTA",
      problem: "The 'Add to Cart' button is grey and low-contrast — it doesn't pull the eye.",
      solution:
        "Switch the primary CTA to the brand orange (#FF6600) with white text, increase size to 48px height, and add a microcopy line under it: 'Secure checkout · 30-day returns'.",
    },
    {
      id: "r3",
      pillar: "seo",
      severity: "critical",
      impact: "high",
      effort: "medium",
      estimatedLift: "+8 to +12 pts",
      category: "Technical SEO",
      problem: "No Product schema markup detected. Google can't show rich results (price, availability, reviews).",
      solution:
        "Inject JSON-LD Product schema with name, image, price, availability, aggregateRating, and brand. This unlocks price snippets in search and AI answers.",
    },
    {
      id: "r4",
      pillar: "seo",
      severity: "opportunity",
      impact: "medium",
      effort: "quick",
      estimatedLift: "+2 to +4 pts",
      category: "Content & keywords",
      problem: "You rank for 'argan serum' but miss 'argan oil for face' and 'moroccan face oil' (2,400 + 1,900 monthly searches).",
      solution:
        "Add an FAQ section answering 'Is argan oil good for your face?' and 'How to use argan oil for face?' — both are high-intent long-tail queries.",
    },
    {
      id: "r5",
      pillar: "geo",
      severity: "critical",
      impact: "high",
      effort: "quick",
      estimatedLift: "+5 to +9 pts",
      category: "AI positioning",
      problem: "ChatGPT and Perplexity can read the page but can't confidently recommend your product — there's no clear 'who is this for' statement.",
      solution:
        "Add a one-sentence positioning line near the top: 'For dry and sensitive skin types looking for a natural, fragrance-free glow serum.' AI models extract and reuse these exact sentences.",
    },
    {
      id: "r6",
      pillar: "geo",
      severity: "warning",
      impact: "medium",
      effort: "medium",
      estimatedLift: "+3 to +6 pts",
      category: "AI positioning",
      problem: "No structured FAQ that AI assistants can quote verbatim.",
      solution:
        "Add 5 Q&A pairs (usage, results timeline, suitability, side effects, comparison). Use clear question headings — AI engines prefer copying complete Q&A blocks.",
    },
    {
      id: "r7",
      pillar: "trust",
      severity: "opportunity",
      impact: "medium",
      effort: "quick",
      estimatedLift: "+2 to +3 pts",
      category: "Trust signals",
      problem: "Shipping time is buried in a policy page, not on the product page.",
      solution:
        "Add a delivery badge near the price: 'Ships in 24h · 2–4 days across the GCC & Egypt'. Visible shipping estimates reduce cart abandonment by up to 28%.",
    },
    {
      id: "r8",
      pillar: "trust",
      severity: "opportunity",
      impact: "low",
      effort: "quick",
      estimatedLift: "+1 to +2 pts",
      category: "Trust signals",
      problem: "No payment security signal at the point of purchase.",
      solution:
        "Add trusted payment logos (Visa, Mastercard, Apple Pay, PayPal) and an SSL/secure-checkout line under the CTA.",
    },
  ],
  createdAt: new Date().toISOString(),
};

export const AI_GENERATED = {
  title: "Argan Glow Serum — 7-Night Hydration Reset for Dry & Sensitive Skin | ArganBloom",
  description: `Wake up to visibly softer, deeply hydrated skin in just 7 nights.

ArganBloom's Pure Argan Glow Serum is cold-pressed from Moroccan argan kernels and blended with vitamin E — a fragrance-free formula made for dry and sensitive skin that demands real results without irritation.

**Why you'll feel the difference:**
- 100% cold-pressed argan oil — rich in omega-6 & -9
- Restores moisture barrier in 7 nights, clinically felt
- Fragrance-free, non-comedogenic, never greasy
- Ethically sourced from women-led cooperatives in Morocco

30ml · 2–3 month supply · Ships across the GCC & Egypt in 24 hours.`,
  faq: [
    {
      q: "Is argan oil good for your face?",
      a: "Yes. Cold-pressed argan oil is rich in omega-6, omega-9 and vitamin E, making it one of the gentlest oils for facial hydration. It restores the moisture barrier without clogging pores — ideal for dry and sensitive skin.",
    },
    {
      q: "How soon will I see results?",
      a: "Most users report visibly softer, more hydrated skin within 7 nights of nightly use. For full barrier repair, consistent use for 3–4 weeks is recommended.",
    },
    {
      q: "Can I use it on sensitive skin?",
      a: "Absolutely. The serum is fragrance-free, non-comedogenic and contains only argan oil and vitamin E — no essential oils, no alcohol, no synthetic fragrance.",
    },
    {
      q: "How do I use it in my routine?",
      a: "Apply 3–4 drops to clean skin at night, before moisturizer. In the morning, layer under sunscreen. A little goes a long way — one 30ml bottle lasts 2–3 months.",
    },
    {
      q: "How does it compare to vitamin C serums?",
      a: "Vitamin C brightens and protects from oxidative stress; argan oil deeply hydrates and repairs the barrier. They work beautifully together — argan at night, vitamin C in the morning.",
    },
  ],
  metaDescription:
    "Cold-pressed Moroccan argan oil serum for dry & sensitive skin. Fragrance-free, non-comedogenic. Visible hydration in 7 nights. Ships in 24h across GCC & Egypt.",
  adCopy: [
    {
      platform: "Meta / Instagram",
      headline: "Your skin's 7-night reset 🌿",
      body: "Dry, tight skin? Cold-pressed Moroccan argan oil restores your moisture barrier — fragrance-free, non-greasy, visible glow in 7 nights. Free shipping across the GCC.",
      cta: "Shop the Serum",
    },
    {
      platform: "TikTok",
      headline: "POV: you found the oil your skin actually needed",
      body: "3 drops at night. Softer skin by morning. No fragrance, no fuss — just pure Moroccan argan.",
      cta: "Get yours",
    },
    {
      platform: "Google Search",
      headline: "Argan Glow Serum — Dry & Sensitive Skin",
      body: "Cold-pressed Moroccan argan oil. Fragrance-free. Visible hydration in 7 nights. Ships 24h GCC & Egypt.",
      cta: "Order Now",
    },
  ],
};
