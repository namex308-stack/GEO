import { DEFAULT_LOCALE, getLocaleConfig } from "./config";
import type { LocaleId } from "./types";

/**
 * Resolves the active locale for rendering.
 * Product UI is Arabic-only — English is not supported. A future Arabic
 * dialect (e.g. `ar-gulf`) can plug in here without touching routes.
 */
export function getActiveLocaleId(): LocaleId {
  return DEFAULT_LOCALE;
}

/** Safe for both server and client components — no browser APIs involved. */
export function useLocale() {
  const locale = getActiveLocaleId();
  const config = getLocaleConfig(locale);
  return {
    locale,
    dir: config.dir,
    lang: config.htmlLang,
  };
}
