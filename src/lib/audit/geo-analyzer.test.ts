import { describe, expect, it } from "vitest";
import { analyzeGeo } from "@/lib/audit/geo-analyzer";
import { scoreAllGeoComponents, sumComponentScores } from "@/lib/audit/citation-score";
import { detectStructuredContent } from "@/lib/audit/structured-content";
import { applyGeoAnalysisToAudit, averagePillarScores } from "@/lib/audit/scoring";
import type { NormalizedPage } from "@/lib/db/types";
import type { AuditData } from "@/lib/types";

function page(partial: Partial<NormalizedPage> & { structuredData?: Record<string, unknown> }): NormalizedPage {
  return {
    url: partial.url ?? "https://shop.example.com/products/serum",
    title: partial.title ?? "",
    description: partial.description ?? "",
    pageType: partial.pageType ?? "product",
    markdown: partial.markdown ?? "",
    imageCount: partial.imageCount ?? 0,
    contentHash: partial.contentHash ?? "hash",
    structuredData: partial.structuredData ?? {},
    scrapeStatus: partial.scrapeStatus ?? "ok",
    scrapeMs: partial.scrapeMs,
  };
}

const RICH_MARKDOWN = `# Argan Face Serum

For dry, sensitive skin looking for a natural glow.

## Benefits

- Hydrates deeply
- Non-comedogenic
- Lightweight finish

## How to use

Apply 3 drops morning and night. See our [care guide](/guides/serum) and [collection](/collections/face).

## FAQ

### Is it suitable for oily skin?

Yes, it is non-comedogenic.

### What size is available?

50ml bottle.
`;

