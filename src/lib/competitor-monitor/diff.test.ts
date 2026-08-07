import { describe, expect, it } from "vitest";
import type { NormalizedPage } from "@/lib/db/types";
import {
  detectCompetitorChanges,
  summarizeBusinessImpact,
  summarizeRecommendedActions,
} from "./diff";
import { extractCompetitorSignals } from "./signals";
import { isCompetitorCrawlAllowed } from "./crawl-policy";

function page(partial: Partial<NormalizedPage> & { structuredData?: Record<string, unknown> }): NormalizedPage {
  return {
    url: "https://competitor.example/p/1",
    title: "Product A",
    description: "A solid product description",
    pageType: "product",
    markdown: "# Product A\nPrice 100 EGP\nAdd to cart\nReturn policy available",
    imageCount: 2,
    contentHash: "hash-a",
    structuredData: {
      price: "100 EGP",
      rating: "4.5",
      reviews: "10",
      faq: [{ q: "هل يوجد شحن؟", a: "نعم" }],
      jsonLdTypes: ["Product", "Offer"],
      schema: [{ "@type": "Product" }],
      hasPriceSignal: true,
      hasCtaSignal: true,
      ...partial.structuredData,
    },
    scrapeStatus: "ok",
    ...partial,
  };
}

describe("competitor-monitor crawl policy", () => {
  it("disallows crawl in development by default", () => {
    expect(
      isCompetitorCrawlAllowed({
        NODE_ENV: "development",
      } as NodeJS.ProcessEnv)
    ).toBe(false);
  });

  it("allows crawl in production", () => {
    expect(
      isCompetitorCrawlAllowed({
        NODE_ENV: "production",
      } as NodeJS.ProcessEnv)
    ).toBe(true);
  });

  it("allows explicit local opt-in", () => {
    expect(
      isCompetitorCrawlAllowed({
        NODE_ENV: "development",
        COMPETITOR_MONITOR_ALLOW_CRAWL: "true",
      } as NodeJS.ProcessEnv)
    ).toBe(true);
  });
});

describe("competitor-monitor diff", () => {
  it("detects price drop/increase, FAQ, reviews, schema, and score shifts", () => {
    const prev = extractCompetitorSignals(page({})).signals;
    const next = extractCompetitorSignals(
      page({
        title: "Product A Plus",
        description: "Updated description with clearer benefits",
        contentHash: "hash-b",
        structuredData: {
          price: "80 EGP",
          rating: "4.8",
          reviews: "25",
          faq: [
            { q: "هل يوجد شحن؟", a: "نعم" },
            { q: "ما مدة الإرجاع؟", a: "14 يوم" },
          ],
          jsonLdTypes: ["Product", "Offer", "FAQPage"],
          schema: [{ "@type": "Product" }, { "@type": "FAQPage" }],
          hasPriceSignal: true,
          hasCtaSignal: true,
        },
        markdown:
          "# Product A Plus\nPrice 80 EGP\nAdd to cart\nReturn policy\nmada\ntabby\nFAQ content",
      })
    ).signals;

    const changes = detectCompetitorChanges(prev, next);
    const types = new Set(changes.map((c) => c.changeType));

    expect(types.has("price_drop")).toBe(true);
    expect(types.has("title_change")).toBe(true);
    expect(types.has("description_change")).toBe(true);
    expect(types.has("new_faq")).toBe(true);
    expect(types.has("new_reviews")).toBe(true);
    expect(types.has("schema_change")).toBe(true);

    expect(summarizeBusinessImpact(changes).length).toBeGreaterThan(0);
    expect(summarizeRecommendedActions(changes).length).toBeGreaterThan(0);
  });

  it("detects price increase and removed FAQ/reviews", () => {
    const prev = extractCompetitorSignals(
      page({
        structuredData: {
          price: "90 EGP",
          reviews: "20",
          faq: [
            { q: "Q1", a: "A1" },
            { q: "Q2", a: "A2" },
          ],
          jsonLdTypes: ["Product"],
          schema: [{ "@type": "Product" }],
        },
      })
    ).signals;

    const next = extractCompetitorSignals(
      page({
        contentHash: "hash-c",
        structuredData: {
          price: "120 EGP",
          reviews: "12",
          faq: [{ q: "Q1", a: "A1" }],
          jsonLdTypes: ["Product"],
          schema: [{ "@type": "Product" }],
        },
      })
    ).signals;

    const types = new Set(detectCompetitorChanges(prev, next).map((c) => c.changeType));
    expect(types.has("price_increase")).toBe(true);
    expect(types.has("removed_faq")).toBe(true);
    expect(types.has("removed_reviews")).toBe(true);
  });

  it("extracts monitor fields for price title description schema trust seo geo", () => {
    const { signals, scores } = extractCompetitorSignals(page({}));
    expect(signals.priceValue).toBe(100);
    expect(signals.title).toContain("Product");
    expect(signals.description.length).toBeGreaterThan(5);
    expect(signals.schemaTypes).toContain("Product");
    expect(scores.seo).toBeGreaterThanOrEqual(0);
    expect(scores.geo).toBeGreaterThanOrEqual(0);
    expect(scores.trust).toBeGreaterThanOrEqual(0);
    expect(scores.overall).toBeGreaterThanOrEqual(0);
  });
});
