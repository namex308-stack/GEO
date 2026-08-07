/** Product UI / AI output locale — Arabic-only. */
export type AppLocale = "ar";

const ARABIC_SCRIPT = /[\u0600-\u06FF]/;

/** True if the string contains at least one Arabic letter. */
export function hasArabicScript(text: string | null | undefined): boolean {
  if (!text) return false;
  return ARABIC_SCRIPT.test(text);
}

/**
 * True when merchant-facing text looks Arabic enough.
 * Allows short strings (enums, numbers) that may not include Arabic letters.
 */
export function isArabicFacingText(text: string | null | undefined): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < 12) return true;
  return hasArabicScript(trimmed);
}

/**
 * Normalize any legacy/profile locale value to the only supported UI locale.
 * English (`en`) and unknown values are coerced to Arabic.
 */
export function normalizeAppLocale(_value?: unknown): AppLocale {
  return "ar";
}

/** Share of strings that contain Arabic among those long enough to judge. */
export function arabicTextRatio(texts: Array<string | null | undefined>): number {
  const judgeable = texts
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter((t) => t.length >= 12);
  if (judgeable.length === 0) return 1;
  const arabicCount = judgeable.filter((t) => hasArabicScript(t)).length;
  return arabicCount / judgeable.length;
}
