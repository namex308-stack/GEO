/**
 * Backward-compatible translation entry point (Arabic-only product UI).
 *
 * Catalog + locale registry live under `@/lib/locale`. This module re-exports
 * `useT()` / `translate()` / `TranslationKey` for existing import paths.
 */
import { useT as useLocaleT, translate as localeTranslate, type MessageKey } from "@/lib/locale/t";

export type TranslationKey = MessageKey;

export const useT = useLocaleT;
export const translate = localeTranslate;
