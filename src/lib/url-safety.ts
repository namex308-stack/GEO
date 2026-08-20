/**
 * URL safety helpers for crawl targets (SSRF guard).
 * Validates scheme/host, classifies IP literals, and resolves DNS before fetch.
 */

import { lookup as dnsLookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
]);

const BLOCKED_REASON = "عناوين الشبكات الخاصة أو المحجوزة غير مسموحة.";
const LOCAL_HOST_REASON = "أسماء المضيف المحلية أو المحجوزة غير مسموحة.";
const DNS_REASON = "تعذّر التحقق من أن عنوان الموقع عام.";
const DNS_TIMEOUT_MS = 4_000;

const blockedRanges = new BlockList();
// IPv4 loopback / this-host / RFC1918 / link-local / CGNAT / multicast / reserved
blockedRanges.addSubnet("0.0.0.0", 8, "ipv4");
blockedRanges.addSubnet("10.0.0.0", 8, "ipv4");
blockedRanges.addSubnet("100.64.0.0", 10, "ipv4");
blockedRanges.addSubnet("127.0.0.0", 8, "ipv4");
blockedRanges.addSubnet("169.254.0.0", 16, "ipv4");
blockedRanges.addSubnet("172.16.0.0", 12, "ipv4");
blockedRanges.addSubnet("192.0.0.0", 24, "ipv4");
blockedRanges.addSubnet("192.0.2.0", 24, "ipv4");
blockedRanges.addSubnet("192.168.0.0", 16, "ipv4");
blockedRanges.addSubnet("198.18.0.0", 15, "ipv4");
blockedRanges.addSubnet("198.51.100.0", 24, "ipv4");
blockedRanges.addSubnet("203.0.113.0", 24, "ipv4");
blockedRanges.addSubnet("224.0.0.0", 4, "ipv4");
blockedRanges.addSubnet("240.0.0.0", 4, "ipv4");
blockedRanges.addAddress("255.255.255.255", "ipv4");
// IPv6 loopback, unspecified, IPv4-compatible (::/96), ULA, link-local, multicast, discard
blockedRanges.addAddress("::1", "ipv6");
blockedRanges.addAddress("::", "ipv6");
blockedRanges.addSubnet("::", 96, "ipv6");
blockedRanges.addSubnet("fc00::", 7, "ipv6");
blockedRanges.addSubnet("fe80::", 10, "ipv6");
blockedRanges.addSubnet("ff00::", 8, "ipv6");
blockedRanges.addSubnet("100::", 64, "ipv6");

const nat64WellKnown = new BlockList();
nat64WellKnown.addSubnet("64:ff9b::", 96, "ipv6");

export type UrlSafetyResult =
  | { ok: true; href: string }
  | { ok: false; reason: string };

export type HostnameLookup = (
  hostname: string
) => Promise<Array<{ address: string; family: number }>>;

export function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
}

export function isBlockedIpAddress(address: string): boolean {
  const ip = normalizeHostname(address);
  const kind = isIP(ip);
  if (kind === 4) return blockedRanges.check(ip, "ipv4");
  if (kind !== 6) return true;

  if (blockedRanges.check(ip, "ipv6")) return true;

  const embedded = embeddedIpv4(ip);
  if (embedded) return isBlockedIpAddress(embedded);

  return false;
}

/** Last 32 bits of NAT64 / IPv4-mapped forms as dotted IPv4, if present. */
function embeddedIpv4(ipv6: string): string | null {
  const mapped = ipv6.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped) return mapped[1] ?? null;

  const mappedHex = ipv6.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (mappedHex?.[1] && mappedHex[2]) {
    return hexPairToIpv4(mappedHex[1], mappedHex[2]);
  }

  if (!nat64WellKnown.check(ipv6, "ipv6")) return null;
  const expanded = expandIpv6(ipv6);
  const parts = expanded.split(":");
  if (parts.length !== 8 || !parts[6] || !parts[7]) return null;
  return hexPairToIpv4(parts[6], parts[7]);
}

function hexPairToIpv4(highHex: string, lowHex: string): string {
  const high = Number.parseInt(highHex, 16);
  const low = Number.parseInt(lowHex, 16);
  return `${(high >> 8) & 255}.${high & 255}.${(low >> 8) & 255}.${low & 255}`;
}

function expandIpv6(ip: string): string {
  let value = ip.toLowerCase();
  const dotted = value.match(/:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (dotted?.[1]) {
    const octets = dotted[1].split(".").map(Number);
    const a = octets[0] ?? 0;
    const b = octets[1] ?? 0;
    const c = octets[2] ?? 0;
    const d = octets[3] ?? 0;
    value = value.replace(
      /:\d{1,3}(?:\.\d{1,3}){3}$/,
      `:${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`
    );
  }
  const halves = value.split("::");
  const left = halves[0] ? halves[0].split(":").filter(Boolean) : [];
  const right = halves[1] ? halves[1].split(":").filter(Boolean) : [];
  const missing = Math.max(0, 8 - left.length - right.length);
  return [...left, ...Array(missing).fill("0"), ...right]
    .map((part) => part.padStart(4, "0"))
    .join(":");
}

export function isPrivateOrReservedHostname(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  if (!host) return true;
  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith(".localhost") || host.endsWith(".local")) {
    return true;
  }
  if (isIP(host)) return isBlockedIpAddress(host);
  return false;
}

function parseHttpUrl(raw: string): { ok: true; parsed: URL } | { ok: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, reason: "رابط غير صالح." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "روابط http و https فقط مسموحة." };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: "روابط تحتوي على بيانات اعتماد غير مسموحة." };
  }

  const host = normalizeHostname(parsed.hostname);
  if (!host) {
    return { ok: false, reason: LOCAL_HOST_REASON };
  }

  if (
    BLOCKED_HOSTNAMES.has(host) ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return { ok: false, reason: LOCAL_HOST_REASON };
  }

  if (isIP(host) && isBlockedIpAddress(host)) {
    return { ok: false, reason: BLOCKED_REASON };
  }

  return { ok: true, parsed };
}

async function defaultLookup(hostname: string): Promise<Array<{ address: string; family: number }>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const lookup = dnsLookup(hostname, { all: true, verbatim: true });
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("DNS_TIMEOUT")), DNS_TIMEOUT_MS);
    });
    return await Promise.race([lookup, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function addressesArePublic(
  records: Array<{ address: string; family: number }>
): boolean {
  if (records.length === 0) return false;
  return records.every((record) => isIP(record.address) && !isBlockedIpAddress(record.address));
}

/**
 * Full SSRF check: URL parse, IP literals, then DNS for hostnames.
 * Fails closed if any resolved address is non-public or lookup fails.
 */
export async function assertSafePublicHttpUrl(
  raw: string,
  options?: { lookup?: HostnameLookup }
): Promise<UrlSafetyResult> {
  const parsed = parseHttpUrl(raw);
  if (!parsed.ok) return parsed;

  const host = normalizeHostname(parsed.parsed.hostname);
  if (isIP(host)) {
    return { ok: true, href: parsed.parsed.href };
  }

  try {
    const lookup = options?.lookup ?? defaultLookup;
    const records = await lookup(host);
    if (!addressesArePublic(records)) {
      return { ok: false, reason: BLOCKED_REASON };
    }
  } catch {
    return { ok: false, reason: DNS_REASON };
  }

  return { ok: true, href: parsed.parsed.href };
}
