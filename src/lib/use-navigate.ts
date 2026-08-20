"use client";

import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { ROUTES } from "@/lib/routes";
import { withTimeout } from "@/lib/with-timeout";

/**
 * Stable guest destinations for marketing CTAs.
 * Always present as real `href`s so crawlers see crawlable links; click handlers
 * may still `preventDefault` and resolve auth/onboarding state for signed-in users.
 */
export const CRAWLABLE_START_AUDIT_HREF =
  `${ROUTES.auth}?mode=signup&next=${encodeURIComponent(ROUTES.onboarding)}` as const;

export const CRAWLABLE_LOGIN_HREF =
  `${ROUTES.auth}?mode=login&next=${encodeURIComponent(ROUTES.onboarding)}` as const;

const AUTH_LOOKUP_MS = 2_500;
const ONBOARDING_LOOKUP_MS = 2_500;

type OnboardingPayload = {
  onboarding?: { completed?: boolean; resumePath?: string };
};

async function resolveAuditStartPath(): Promise<string> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return `${ROUTES.auth}?next=${encodeURIComponent(ROUTES.onboarding)}&error=supabase_not_configured`;
  }

  const userResult = await withTimeout(
    supabase.auth.getUser().then((r) => r.data.user),
    AUTH_LOOKUP_MS,
    null
  );
  if (!userResult) return CRAWLABLE_START_AUDIT_HREF;

  const res = await withTimeout(
    fetch("/api/onboarding"),
    ONBOARDING_LOOKUP_MS,
    null
  );
  if (!res) return ROUTES.onboarding;
  if (res.status === 401) return CRAWLABLE_START_AUDIT_HREF;
  if (!res.ok) return ROUTES.onboarding;

  try {
    const data = (await res.json()) as OnboardingPayload;
    if (!data.onboarding?.completed) {
      return data.onboarding?.resumePath || ROUTES.onboarding;
    }
    return ROUTES.auditNew;
  } catch {
    return ROUTES.onboarding;
  }
}

/**
 * App Router navigation helpers for marketing CTAs.
 * Auth + onboarding state always come from Supabase — never from local mock flags.
 * Lookups are time-boxed so a hung auth client cannot freeze the button.
 */
export function useNavigateAfterAction() {
  const router = useRouter();

  const startAuditAndNavigate = () => {
    void resolveAuditStartPath().then((path) => {
      router.push(path);
    });
  };

  const openLoginAndNavigate = (after?: "onboarding" | "audit") => {
    const next = after === "audit" ? ROUTES.auditNew : ROUTES.onboarding;
    router.push(
      `${ROUTES.auth}?mode=login&next=${encodeURIComponent(next)}`
    );
  };

  return {
    startAuditAndNavigate,
    openLoginAndNavigate,
    startAuditHref: CRAWLABLE_START_AUDIT_HREF,
    loginHref: CRAWLABLE_LOGIN_HREF,
    /** Authed “new audit” chrome — real href; click may still resolve onboarding. */
    newAuditHref: ROUTES.auditNew,
  };
}
