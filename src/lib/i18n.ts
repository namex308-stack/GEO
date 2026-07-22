"use client";

import * as React from "react";
import { useLanguageStore, type Language } from "./language-store";
import { useMounted } from "@/hooks/use-mounted";
import en from "@/locales/en.json";
import ar from "@/locales/ar.json";

type LocaleDictionary = typeof en;

/**
 * Combined EN/AR dictionary built from `src/locales/*.json`.
 * Kept as `{ en, ar }` so existing `translations[key][lang]` call sites keep working.
 */
function buildTranslations(): {
  [K in keyof LocaleDictionary]: { en: string; ar: string };
} {
  const out = {} as {
    [K in keyof LocaleDictionary]: { en: string; ar: string };
  };
  for (const key of Object.keys(en) as (keyof LocaleDictionary)[]) {
    out[key] = {
      en: en[key],
      ar: (ar as LocaleDictionary)[key] ?? en[key],
    };
  }
  return out;
}

export const translations = buildTranslations();

export type TranslationKey = keyof LocaleDictionary;

/** Format a string with {placeholder} substitution. */
function format(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ""));
}

/**
 * Hook to get the translation function.
 *
 * To avoid hydration mismatches, this always returns English during SSR and
 * the initial client render. After the client mounts (useEffect), it switches
 * to the persisted language from localStorage. This guarantees the server HTML
 * and the initial client HTML are identical.
 *
 * Usage:
 *   const t = useT();
 *   t("nav.dashboard")           // → "Dashboard" or "لوحة التحكم"
 *   t("dashboard.welcome", { name: "Youssef" })  // → "Welcome back, Youssef 👋"
 */
export function useT() {
  const language = useLanguageStore((s) => s.language);
  const mounted = useMounted();

  // During SSR and the first client render, always use English.
  // After mount, use the persisted language.
  const activeLanguage: Language = mounted ? language : "en";

  return React.useCallback(
    function t(key: TranslationKey, params?: Record<string, string | number>): string {
      const entry = translations[key];
      if (!entry) return key;
      const text = entry[activeLanguage] ?? entry.en;
      return format(text, params);
    },
    [activeLanguage]
  );
}

/** Get translation without React hook (for non-component use). */
export function translate(
  key: TranslationKey,
  language: Language,
  params?: Record<string, string | number>
): string {
  const entry = translations[key];
  if (!entry) return key;
  const text = entry[language] ?? entry.en;
  return format(text, params);
}
