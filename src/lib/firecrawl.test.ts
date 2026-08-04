import { describe, expect, it } from "vitest";
import { classifyPageType } from "@/lib/firecrawl/classify";

describe("classifyPageType", () => {
  it("detects product pages", () => {
    expect(
      classifyPageType(
        "https://shop.example.com/products/argan-serum",
        "Argan Serum",
        "Add to cart — 299 EGP"
      )
    ).toBe("product");
  });

  it("detects policy pages", () => {
    expect(
      classifyPageType("https://shop.example.com/policies/refund", "Refund Policy", "Return within 14 days")
    ).toBe("policy");
  });

  it("detects homepage", () => {
    expect(classifyPageType("https://shop.example.com/", "Home", "Welcome")).toBe("homepage");
  });
});
