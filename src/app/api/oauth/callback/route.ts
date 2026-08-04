import { NextResponse } from "next/server";

/**
 * Legacy OAuth callback path.
 * Forwards to /auth/callback so the PKCE code exchange runs in one place.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || url.origin;
  const params = url.searchParams.toString();
  const target = params
    ? `${origin}/auth/callback?${params}`
    : `${origin}/auth/callback`;
  return NextResponse.redirect(target);
}
