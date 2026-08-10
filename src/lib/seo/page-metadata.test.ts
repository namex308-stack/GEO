import { describe, expect, it } from "vitest";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { translate } from "@/lib/locale/t";
import { publicPageMetadata } from "@/lib/seo/page-metadata";
import { SITE_DESCRIPTION, SITE_DEFAULT_TITLE, SITE_OG_TITLE } from "@/lib/seo/site-copy";
import { ROUTES } from "@/lib/routes";

describe("public page metadata", () => {
  it("sets unique canonical, OG, Twitter, and locale fields", () => {
    const meta = publicPageMetadata({
      title: "أسعار الباقات",
      description: "وصف فريد للأسعار",
      path: ROUTES.pricing,
    });

    expect(meta.title).toBe("أسعار الباقات");
    expect(meta.description).toBe("وصف فريد للأسعار");
    expect(meta.alternates).toEqual({ canonical: ROUTES.pricing });
    expect(meta.openGraph).toMatchObject({
      title: "أسعار الباقات",
      description: "وصف فريد للأسعار",
      url: ROUTES.pricing,
      siteName: "ConvAudit",
      locale: "ar_EG",
      type: "website",
    });
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      title: "أسعار الباقات",
      description: "وصف فريد للأسعار",
    });
    expect(meta.robots).toEqual({ index: true, follow: true });
  });

  it("supports noindex for placeholder public shells", () => {
    const meta = publicPageMetadata({
      title: "حالة النظام",
      description: "قيد الإعداد",
      path: ROUTES.status,
      indexable: false,
    });
    expect(meta.robots).toEqual({
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    });
  });

  it("keeps homepage copy free of unsupported hard SLAs and invented percentages", () => {
    expect(SITE_DESCRIPTION).not.toMatch(/\d+\s*%/);
    expect(SITE_DESCRIPTION).not.toMatch(/60\s*ثانية/);
    expect(SITE_DEFAULT_TITLE.length).toBeGreaterThan(10);
    expect(SITE_OG_TITLE.length).toBeGreaterThan(10);
  });

  it("keeps blog post titles/excerpts free of unsupported conversion percentages", () => {
    for (const post of BLOG_POSTS) {
      const title = translate(post.titleKey);
      const excerpt = translate(post.excerptKey);
      expect(title).not.toMatch(/بنسبة\s*\d+\s*%/);
      expect(excerpt).not.toMatch(/بنسبة\s*\d+\s*%/);
      expect(title.trim().length).toBeGreaterThan(0);
      expect(excerpt.trim().length).toBeGreaterThan(0);
    }
  });
});
