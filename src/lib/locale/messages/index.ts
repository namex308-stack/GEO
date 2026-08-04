import type { LocaleId } from "../types";
import { arMessages, type MessageKey } from "./ar";
import { arGulfMessages } from "./ar-gulf";

export type { MessageKey };
export { arMessages };

const CATALOGS: Record<LocaleId, Partial<Record<MessageKey, string>>> = {
  ar: arMessages,
  "ar-gulf": arGulfMessages,
};

/** Messages for a locale, to be merged over the `ar` baseline by the caller. */
export function getMessages(locale: LocaleId): Partial<Record<MessageKey, string>> {
  return CATALOGS[locale] ?? arMessages;
}
