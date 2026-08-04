"use client";

import { create } from "zustand";
import type { AuditData } from "./types";

interface AppState {
  auditsUsed: number;
  plan: "free" | "pro" | "business";
  lastAudit: AuditData | null;

  setPlan: (p: "free" | "pro" | "business") => void;
  incrementAudits: () => void;
  setLastAudit: (a: AuditData | null) => void;
  clearLocalSession: () => void;
}

/**
 * Ephemeral UI cache only — onboarding lives in Supabase profiles.
 * Do not store onboarding answers here as source of truth.
 */
export const useAppStore = create<AppState>((set) => ({
  auditsUsed: 0,
  plan: "free",
  lastAudit: null,

  setPlan: (p) => set({ plan: p }),
  incrementAudits: () => set((s) => ({ auditsUsed: s.auditsUsed + 1 })),
  setLastAudit: (a) => set({ lastAudit: a }),
  clearLocalSession: () => set({ lastAudit: null, auditsUsed: 0, plan: "free" }),
}));
