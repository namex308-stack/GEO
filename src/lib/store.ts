"use client";

import { create } from "zustand";
import type { AuditData, View } from "./types";

export interface OnboardingAnswers {
  platform: string;
  challenge: string;
  priceRange: string;
  audience: string;
  referral: string;
}

interface AppState {
  view: View;
  isAuthed: boolean;
  pendingAfterLogin: "onboarding" | "audit" | null;
  user: { name: string; email: string; avatar: string } | null;
  audit: AuditData | null;
  auditsUsed: number;
  plan: "free" | "pro" | "business";
  onboarding: OnboardingAnswers | null;

  setView: (v: View) => void;
  openLogin: (after?: "onboarding" | "audit") => void;
  closeLogin: () => void;
  login: () => void;
  logout: () => void;
  setAudit: (a: AuditData) => void;
  setPlan: (p: "free" | "pro" | "business") => void;
  incrementAudits: () => void;
  startAudit: () => void;
  setOnboarding: (a: OnboardingAnswers) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  view: "landing",
  isAuthed: false,
  pendingAfterLogin: null,
  user: null,
  audit: null,
  auditsUsed: 0,
  plan: "free",
  onboarding: null,

  setView: (v) => {
    set({ view: v });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },
  openLogin: (after = "onboarding") =>
    set({ view: "login", pendingAfterLogin: after }),
  closeLogin: () => set({ pendingAfterLogin: null }),
  login: () => {
    const after = get().pendingAfterLogin ?? "onboarding";
    set({
      isAuthed: true,
      pendingAfterLogin: null,
      user: {
        name: "Youssef El-Sayed",
        email: "youssef@storepulse.ai",
        avatar: "YE",
      },
      view: after,
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },
  logout: () =>
    set({ isAuthed: false, user: null, view: "landing", onboarding: null }),
  setAudit: (a) => set({ audit: a }),
  setPlan: (p) => set({ plan: p }),
  incrementAudits: () => set((s) => ({ auditsUsed: s.auditsUsed + 1 })),
  startAudit: () => {
    const { isAuthed, onboarding } = get();
    if (!isAuthed) {
      set({ view: "login", pendingAfterLogin: "onboarding" });
    } else if (!onboarding) {
      set({ view: "onboarding" });
    } else {
      set({ view: "audit" });
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },
  setOnboarding: (a) => set({ onboarding: a, view: "audit" }),
}));
