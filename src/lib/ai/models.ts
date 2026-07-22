import "server-only";

/** Models tried in order — each has separate quota buckets on Google's side. */
export const GEMINI_DEFAULT_MODELS = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-8b",
] as const;

/** @deprecated Use getGeminiModels() */
export const GEMINI_MODEL = GEMINI_DEFAULT_MODELS[2];
/** @deprecated Use getGeminiModels() */
export const GEMINI_MODEL_FALLBACK = GEMINI_DEFAULT_MODELS[3];

export function getGeminiModels(): string[] {
  const override = process.env.GEMINI_MODEL?.trim();
  if (override) {
    const rest = GEMINI_DEFAULT_MODELS.filter((m) => m !== override);
    return [override, ...rest];
  }
  return [...GEMINI_DEFAULT_MODELS];
}
