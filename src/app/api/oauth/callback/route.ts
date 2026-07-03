import { NextResponse } from "next/server";

/**
 * OAuth callback handler.
 * After Supabase completes the Google OAuth flow, it redirects here with
 * the session in the URL hash/query. We forward the user to the dashboard.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const redirectTo = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const params = url.searchParams.toString();
  const target = `${redirectTo}/?${params}`;
  return NextResponse.redirect(target);
}
