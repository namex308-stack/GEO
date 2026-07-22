import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { ensureUserProfile } from "@/lib/auth/ensure-profile";
import {
  isGuidedFlowComplete,
  resumePathForFlow,
} from "@/lib/workflow/flow-state";

const AUTH_REDIRECT_COOKIE = "auth_redirect";

/**
 * Post-login destination:
 * - guided flow incomplete → exact resume step (quiz → connect → audit → scanning → report)
 * - flow complete → requested redirect (default /dashboard)
 */
async function resolveDestination(
  supabase: ReturnType<typeof createServerClient>,
  user: User,
  requested: string
): Promise<string> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding")
      .eq("id", user.id)
      .single();
    const onboarding =
      (profile?.onboarding as Record<string, string> | null) ?? {};
    if (!isGuidedFlowComplete(onboarding)) {
      return resumePathForFlow(onboarding);
    }
  } catch (err) {
    console.error("[auth/callback] onboarding lookup failed:", err);
  }
  return requested;
}

function loginRedirect(baseUrl: string, error: string) {
  return NextResponse.redirect(`${baseUrl}/login?error=${error}`);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");
  const redirectTo = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const cookieStore = await cookies();
  const next =
    decodeURIComponent(cookieStore.get(AUTH_REDIRECT_COOKIE)?.value ?? "") ||
    "/dashboard";

  if (oauthError) {
    console.error("[auth/callback] OAuth error:", oauthError, oauthErrorDescription);
    const response = loginRedirect(redirectTo, oauthError);
    response.cookies.delete(AUTH_REDIRECT_COOKIE);
    return response;
  }

  if (!code) {
    const response = loginRedirect(redirectTo, "no_code");
    response.cookies.delete(AUTH_REDIRECT_COOKIE);
    return response;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const response = loginRedirect(redirectTo, "supabase_not_configured");
    response.cookies.delete(AUTH_REDIRECT_COOKIE);
    return response;
  }

  // Buffer session cookies so the redirect target can be decided *after*
  // the code exchange (destination depends on the user's onboarding state).
  type PendingCookie = { name: string; value: string; options?: CookieOptions };
  const pendingCookies: PendingCookie[] = [];

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
          pendingCookies.push({ name, value, options });
        }
      },
    },
  });

  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] session exchange failed:", error.message);
    const failResponse = loginRedirect(redirectTo, "session_exchange_failed");
    failResponse.cookies.delete(AUTH_REDIRECT_COOKIE);
    return failResponse;
  }

  let destination = next.startsWith("/") ? next : `/${next}`;

  if (sessionData.user) {
    await ensureUserProfile(sessionData.user);
    destination = await resolveDestination(supabase, sessionData.user, destination);
  }

  const response = NextResponse.redirect(`${redirectTo}${destination}`);
  response.cookies.delete(AUTH_REDIRECT_COOKIE);
  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options);
  }

  return response;
}