describe("GEO analysis engine", () => {
  it("scores a well-structured page with FAQ and Product schema higher", () => {
    const rich = analyzeGeo(
      page({
        title: "Argan Face Serum 50ml",
        description: "Nourishing argan face serum for dry, sensitive skin seeking a natural glow.",
        markdown: RICH_MARKDOWN,
        structuredData: {
          brand: "GlowLab",
          price: "299 EGP",
          hasPriceSignal: true,
          faq: [
            { q: "Is it suitable for oily skin?", a: "Yes, it is non-comedogenic." },
            { q: "What size is available?", a: "50ml bottle." },
            { q: "How often should I use it?", a: "Twice daily." },
          ],
          jsonLdTypes: ["Product", "FAQPage", "Organization", "BreadcrumbList"],
          headings: ["Argan Face Serum", "Benefits", "How to use", "FAQ"],
          openGraph: {
            "og:title": "Argan Face Serum",
            "og:description": "Nourishing argan face serum.",
            "og:image": "https://shop.example.com/serum.jpg",
          },
          metadata: { title: "Argan Face Serum", description: "Nourishing serum" },
        },
      })
    );

    const weak = analyzeGeo(
      page({
        title: "Product",
        description: "",
        markdown: "Buy now.",
        structuredData: {},
      })
    );

    expect(rich.score).toBeGreaterThan(weak.score);
    expect(rich.score).toBeGreaterThanOrEqual(60);
    expect(weak.score).toBeLessThan(40);
    expect(rich.findings.some((f) => f.id === "geo-faq" && f.status === "pass")).toBe(true);
    expect(rich.recommendations.length).toBeGreaterThanOrEqual(0);
  });

  it("loses points when Product schema is missing", () => {
    const withSchema = analyzeGeo(
      page({
        title: "Serum",
        description: "A hydrating serum for dry skin that helps restore glow.",
        markdown: RICH_MARKDOWN,
        structuredData: {
          brand: "GlowLab",
          price: "99",
          faq: [{ q: "Q1?", a: "A1" }],
          jsonLdTypes: ["Product", "FAQPage"],
          headings: ["Serum", "Benefits", "FAQ"],
          openGraph: { "og:title": "Serum", "og:description": "Hydrating", "og:image": "https://x.com/a.jpg" },
        },
      })
    );

    const withoutSchema = analyzeGeo(
      page({
        title: "Serum",
        description: "A hydrating serum for dry skin that helps restore glow.",
        markdown: RICH_MARKDOWN,
        structuredData: {
          brand: "GlowLab",
          price: "99",
          faq: [{ q: "Q1?", a: "A1" }],
          jsonLdTypes: ["FAQPage"],
          headings: ["Serum", "Benefits", "FAQ"],
          openGraph: { "og:title": "Serum", "og:description": "Hydrating", "og:image": "https://x.com/a.jpg" },
        },
      })
    );

    expect(withSchema.score).toBeGreaterThan(withoutSchema.score);
    expect(withoutSchema.findings.some((f) => f.id === "geo-product-schema" && f.status === "fail")).toBe(
      true
    );
    expect(withoutSchema.recommendations.some((r) => r.id === "geo-rec-product-schema")).toBe(true);
  });

  it("page with FAQ scores higher than without FAQ", () => {
    const baseSd = {
      brand: "GlowLab",
      price: "99",
      jsonLdTypes: ["Product"],
      headings: ["Serum", "Benefits", "Specs"],
      openGraph: { "og:title": "Serum", "og:description": "Hydrating serum", "og:image": "https://x.com/a.jpg" },
    };

    const withFaq = analyzeGeo(
      page({
        title: "Serum",
        description: "Hydrating serum for dry skin designed for daily glow.",
        markdown: RICH_MARKDOWN,
        structuredData: {
          ...baseSd,
          faq: [
            { q: "Is it vegan?", a: "Yes." },
            { q: "Size?", a: "50ml." },
            { q: "Scent?", a: "Unscented." },
          ],
          jsonLdTypes: ["Product", "FAQPage"],
        },
      })
    );

    const withoutFaq = analyzeGeo(
      page({
        title: "Serum",
        description: "Hydrating serum for dry skin designed for daily glow.",
        markdown: `# Serum\n\nFor dry skin.\n\n## Benefits\n\n- Soft\n- Light\n`,
        structuredData: baseSd,
      })
    );

    expect(withFaq.score).toBeGreaterThan(withoutFaq.score);
  });

  it("handles invalid / empty page data without crashing", () => {
    const empty = analyzeGeo(null);
    expect(empty.score).toBe(0);
    expect(empty.findings.length).toBeGreaterThan(0);

    const broken = analyzeGeo(
      page({
        title: "",
        description: "",
        markdown: "",
        structuredData: {
          faq: "not-an-array" as unknown as never,
          jsonLdTypes: null as unknown as never,
          headings: 123 as unknown as never,
        },
      })
    );
    expect(broken.score).toBeGreaterThanOrEqual(0);
    expect(broken.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(broken.findings)).toBe(true);
    expect(broken.readability.chatgpt).toBeGreaterThanOrEqual(0);
  });

  it("handles missing metadata safely", () => {
    const signals = detectStructuredContent(
      page({
        title: "",
        description: "",
        markdown: "Hello world",
        structuredData: {},
      })
    );
    expect(signals.hasTitle).toBe(false);
    expect(signals.hasDescription).toBe(false);
    expect(signals.hasOgImage).toBe(false);

    const components = scoreAllGeoComponents(signals);
    expect(components.metadata).toBe(0);
    expect(sumComponentScores(components)).toBeGreaterThanOrEqual(0);
  });

  it("is deterministic across repeated runs", () => {
    const input = page({
      title: "Serum",
      description: "For dry skin looking for glow.",
      markdown: RICH_MARKDOWN,
      structuredData: {
        brand: "GlowLab",
        price: "10",
        faq: [{ q: "Q?", a: "A" }],
        jsonLdTypes: ["Product"],
        headings: ["Serum", "FAQ"],
      },
    });
    const a = analyzeGeo(input);
    const b = analyzeGeo(input);
    expect(a.score).toBe(b.score);
    expect(a.componentScores).toEqual(b.componentScores);
    expect(a.findings.map((f) => f.id)).toEqual(b.findings.map((f) => f.id));
  });

  it("applyGeoAnalysisToAudit preserves conversion/seo/trust scores", () => {
    const audit: AuditData = {
      productUrl: "https://shop.example.com/p",
      storeName: "Shop",
      productName: "Serum",
      overallScore: 50,
      breakdown: [
        { pillar: "conversion", score: 70, max: 100, label: "Conversion", summary: "ok" },
        { pillar: "seo", score: 65, max: 100, label: "SEO", summary: "ok" },
        { pillar: "geo", score: 20, max: 100, label: "GEO", summary: "old" },
        { pillar: "trust", score: 55, max: 100, label: "Trust", summary: "ok" },
      ],
      recommendations: [],
      geoReadability: { chatgpt: 20, perplexity: 20, googleAI: 20 },
      createdAt: new Date().toISOString(),
    };

    const geo = analyzeGeo(
      page({
        title: "Serum",
        description: "For dry skin looking for a natural glow serum.",
        markdown: RICH_MARKDOWN,
        structuredData: {
          brand: "GlowLab",
          price: "99",
          faq: [{ q: "Q?", a: "A" }],
          jsonLdTypes: ["Product", "FAQPage"],
          headings: ["Serum", "Benefits", "FAQ"],
          openGraph: { "og:title": "Serum", "og:description": "x", "og:image": "https://x.com/a.jpg" },
        },
      })
    );

    const next = applyGeoAnalysisToAudit(audit, geo);
    expect(next.breakdown.find((b) => b.pillar === "conversion")?.score).toBe(70);
    expect(next.breakdown.find((b) => b.pillar === "seo")?.score).toBe(65);
    expect(next.breakdown.find((b) => b.pillar === "trust")?.score).toBe(55);
    expect(next.breakdown.find((b) => b.pillar === "geo")?.score).toBe(geo.score);
    expect(next.geoAnalysis?.score).toBe(geo.score);
    expect(next.geoAnalysis?.findings.length).toBeGreaterThan(0);
    expect(next.overallScore).toBe(averagePillarScores(next.breakdown));
  });
});
