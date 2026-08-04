import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/safe-next-path";

/**
 * Supabase Auth callback — exchanges the OAuth/email code for a session cookie.
 * Configure Supabase redirect URLs to point here:
 *   {NEXT_PUBLIC_APP_URL}/auth/callback
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=no_code`);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/auth?error=supabase_not_configured`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent("auth_callback_failed")}`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
