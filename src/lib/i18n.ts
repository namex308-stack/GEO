/**
 * Backward-compatible translation entry point.
 *
 * The actual Arabic message catalog and locale registry now live under
 * `@/lib/locale` (see `locale/config.ts` for the locale registry and
 * `locale/messages/ar.ts` for the catalog). This module re-exports the same
 * `useT()` / `translate()` / `TranslationKey` API that call sites across the
 * app already use, so components did not need to change their imports.
 */
import { useT as useLocaleT, translate as localeTranslate, type MessageKey } from "@/lib/locale/t";

export type TranslationKey = MessageKey;

export const useT = useLocaleT;
export const translate = localeTranslate;
