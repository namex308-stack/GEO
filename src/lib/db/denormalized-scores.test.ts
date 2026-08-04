import { describe, expect, it } from "vitest";
import {
  AUDIT_ANALYSIS_VERSION,
  geoSignalsFromComponents,
  pillarScore,
} from "@/lib/db/denormalized-scores";
import { GEO_COMPONENT_MAX } from "@/lib/audit/citation-score";

describe("denormalized-scores", () => {
  it("exposes a stable analysis version", () => {
    expect(AUDIT_ANALYSIS_VERSION).toMatch(/^audit-engine-/);
  });

  it("maps GEO components to 0–100 signal columns", () => {
    const signals = geoSignalsFromComponents(
      72,
      {
        faq: GEO_COMPONENT_MAX.faq,
        productSchema: GEO_COMPONENT_MAX.productSchema,
        organizationSchema: 0,
        breadcrumbSchema: 0,
        headings: 0,
        contentStructure: GEO_COMPONENT_MAX.contentStructure / 2,
        internalLinks: 0,
        entityRichness: GEO_COMPONENT_MAX.entityRichness,
        metadata: GEO_COMPONENT_MAX.metadata,
        contentClarity: GEO_COMPONENT_MAX.contentClarity,
      },
      { chatgpt: 80, perplexity: 70, googleAI: 60 }
    );

    expect(signals.citationScore).toBe(72);
    expect(signals.faqScore).toBe(100);
    expect(signals.entityScore).toBe(100);
    expect(signals.aiReadabilityScore).toBe(70);
    expect(signals.schemaScore).toBeGreaterThan(0);
    expect(signals.schemaScore).toBeLessThanOrEqual(100);
    expect(signals.freshnessScore).toBeGreaterThan(0);
  });

  it("reads pillar scores from breakdown", () => {
    expect(
      pillarScore(
        [
          { pillar: "geo", score: 81, max: 100, label: "GEO", summary: "" },
          { pillar: "seo", score: 55, max: 100, label: "SEO", summary: "" },
        ],
        "geo"
      )
    ).toBe(81);
    expect(pillarScore([], "trust")).toBeNull();
  });
});
