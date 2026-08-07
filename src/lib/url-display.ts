/**
 * Display helpers for URLs shown in the product UI.
 * Pure module — safe for client and server imports.
 */

/** Hostname for UI (strips www.); falls back to a truncated raw string. */
export function displayHostFromUrl(raw: string, maxFallback = 120): string {
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return raw.slice(0, maxFallback);
  }
}
