/**
 * URL safety helpers for crawl targets (SSRF guard).
 * Pure module — safe to import from tests and API routes.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
]);

export type UrlSafetyResult =
  | { ok: true; href: string }
  | { ok: false; reason: string };

export function assertSafePublicHttpUrl(raw: string): UrlSafetyResult {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, reason: "رابط غير صالح." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "روابط http و https فقط مسموحة." };
  }

  const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || BLOCKED_HOSTNAMES.has(host) || host.endsWith(".localhost") || host.endsWith(".local")) {
    return { ok: false, reason: "أسماء المضيف المحلية أو المحجوزة غير مسموحة." };
  }

  if (isPrivateOrReservedHostname(host)) {
    return { ok: false, reason: "عناوين الشبكات الخاصة أو المحجوزة غير مسموحة." };
  }

  return { ok: true, href: parsed.href };
}

export function isPrivateOrReservedHostname(hostname: string): boolean {
  if (hostname === "::1" || hostname === "[::1]") return true;

  // IPv6 literal in brackets or bare
  const bare = hostname.replace(/^\[|\]$/g, "");
  if (bare.includes(":")) {
    const lower = bare.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA
    if (lower.startsWith("fe80")) return true; // link-local
    return false;
  }

  // IPv4 dotted decimal (also covers some weird forms)
  const parts = hostname.split(".");
  if (parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p))) {
    const nums = parts.map(Number);
    if (nums.some((n) => n > 255)) return true;
    const [a, b] = nums as [number, number, number, number];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast / reserved
    return false;
  }

  return false;
}
