import { DEFAULT_LOCALE, getLocaleConfig } from "./config";
import type { LocaleId } from "./types";

/**
 * Resolves the active locale for rendering. Only `ar` is enabled today, so
 * this always returns the default. This is the seam where a future
 * cookie/profile-selected locale (e.g. `ar-gulf`) would plug in — callers
 * (server and client) already go through this function, so enabling a
 * second locale never requires touching route or component code.
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
