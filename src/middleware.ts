import { type NextRequest } from "next/server";
import { rewriteUnknownPublicBlogSlug } from "@/lib/seo/force-public-404";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const blogNotFound = rewriteUnknownPublicBlogSlug(request);
  if (blogNotFound) return blogNotFound;

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
