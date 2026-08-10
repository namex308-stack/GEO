import { NextResponse, type NextRequest } from "next/server";
import { BLOG_SLUGS } from "@/lib/blog-posts";

/**
 * Rewrite target that is not a real App Router page.
 * Middleware rewrite here forces a filesystem-level HTTP 404 before RSC streaming
 * starts — needed because `blog/loading.tsx` (and similar) otherwise locks status 200
 * when `notFound()` runs inside the segment (soft-200 SEO issue).
 */
export const SEO_NOT_FOUND_REWRITE_PATH = "/__seo_not_found__";

/**
 * Unknown `/blog/[slug]` URLs must return real HTTP 404 for crawlers.
 * Valid posts pass through unchanged (loading UI preserved).
 */
export function rewriteUnknownPublicBlogSlug(
  request: NextRequest
): NextResponse | null {
  const match = /^\/blog\/([^/]+)\/?$/.exec(request.nextUrl.pathname);
  if (!match) return null;

  const slug = match[1];
  if ((BLOG_SLUGS as readonly string[]).includes(slug)) return null;

  const url = request.nextUrl.clone();
  url.pathname = SEO_NOT_FOUND_REWRITE_PATH;
  return NextResponse.rewrite(url);
}
