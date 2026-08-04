/** UI / AI output locale for ConvAudit (Arabic-first product). */
export type AppLocale = "ar" | "en";

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

export function normalizeAppLocale(value: unknown): AppLocale {
  if (typeof value !== "string") return "ar";
  const v = value.trim().toLowerCase();
  if (v === "en" || v.startsWith("en-")) return "en";
  if (v === "ar" || v.startsWith("ar-")) return "ar";
  // Arabic-first default for unknown / empty values from profiles.
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
