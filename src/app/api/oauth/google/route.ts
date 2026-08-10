import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { absoluteUrl } from "@/lib/site-url";

/**
 * Initiate Google OAuth via Supabase Auth.
 * Prefer client-side signInWithOAuth from /auth; this route is a fallback entry.
 */
export async function GET(req: NextRequest) {
  const next = safeNextPath(new URL(req.url).searchParams.get("next"));

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(
      absoluteUrl(
        `/auth?error=supabase_not_configured&next=${encodeURIComponent(next)}`
      )
    );
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: absoluteUrl(`/auth/callback?next=${encodeURIComponent(next)}`),
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    console.error("[oauth/google] signInWithOAuth failed:", error?.message);
    return NextResponse.redirect(
      absoluteUrl(
        `/auth?error=${encodeURIComponent("auth_callback_failed")}&next=${encodeURIComponent(next)}`
      )
    );
  }

  return NextResponse.redirect(data.url);
}
