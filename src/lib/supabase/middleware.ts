import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isQuizComplete,
  resumePathForFlow,
} from "@/lib/onboarding/validate";
import { isGuidedFlowComplete } from "@/lib/workflow/flow-state";
import { buildLoginRedirectTarget } from "@/lib/auth/login-redirect";
import { isInvalidRefreshTokenError } from "@/lib/auth/is-invalid-refresh-token";

const PROTECTED_PATHS = [
  "/dashboard",
  "/audit",
  "/history",
  "/reports",
  "/ai",
  "/ai-center",
  "/tools",
  "/settings",
  "/watch",
  "/checkout",
];

/**
 * Public marketing routes (no session required).
 * `/login` / `/signup` stay in AUTH_PATHS so signed-in users are redirected away.
 */
const PUBLIC_PATHS = ["/", "/pricing", "/blog"];

const AUTH_PATHS = ["/login", "/signup", "/auth"];

/** Guard against Supabase network hangs blocking the whole request. */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const guarded = Promise.resolve(promise).catch(() => fallback);
  return Promise.race([
    guarded,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function loadOnboarding(
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<{ ok: boolean; data: Record<string, string> | null }> {
  try {
    const query = supabase
      .from("profiles")
      .select("onboarding")
      .eq("id", userId)
      .single();
    const result = (await withTimeout<{ data: unknown }>(
      query as unknown as Promise<{ data: unknown }>,
      4000,
      { data: null }
    )) as { data: { onboarding?: Record<string, string> | null } | null };
    if (!result.data) return { ok: false, data: null };
    return { ok: true, data: result.data.onboarding ?? {} };
  } catch {
    return { ok: false, data: null };
  }
}

/** Drop stale Supabase auth cookies so a bad refresh token cannot loop. */
function clearSupabaseAuthCookies(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const names = request.cookies
    .getAll()
    .map((c) => c.name)
    .filter((name) => name.startsWith("sb-") && name.includes("auth-token"));

  if (names.length === 0) return response;

  for (const name of names) {
    request.cookies.set(name, "");
  }

  // Rebuild so Server Components see the cleared request cookies.
  const next = NextResponse.next({ request });
  // Preserve any cookies supabase already wrote on `response`.
  for (const cookie of response.cookies.getAll()) {
    next.cookies.set(cookie);
  }
  for (const name of names) {
    next.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
    });
  }
  return next;
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request });

  if (!url || !anonKey) return response;

  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`))
  );
  const isOnboardingRoute =
    pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAuthPath = AUTH_PATHS.includes(pathname);
  const isAuditFlowRoute =
    pathname.startsWith("/audit/") &&
    (pathname.includes("/scanning") ||
      pathname.includes("/report") ||
      pathname.includes("/generate") ||
      pathname.includes("/compare"));

  // Always refresh/validate the session so stale refresh tokens are cleared
  // even on public marketing pages (layout/page still call getUser()).
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
  try {
    const result = await withTimeout(
      supabase.auth.getUser(),
      5000,
      { data: { user: null }, error: null } as never
    );
    user = result.data?.user ?? null;
    if (!user && isInvalidRefreshTokenError(result.error)) {
      response = clearSupabaseAuthCookies(request, response);
    }
  } catch {
    user = null;
    response = clearSupabaseAuthCookies(request, response);
  }

  // Public / non-app routes: session refreshed above; no further auth routing.
  if (isPublic || (!isProtected && !isOnboardingRoute && !isAuthPath)) {
    return response;
  }

  if (!user) {
    if (isProtected || isOnboardingRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      // Preserve query (e.g. /checkout?plan=pro&period=monthly) so plan selection
      // survives login instead of bouncing users back through pricing/billing.
      loginUrl.searchParams.set(
        "redirect",
        buildLoginRedirectTarget(pathname, request.nextUrl.search, {
          isOnboardingRoute,
        })
      );
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  const loaded = await loadOnboarding(supabase, user.id);
  // On DB failure, let the user through rather than trapping them
  if (!loaded.ok) {
    return response;
  }

  const onboarding = loaded.data;
  const quizDone = isQuizComplete(onboarding);
  const flowDone = isGuidedFlowComplete(onboarding);

  const isCheckoutRoute =
    pathname === "/checkout" || pathname.startsWith("/checkout/");

  // Incomplete quiz → force onboarding quiz (checkout stays reachable so plan
  // selection is not bounced into the guided-flow “Upgrade” surfaces).
  if (!quizDone && (isProtected || isAuthPath) && !isCheckoutRoute) {
    const onboardingUrl = request.nextUrl.clone();
    onboardingUrl.pathname = "/onboarding/quiz";
    onboardingUrl.search = "";
    return NextResponse.redirect(onboardingUrl);
  }

  // Quiz done but guided flow incomplete
  if (quizDone && !flowDone && (isProtected || isAuthPath)) {
    if (isAuditFlowRoute || pathname === "/audit/new" || isCheckoutRoute) {
      return response;
    }
    const resume = resumePathForFlow(onboarding);
    const resumePath = resume.split("?")[0];
    if (pathname !== resumePath) {
      const target = request.nextUrl.clone();
      target.pathname = resumePath;
      // Do not carry checkout query onto resume paths — and never send
      // checkout traffic here (handled by isCheckoutRoute above).
      target.search = "";
      return NextResponse.redirect(target);
    }
  }

  // Fully complete → leave onboarding/auth for dashboard
  if (flowDone && (isOnboardingRoute || isAuthPath)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}
