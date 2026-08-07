import { describe, expect, it } from "vitest";
import { decodeHtmlEntities } from "@/lib/text/decode-html";

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

  it("decodes numeric character references", () => {
    expect(decodeHtmlEntities("Hello&#39;s")).toBe("Hello's");
    expect(decodeHtmlEntities("Dash&#x2013;here")).toBe("Dash–here");
  });
});
