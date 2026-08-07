"use client";

import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

async function resolveAuditStartPath(): Promise<string> {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    return "/auth?next=/onboarding&error=supabase_not_configured";
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "/auth?mode=signup&next=/onboarding";

  try {
    const res = await fetch("/api/onboarding");
    if (res.status === 401) return "/auth?mode=signup&next=/onboarding";
    if (!res.ok) return "/onboarding";
    const data = (await res.json()) as {
      onboarding?: { completed?: boolean; resumePath?: string };
    };
    if (!data.onboarding?.completed) {
      return data.onboarding?.resumePath || "/onboarding";
    }
    return "/audit/new";
  } catch {
    return "/onboarding";
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
    const next = after === "audit" ? "/audit/new" : "/onboarding";
    router.push(`/auth?mode=login&next=${encodeURIComponent(next)}`);
  };

  return { startAuditAndNavigate, openLoginAndNavigate };
}
