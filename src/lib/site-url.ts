/**
 * Single source of truth for this deployment's public base URL.
 *
 * `layout.tsx` (metadataBase), `sitemap.ts`, `robots.ts`, and `manifest.ts`
 * previously each hard-coded their own fallback (some `localhost:3000`,
 * others a placeholder production domain) — a mismatch would make canonical
 * URLs, Open Graph `url`, and sitemap entries point at different domains.
 * Every SEO-facing file should read the base URL from here instead.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return (raw || "http://localhost:3000").replace(/\/+$/, "");
}
