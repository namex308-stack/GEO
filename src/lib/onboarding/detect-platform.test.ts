import { describe, expect, it } from "vitest";
import {
  detectEcommercePlatform,
  extractDomainFromUrl,
  extractHomepageTitle,
} from "@/lib/onboarding/detect-platform";

describe("detectEcommercePlatform", () => {
  it("detects Shopify from CDN assets", () => {
    const result = detectEcommercePlatform({
      url: "https://example.com",
      html: '<script src="https://cdn.shopify.com/s/files/1/theme.js"></script>',
    });
    expect(result.platform).toBe("shopify");
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("detects WooCommerce from plugin paths", () => {
    const result = detectEcommercePlatform({
      url: "https://shop.example.com",
      html: '<link href="/wp-content/plugins/woocommerce/assets/css/woocommerce.css" />',
    });
    expect(result.platform).toBe("woocommerce");
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("detects Salla from host", () => {
    const result = detectEcommercePlatform({
      url: "https://brand.salla.sa",
      html: "<html><body>store</body></html>",
    });
    expect(result.platform).toBe("salla");
  });

  it("prefers Salla host over conflicting Shopify markup", () => {
    const result = detectEcommercePlatform({
      url: "https://brand.salla.sa",
      html: '<script src="https://cdn.shopify.com/s/files/1/theme.js"></script><div class="shopify-section">x</div>',
    });
    expect(result.platform).toBe("salla");
  });

  it("detects Zid from assets", () => {
    const result = detectEcommercePlatform({
      url: "https://shop.example.com",
      html: '<script src="https://cdn.zid.store/theme.js"></script>',
    });
    expect(result.platform).toBe("zid");
  });

  it("falls back to custom for generic ecommerce markup", () => {
    const result = detectEcommercePlatform({
      url: "https://boutique.example.com",
      html: '<button class="add-to-cart">Add to cart</button><div class="product">Tee</div>',
    });
    expect(result.platform).toBe("custom");
    expect(result.confidence).toBeLessThan(0.6);
  });

  it("returns other when no signals match", () => {
    const result = detectEcommercePlatform({
      url: "https://blog.example.com",
      html: "<html><title>My Blog</title><p>Hello</p></html>",
    });
    expect(result.platform).toBe("other");
  });
});

describe("homepage helpers", () => {
  it("extracts title and domain", () => {
    expect(extractHomepageTitle("<html><title> Acme &amp; Co </title></html>")).toBe(
      "Acme & Co"
    );
    expect(extractDomainFromUrl("https://Shop.Example.com/path")).toBe("shop.example.com");
  });
});
