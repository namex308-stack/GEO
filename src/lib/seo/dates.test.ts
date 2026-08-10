import { describe, expect, it } from "vitest";
import { BLOG_POSTS, BLOG_SLUGS } from "@/lib/blog-posts";
import { isCalendarDateOnOrBeforeToday, parseCalendarDate } from "@/lib/seo/dates";
import { buildBlogArticleJsonLd } from "@/lib/seo/structured-data";

describe("seo dates", () => {
  it("parses calendar dates at noon UTC", () => {
    expect(parseCalendarDate("2026-08-10").toISOString()).toBe("2026-08-10T12:00:00.000Z");
  });

  it("treats future calendar dates as not emit-safe for schema", () => {
    expect(isCalendarDateOnOrBeforeToday("2099-01-01", new Date("2026-08-10T15:00:00Z"))).toBe(
      false
    );
    expect(isCalendarDateOnOrBeforeToday("2026-08-10", new Date("2026-08-10T15:00:00Z"))).toBe(
      true
    );
  });
});

describe("blog post SEO meta", () => {
  it("keeps BLOG_SLUGS derived from BLOG_POSTS", () => {
    expect(BLOG_SLUGS).toEqual(BLOG_POSTS.map((p) => p.slug));
    expect(BLOG_POSTS.every((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.publishedOn))).toBe(true);
  });

  it("emits Article image always and datePublished only when not future", () => {
    const future = buildBlogArticleJsonLd({
      title: "t",
      description: "d",
      path: "/blog/geo-ai-visibility-guide",
      publishedOn: "2099-01-01",
    });
    expect(future.image).toEqual([expect.stringContaining("/opengraph-image")]);
    expect(future.datePublished).toBeUndefined();

    const past = buildBlogArticleJsonLd({
      title: "t",
      description: "d",
      path: "/blog/geo-ai-visibility-guide",
      publishedOn: "2020-01-01",
    });
    expect(past.datePublished).toBe("2020-01-01");
    expect(past.dateModified).toBeUndefined();
  });
});
