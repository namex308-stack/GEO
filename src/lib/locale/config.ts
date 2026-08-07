import type { Direction, LocaleId } from "./types";

export interface LocaleConfig {
  id: LocaleId;
  /** Human-readable label for locale pickers (once more than one is enabled). */
  label: string;
  /** BCP-47 `lang` attribute value. */
  htmlLang: string;
  dir: Direction;
  /** Open Graph `locale` value, e.g. for the `og:locale` meta tag. */
  ogLocale: string;
  /** Whether this locale is selectable today. Only `ar` is enabled. */
  enabled: boolean;
}

/**
 * Locale registry (Arabic product UI only — English is not supported).
 * Public routes stay Latin (`/pricing`, `/dashboard`, `/blog/...`).
 * Future Arabic dialects (e.g. `ar-gulf`) can be enabled here without
 * touching routing.
 */
export const LOCALES: Record<LocaleId, LocaleConfig> = {
  ar: {
    id: "ar",
    label: "العربية (فصحى)",
    htmlLang: "ar",
    dir: "rtl",
    ogLocale: "ar_EG",
    enabled: true,
  },
  "ar-gulf": {
    id: "ar-gulf",
    label: "العربية (خليجي)",
    htmlLang: "ar",
    dir: "rtl",
    ogLocale: "ar_SA",
    enabled: false,
  },
};

export const DEFAULT_LOCALE: LocaleId = "ar";

export function getLocaleConfig(id: LocaleId): LocaleConfig {
  return LOCALES[id] ?? LOCALES[DEFAULT_LOCALE];
}

export function getEnabledLocales(): LocaleConfig[] {
  return Object.values(LOCALES).filter((l) => l.enabled);
}
