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
 * Locale registry. Public routes are always Latin (`/pricing`, `/dashboard`,
 * `/blog/...`) regardless of locale — this registry only controls which
 * message catalog and text direction render for a given request. Adding a
 * new locale never touches routing: enable it here, add its catalog under
 * `messages/`, and it becomes selectable.
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
