import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 route protection entry (replaces deprecated `middleware.ts`).
 * Protects app routes; public: `/`, `/login`, `/pricing`, `/blog` (+ other
 * non-protected marketing pages). Auth logic lives in `updateSession`.
 *
 * Node runtime avoids edge-sandbox fetch failures against Supabase under load.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
