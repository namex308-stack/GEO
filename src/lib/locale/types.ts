/**
 * Locale identifiers for user-facing content. `ar` (Modern Standard Arabic)
 * is the only enabled locale today. `ar-gulf` is reserved so a future Gulf
 * dialect variant can be added by filling in `messages/ar-gulf.ts` and
 * flipping `enabled: true` in `config.ts` — no route or component changes
 * required, since URLs are always Latin (see `config.ts` for details).
 */
export type LocaleId = "ar" | "ar-gulf";

export type Direction = "rtl" | "ltr";
