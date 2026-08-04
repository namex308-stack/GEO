import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { buildLoginRedirectTarget } from "@/lib/auth/login-redirect";
import {
  computeResumeStep,
  isOnboardingGatedPath,
  isOnboardingPath,
  onboardingPathForStep,
} from "@/lib/onboarding/constants";

/** App routes that require a Supabase session. */
const PROTECTED_PATHS = [
  "/dashboard",
  "/audit",
  "/history",
  "/settings",
  "/checkout",
  "/onboarding",
];

/** Real auth entry in this app (no /login or /signup pages). */
const AUTH_PATHS = ["/auth"];

/** Guard against Supabase network hangs blocking the whole request. */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const guarded = Promise.resolve(promise).catch(() => fallback);
  return Promise.race([
    guarded,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Refresh the Supabase session cookie on every matched request, then gate
 * protected App Router paths whenever Supabase is configured.
 * Incomplete onboarding redirects to the resume step (Supabase is source of truth).
 */
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAuthPath = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAuthCallback = pathname === "/auth/callback";

  if (!url || !anonKey) {
    if (isProtected) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/auth";
      loginUrl.searchParams.set("error", "supabase_not_configured");
      loginUrl.searchParams.set(
        "next",
        buildLoginRedirectTarget(pathname, request.nextUrl.search, {
          isOnboardingRoute: isOnboardingPath(pathname),
        })
      );
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  let user: { id: string } | null = null;
  if (!isAuthCallback) {
    try {
      const result = await withTimeout(
        supabase.auth.getUser(),
        5000,
        { data: { user: null }, error: null } as never
      );
      user = result.data.user;
    } catch {
      user = null;
    }
  }

  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth";
    loginUrl.searchParams.set(
      "next",
      buildLoginRedirectTarget(pathname, request.nextUrl.search, {
        isOnboardingRoute: isOnboardingPath(pathname),
      })
    );
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthPath && !isAuthCallback) {
    const redirectTarget = request.nextUrl.searchParams.get("next");
    const next =
      redirectTarget && redirectTarget.startsWith("/") && !redirectTarget.startsWith("//")
        ? redirectTarget
        : "/dashboard";
    return NextResponse.redirect(new URL(next, request.url));
  }

  // Mandatory onboarding gate — Supabase profile is the source of truth.
  if (user && (isOnboardingGatedPath(pathname) || isOnboardingPath(pathname))) {
    try {
      type ProfileGate = {
        onboarding_completed_at: string | null;
        business_name: string | null;
        store_url: string | null;
        country: string | null;
        primary_language: string | null;
        platform: string | null;
        store_size: string | null;
        business_category: string | null;
        primary_goal: string | null;
        monthly_traffic: string | null;
        monthly_orders: string | null;
        main_challenge: string | null;
      } | null;

      const profileResult = await withTimeout<{ data: ProfileGate }>(
        Promise.resolve(
          supabase
            .from("profiles")
            .select(
              "onboarding_completed_at, business_name, store_url, country, primary_language, platform, store_size, business_category, primary_goal, monthly_traffic, monthly_orders, main_challenge"
            )
            .eq("id", user.id)
            .maybeSingle()
        ).then((r) => ({ data: (r.data as ProfileGate) ?? null })),
        4000,
        { data: null }
      );

      const completed = Boolean(profileResult.data?.onboarding_completed_at);
      const row = profileResult.data;
      const step = computeResumeStep({
        businessName: row?.business_name ?? "",
        storeUrl: row?.store_url ?? "",
        country: row?.country ?? "",
        primaryLanguage: row?.primary_language ?? "",
        platform: row?.platform ?? "",
        storeSize: row?.store_size ?? "",
        businessCategory: row?.business_category ?? "",
        primaryGoal: row?.primary_goal ?? "",
        monthlyTraffic: row?.monthly_traffic ?? "",
        monthlyOrders: row?.monthly_orders ?? "",
        mainChallenge: row?.main_challenge ?? "",
      });

      if (!completed && isOnboardingGatedPath(pathname)) {
        const resume = onboardingPathForStep(step);
        return NextResponse.redirect(new URL(resume, request.url));
      }

      // Completed users who revisit the wizard (except /done celebration) go to dashboard.
      if (
        completed &&
        isOnboardingPath(pathname) &&
        pathname !== "/onboarding/done"
      ) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch {
      // Fail open for gated paths only if profile lookup hangs — auth still required.
    }
  }

  return response;
}
