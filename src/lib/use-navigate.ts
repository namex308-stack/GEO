"use client";

import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { ROUTES } from "@/lib/routes";

/**
 * Stable guest destinations for marketing CTAs.
 * Always present as real `href`s so crawlers see crawlable links; click handlers
 * may still `preventDefault` and resolve auth/onboarding state for signed-in users.
 */
export const CRAWLABLE_START_AUDIT_HREF =
  `${ROUTES.auth}?mode=signup&next=${encodeURIComponent(ROUTES.onboarding)}` as const;

export const CRAWLABLE_LOGIN_HREF =
  `${ROUTES.auth}?mode=login&next=${encodeURIComponent(ROUTES.onboarding)}` as const;

async function resolveAuditStartPath(): Promise<string> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return `${ROUTES.auth}?next=${encodeURIComponent(ROUTES.onboarding)}&error=supabase_not_configured`;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return CRAWLABLE_START_AUDIT_HREF;

  try {
    const res = await fetch("/api/onboarding");
    if (res.status === 401) return CRAWLABLE_START_AUDIT_HREF;
    if (!res.ok) return ROUTES.onboarding;
    const data = (await res.json()) as {
      onboarding?: { completed?: boolean; resumePath?: string };
    };
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
