import { NextResponse } from "next/server";

/**
 * Initiate Google OAuth via Supabase.
 * Redirects the browser to Supabase's hosted Google OAuth flow.
 * In demo mode (Supabase not configured), returns a helpful message.
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const redirectTo = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!supabaseUrl) {
    return NextResponse.json(
      {
        error: "Supabase is not configured.",
        hint: "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local",
      },
      { status: 503 }
    );
  }

  const callbackUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(
    `${redirectTo}/api/oauth/callback`
  )}`;

  return NextResponse.redirect(callbackUrl);
}
