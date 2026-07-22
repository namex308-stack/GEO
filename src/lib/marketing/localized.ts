"use client";

import { useLanguageStore, type Language } from "@/lib/language-store";

export type Localized = Record<Language, string>;

export function pickLocalized(text: Localized, language: Language): string {
  return text[language] ?? text.en;
}

export function useLocalized() {
  const language = useLanguageStore((s) => s.language);
  return (text: Localized) => pickLocalized(text, language);
}
