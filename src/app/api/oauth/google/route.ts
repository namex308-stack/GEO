import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const AUTH_REDIRECT_COOKIE = "auth_redirect";

/**
 * Start Supabase Google OAuth and redirect the browser to Google.
 * Callback lands on /api/oauth/callback (session exchange → app).
 */
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return NextResponse.redirect(
        `${appUrl}/login?error=supabase_not_configured`
      );
    }

    const redirectParam = req.nextUrl.searchParams.get("redirect") || "/dashboard";
    const safeRedirect = redirectParam.startsWith("/") ? redirectParam : "/dashboard";

    const cookieStore = await cookies();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${appUrl}/api/oauth/callback`,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      console.error("[api/oauth/google] OAuth start failed:", error?.message);
      return NextResponse.redirect(`${appUrl}/login?error=oauth_start_failed`);
    }

    const response = NextResponse.redirect(data.url);
    response.cookies.set(AUTH_REDIRECT_COOKIE, encodeURIComponent(safeRedirect), {
      path: "/",
      maxAge: 600,
      sameSite: "lax",
    });
    return response;
  } catch (err) {
    console.error("[api/oauth/google] GET error:", err);
    return NextResponse.redirect(`${appUrl}/login?error=oauth_start_failed`);
  }
}
