import { NextResponse } from "next/server";
import { absoluteUrl } from "@/lib/site-url";

/**
 * Legacy OAuth callback path.
 * Forwards to /auth/callback so the PKCE code exchange runs in one place.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = url.searchParams.toString();
  const target = params
    ? absoluteUrl(`/auth/callback?${params}`)
    : absoluteUrl("/auth/callback");
  return NextResponse.redirect(target);
}
