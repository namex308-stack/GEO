import { getActiveLocaleId } from "./resolve";
import { arMessages } from "./messages/ar";
import { getMessages, type MessageKey } from "./messages";

export type { MessageKey };

function format(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ""));
}

/**
 * Resolves a message key against the active locale, falling back to the
 * `ar` baseline for keys not yet translated in a secondary locale (e.g. a
 * partially-filled future `ar-gulf` catalog).
 */
export function translate(key: MessageKey, params?: Record<string, string | number>): string {
  const locale = getActiveLocaleId();
  const messages = getMessages(locale);
  const text = messages[key] ?? arMessages[key] ?? key;
  return format(text, params);
}

/**
 * `t()` accessor. Not a stateful hook today since only one locale is
 * enabled, but kept as a function-returning call (matching the historical
 * `useT()` shape) so call sites are unaffected once locale selection
 * becomes dynamic.
 */
export function useT() {
  return translate;
}
