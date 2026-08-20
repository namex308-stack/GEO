import { describe, expect, it } from "vitest";
import { decodeAuditDisplayFields, decodeHtmlEntities } from "@/lib/text/decode-html";
import type { AuditData } from "@/lib/types";

describe("decodeHtmlEntities", () => {
  it("leaves plain text unchanged", () => {
    expect(decodeHtmlEntities("FitFeky Gear")).toBe("FitFeky Gear");
  });

  it("decodes named entities used in scraped titles", () => {
    expect(decodeHtmlEntities("Elevate Your Everyday &ndash; Ridge")).toBe(
      "Elevate Your Everyday – Ridge"
    );
    expect(decodeHtmlEntities("A &amp; B")).toBe("A & B");
  });

  it("decodes double-escaped ampersands", () => {
    expect(decodeHtmlEntities("A &amp;amp; B")).toBe("A & B");
  });

  it("decodes numeric character references", () => {
    expect(decodeHtmlEntities("Hello&#39;s")).toBe("Hello's");
    expect(decodeHtmlEntities("Dash&#x2013;here")).toBe("Dash–here");
  });
});

describe("decodeAuditDisplayFields", () => {
  it("decodes product, store, page, and generated titles", () => {
    const audit = {
      productUrl: "https://example.com",
      storeName: "Acme &amp; Co",
      productName: "Soap &amp; Water",
      overallScore: 70,
      breakdown: [],
      recommendations: [],
      geoReadability: { chatgpt: 0, perplexity: 0, googleAI: 0 },
      createdAt: "2026-01-01T00:00:00.000Z",
      pageSignals: {
        websiteDetected: true,
        productPageDetected: true,
        productImageDetected: false,
        pageTitle: "Soap &amp; Water",
        errors: [],
      },
      generatedContent: {
        title: "Buy Soap &amp; Water",
        description: "desc",
        faq: [],
        metaDescription: "meta",
        adCopy: [],
      },
    } satisfies AuditData;

    const decoded = decodeAuditDisplayFields(audit);
    expect(decoded.productName).toBe("Soap & Water");
    expect(decoded.storeName).toBe("Acme & Co");
    expect(decoded.pageSignals?.pageTitle).toBe("Soap & Water");
    expect(decoded.generatedContent?.title).toBe("Buy Soap & Water");
  });
});
