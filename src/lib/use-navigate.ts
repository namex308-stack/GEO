"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "./store";
import type { View } from "./types";

/**
 * Maps internal View states to actual App Router URLs.
 * Used to navigate after store actions (startAudit, openLogin) that only
 * update Zustand state without triggering a route change.
 */
const VIEW_ROUTES: Record<View, string> = {
  landing: "/",
  login: "/auth",
  onboarding: "/onboarding/platform",
  audit: "/audit/new",
  results: "/audit/demo/report",
  dashboard: "/dashboard",
  pricing: "/pricing",
};

/**
 * Hook that wraps store navigation actions with actual router.push() calls.
 *
 * Usage:
 *   const { startAuditAndNavigate, openLoginAndNavigate } = useNavigateAfterAction();
 *   <Button onClick={startAuditAndNavigate}>Start Free Audit</Button>
 */
export function useNavigateAfterAction() {
  const router = useRouter();

  const navigateToView = (view: View) => {
    router.push(VIEW_ROUTES[view] ?? "/");
  };

  /** Calls store.startAudit() then navigates to the resulting view's route. */
  const startAuditAndNavigate = () => {
    useAppStore.getState().startAudit();
    const view = useAppStore.getState().view;
    navigateToView(view);
  };

  /** Calls store.openLogin() then navigates to /auth. */
  const openLoginAndNavigate = (after?: "onboarding" | "audit") => {
    useAppStore.getState().openLogin(after);
    navigateToView("login");
  };

  /** Calls store.login() then navigates to the resulting view's route. */
  const loginAndNavigate = () => {
    useAppStore.getState().login();
    const view = useAppStore.getState().view;
    navigateToView(view);
  };

  return { navigateToView, startAuditAndNavigate, openLoginAndNavigate, loginAndNavigate };
}
