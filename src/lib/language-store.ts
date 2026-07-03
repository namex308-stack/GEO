"use client";

import * as React from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "en" | "ar";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: "en",
      setLanguage: (lang) => set({ language: lang }),
      toggleLanguage: () => set({ language: get().language === "en" ? "ar" : "en" }),
    }),
    { name: "storepulse-language" }
  )
);

/**
 * Get the current language and direction.
 *
 * To avoid hydration mismatches, this returns English/LTR during SSR and the
 * initial client render, then switches to the persisted language after mount.
 * This guarantees the server HTML and initial client HTML are identical.
 */
export function useLanguage() {
  const language = useLanguageStore((s) => s.language);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const activeLanguage: Language = mounted ? language : "en";
  return {
    language: activeLanguage,
    dir: activeLanguage === "ar" ? "rtl" : "ltr" as const,
    isAr: activeLanguage === "ar",
    isEn: activeLanguage === "en",
  };
}
