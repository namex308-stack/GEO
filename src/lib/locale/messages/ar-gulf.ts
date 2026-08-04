import type { MessageKey } from "./ar";

/**
 * Gulf dialect (خليجي) catalog — reserved extension point, intentionally
 * empty. Filling this in and flipping `enabled: true` for `ar-gulf` in
 * `../config.ts` is the only work needed to ship a second locale; any key
 * left unset here falls back to `ar.ts` (see `../t.ts`).
 */
export const arGulfMessages: Partial<Record<MessageKey, string>> = {};
