/**
 * Single source of truth for this deployment's public base URL.
 *
 * Every SEO-facing surface (metadataBase, canonicals, Open Graph, Twitter,
 * sitemap, robots, JSON-LD, llms.txt) and any redirect that must match the
 * public origin should read through this module — never re-parse
 * NEXT_PUBLIC_APP_URL or hard-code localhost fallbacks elsewhere.
 *
 * Production policy:
 * - Missing NEXT_PUBLIC_APP_URL → throw (no silent localhost fallback)
 * - Vercel production / ENFORCE_PUBLIC_SITE_URL=1 → reject loopback + require https
 * - Any non-loopback production URL → require https
 * - Stale `*.vercel.app` values on Vercel production are rewritten to the
 *   canonical public origin (https://www.convaudit.com)
 */

const DEV_FALLBACK = "http://localhost:3000";

/** Canonical public production origin (custom domain). */
export const PRODUCTION_CANONICAL_ORIGIN = "https://www.convaudit.com";

function isLoopbackHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Strict public-URL checks for real hosted production (not local `next build`
 * with an explicit localhost env for smoke-testing a production bundle).
 */
function mustRejectLoopbackSiteUrl(): boolean {
  if (process.env.VERCEL_ENV === "production") return true;
  // Opt-in for non-Vercel production hosts (Docker/VPS).
  if (process.env.ENFORCE_PUBLIC_SITE_URL === "1") return true;
  return false;
}

function isVercelAppHostname(hostname: string): boolean {
  return hostname.toLowerCase().endsWith(".vercel.app");
}

/**
 * On Vercel production (or enforced public hosts), replace legacy deployment
 * hostnames with the custom-domain canonical so sitemap/robots/canonicals
 * never advertise *.vercel.app.
 */
function resolveCanonicalOrigin(parsed: URL, normalized: string): string {
  if (!isVercelAppHostname(parsed.hostname)) return normalized;
  if (process.env.VERCEL_ENV === "production" || process.env.ENFORCE_PUBLIC_SITE_URL === "1") {
    return PRODUCTION_CANONICAL_ORIGIN;
  }
  return normalized;
}

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!raw) {
    if (isProductionRuntime()) {
      throw new Error(
        "NEXT_PUBLIC_APP_URL is required in production. " +
          "It sets metadataBase, canonical URLs, sitemap, robots host, Open Graph, and JSON-LD. " +
          `Set it to your public HTTPS origin (e.g. ${PRODUCTION_CANONICAL_ORIGIN}).`
      );
    }
    return DEV_FALLBACK;
  }

  const normalized = raw.replace(/\/+$/, "");

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_APP_URL is invalid (${JSON.stringify(raw)}). ` +
        `Expected an absolute URL such as ${PRODUCTION_CANONICAL_ORIGIN}.`
    );
  }

  const loopback = isLoopbackHostname(parsed.hostname);

  if (loopback && mustRejectLoopbackSiteUrl()) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL must not be a localhost/loopback URL in production. " +
        "Canonical URLs, sitemap, and Open Graph would point at an unreachable host."
    );
  }

  // Production public origins must be HTTPS (explicit localhost local prod builds exempt).
  if (isProductionRuntime() && !loopback && parsed.protocol !== "https:") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL must use https:// in production " +
        `(received protocol ${parsed.protocol}).`
    );
  }

  return resolveCanonicalOrigin(parsed, normalized);
}

/**
 * Build an absolute public URL from a path (or absolute URL passthrough).
 * Paths should start with `/`. Uses getSiteUrl() — never hard-code the domain.
 */
export function absoluteUrl(pathOrUrl: string = "/"): string {
  const base = getSiteUrl();
  const trimmed = pathOrUrl.trim();
  if (!trimmed || trimmed === "/") return base;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, "");
  }

  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}
