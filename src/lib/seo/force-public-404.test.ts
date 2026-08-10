import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { BLOG_SLUGS } from "@/lib/blog-posts";
import {
  rewriteUnknownPublicBlogSlug,
  SEO_NOT_FOUND_REWRITE_PATH,
} from "@/lib/seo/force-public-404";

function req(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

describe("rewriteUnknownPublicBlogSlug", () => {
  it("rewrites unknown blog slugs to the SEO 404 path", () => {
    const res = rewriteUnknownPublicBlogSlug(req("/blog/not-a-real-post-slug"));
    expect(res).not.toBeNull();
    expect(res!.headers.get("x-middleware-rewrite")).toContain(
      SEO_NOT_FOUND_REWRITE_PATH
    );
  });

  it("passes through every published blog slug", () => {
    for (const slug of BLOG_SLUGS) {
      expect(rewriteUnknownPublicBlogSlug(req(`/blog/${slug}`))).toBeNull();
    }
  });

  it("ignores non-blog public paths", () => {
    expect(rewriteUnknownPublicBlogSlug(req("/pricing"))).toBeNull();
    expect(rewriteUnknownPublicBlogSlug(req("/blog"))).toBeNull();
    expect(rewriteUnknownPublicBlogSlug(req("/blog/a/b"))).toBeNull();
  });
});
