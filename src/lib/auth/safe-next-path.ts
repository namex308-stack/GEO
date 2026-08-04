/**
 * Allow only same-origin relative paths for post-auth redirects.
 * Blocks protocol-relative and absolute URLs (open redirect).
 */
export function safeNextPath(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }
  return raw;
}
