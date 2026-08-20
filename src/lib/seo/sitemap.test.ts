import { describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { ROUTES } from "@/lib/routes";
import { PRIVATE_APP_PATHS } from "@/lib/seo/private-app-paths";

describe("sitemap", () => {
  it("includes only existing non-placeholder public URLs with absolute origins", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.convaudit.com");

    const entries = sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls).toContain("https://www.convaudit.com");
    expect(urls).toContain("https://www.convaudit.com/pricing");
    expect(urls).toContain("https://www.convaudit.com/docs");
    expect(urls).toContain("https://www.convaudit.com/blog");
    expect(urls).toContain("https://www.convaudit.com/affiliate");
    expect(urls).toContain("https://www.convaudit.com/security");
    expect(urls).toContain("https://www.convaudit.com/privacy");
    expect(urls).toContain("https://www.convaudit.com/roadmap");

    for (const post of BLOG_POSTS) {
      expect(urls).toContain(`https://www.convaudit.com${ROUTES.blogPost(post.slug)}`);
    }

    // Placeholders excluded until they have real content
    expect(urls.some((u) => u.endsWith("/status"))).toBe(false);
    expect(urls.some((u) => u.endsWith("/changelog"))).toBe(false);

    // No private / auth / API surfaces (prefix match on pathname, not substring)
    for (const path of PRIVATE_APP_PATHS) {
      expect(
        urls.some((u) => {
          const pathname = new URL(u).pathname;
          return pathname === path || pathname.startsWith(`${path}/`);
        })
      ).toBe(false);
    }
    expect(urls.some((u) => new URL(u).pathname.startsWith("/api/"))).toBe(false);

    // No fabricated lastModified
    expect(entries.every((e) => e.lastModified === undefined)).toBe(true);

    // No duplicates
    expect(new Set(urls).size).toBe(urls.length);

    vi.unstubAllEnvs();
  });
});
