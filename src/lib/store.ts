"use client";

import { create } from "zustand";

interface AppState {
  /** Clear ephemeral client cache on sign-out. */
  clearLocalSession: () => void;
}

/**
 * Ephemeral UI cache only — onboarding lives in Supabase profiles.
 * Do not store onboarding answers here as source of truth.
 */
export const useAppStore = create<AppState>(() => ({
  clearLocalSession: () => {
    /* reserved for future client caches; keeps sign-out hook stable */
  },
}));
