import { describe, expect, it } from "vitest";
import { extractPageData, extractionToStructuredData } from "@/lib/firecrawl/extract";

const SAMPLE_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Argan Serum 50ml</title>
  <meta name="description" content="Nourishing argan face serum for dry skin." />
  <meta property="og:title" content="Argan Serum" />
  <meta property="og:description" content="Nourishing argan face serum." />
  <meta property="og:image" content="https://shop.example.com/serum.jpg" />
  <meta property="og:type" content="product" />
  <meta property="product:price:amount" content="299" />
  <meta property="product:price:currency" content="EGP" />
  <meta property="product:brand" content="GlowLab" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Argan Serum 50ml",
    "brand": { "@type": "Brand", "name": "GlowLab" },
    "image": "https://shop.example.com/serum.jpg",
    "offers": { "@type": "Offer", "price": "299", "priceCurrency": "EGP" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.6", "reviewCount": "128" }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [{
      "@type": "Question",
      "name": "Is it suitable for oily skin?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes, it is non-comedogenic." }
    }]
  }
  </script>
</head>
<body>
  <h1>Argan Serum</h1>
  <p>Add to cart — 299 EGP</p>
  <img src="/serum.jpg" alt="serum" />
  <details><summary>How to use?</summary><p>Apply 3 drops morning and night.</p></details>
</body>
</html>`;

describe("extractPageData", () => {
  it("extracts title, description, price, brand, rating, reviews, FAQ, meta, OG, JSON-LD", () => {
    const md = "# Argan Serum\n\nAdd to cart — 299 EGP\n";
    const extracted = extractPageData(SAMPLE_HTML, md, undefined, "https://shop.example.com/products/serum");
    const structured = extractionToStructuredData(extracted);

    expect(extracted.title).toMatch(/Argan Serum/i);
    expect(extracted.description).toMatch(/Nourishing/i);
    expect(extracted.price).toMatch(/299/);
    expect(extracted.brand).toBe("GlowLab");
    expect(extracted.rating).toBe("4.6");
    expect(extracted.reviews).toBe("128");
    expect(extracted.faq.length).toBeGreaterThan(0);
    expect(extracted.faq.some((f) => /oily skin/i.test(f.q))).toBe(true);
    expect(extracted.openGraph["og:image"]).toContain("serum.jpg");
    expect(extracted.meta["description"]).toMatch(/Nourishing/i);
    expect(extracted.jsonLdTypes).toEqual(expect.arrayContaining(["Product", "FAQPage"]));
    expect(extracted.schema.length).toBeGreaterThan(0);
    expect(structured.price).toBeTruthy();
    expect(structured.brand).toBe("GlowLab");
    expect(structured.hasPriceSignal).toBe(true);
    expect(structured.hasCtaSignal).toBe(true);
  });

  it("fills price from markdown when HTML meta is missing", () => {
    const html = "<html><head><title>Item</title></head><body><h1>Item</h1></body></html>";
    const extracted = extractPageData(html, "Buy now for $49.00", undefined, "https://example.com/p");
    expect(extracted.price).toMatch(/49/);
    expect(extracted.hasPriceSignal).toBe(true);
  });
});
