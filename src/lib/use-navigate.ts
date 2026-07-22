"use client";

import { useRouter } from "next/navigation";

/**
 * Marketing CTAs navigate directly to App Router product routes.
 */
export function useNavigateAfterAction() {
  const router = useRouter();

  const startAuditAndNavigate = () => {
    router.push("/audit/new");
  };

  const openLoginAndNavigate = (_after?: "onboarding" | "audit") => {
    router.push("/login");
  };

  return { startAuditAndNavigate, openLoginAndNavigate };
}
