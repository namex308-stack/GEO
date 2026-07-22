const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
  "metadata.google.internal",
  "169.254.169.254",
]);

const PRIVATE_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./,
];

/** Exact host or subdomain match (e.g. facebook.com, www.facebook.com). */
const UNSUPPORTED_HOST_SUFFIXES = [
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "youtube.com",
  "youtu.be",
  "tiktok.com",
  "linkedin.com",
  "pinterest.com",
  "reddit.com",
  "google.com",
  "googleapis.com",
  "apple.com",
  "microsoft.com",
  "noon.com",
  "etsy.com",
  "walmart.com",
  "aliexpress.com",
  "temu.com",
  "shein.com",
];

/** Multi-TLD marketplaces — blocks amazon.eg, amazon.co.uk, ebay.de, etc. */
const MARKETPLACE_HOST_PREFIXES = ["amazon.", "ebay."];

const PRODUCT_PATH_PATTERNS = [
  /\/products?\//i,
  /\/product-/i,
  /\/p\//i,
  /\/item\//i,
  /\/shop\//i,
  /\/pd\//i,
  /\/goods\//i,
  /\/collections\/[^/]+\/products?\//i,
];

const UTILITY_PATH_PATTERNS = [
  /\/cart\b/i,
  /\/checkout\b/i,
  /\/account\b/i,
  /\/login\b/i,
  /\/register\b/i,
  /\/search\b/i,
  /\/admin\b/i,
  /\/wp-admin\b/i,
  /\.(pdf|zip|jpg|jpeg|png|gif|webp|svg|mp4|mp3|css|js)$/i,
];

const LOCALE_SEGMENT = /^[a-z]{2}(-[a-z]{2})?$/i;

export type AuditUrlType = "product_page" | "store_homepage" | "unsupported";

export function validateAuditUrl(raw: string): { valid: true; url: URL } | { valid: false; reason: string } {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { valid: false, reason: "Invalid URL format." };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { valid: false, reason: "Only http and https URLs are allowed." };
  }

  const hostname = url.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { valid: false, reason: "This hostname is not allowed." };
  }

  if (PRIVATE_RANGES.some((r) => r.test(hostname))) {
    return { valid: false, reason: "Private/internal IP addresses are not allowed." };
  }

  if (hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    return { valid: false, reason: "Internal hostnames are not allowed." };
  }

  return { valid: true, url };
}

function isUnsupportedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");

  if (MARKETPLACE_HOST_PREFIXES.some((prefix) => host.startsWith(prefix))) {
    return true;
  }

  return UNSUPPORTED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  );
}

function classifyPath(pathname: string): AuditUrlType {
  const path = pathname.replace(/\/+$/, "") || "/";
  const segments = path.split("/").filter(Boolean);

  if (UTILITY_PATH_PATTERNS.some((p) => p.test(pathname))) {
    return "unsupported";
  }

  if (PRODUCT_PATH_PATTERNS.some((p) => p.test(pathname))) {
    return "product_page";
  }

  if (segments.length === 0) {
    return "store_homepage";
  }

  if (segments.length === 1 && LOCALE_SEGMENT.test(segments[0]!)) {
    return "store_homepage";
  }

  if (segments.length >= 2) {
    return "product_page";
  }

  const homepageSlugs = new Set([
    "home",
    "index",
    "shop",
    "store",
    "catalog",
    "collection",
    "collections",
  ]);
  if (segments.length === 1 && homepageSlugs.has(segments[0]!.toLowerCase())) {
    return "store_homepage";
  }

  if (segments.length === 1) {
    return "product_page";
  }

  return "unsupported";
}

export function extractStoreUrlFromProductUrl(raw: string): string | null {
  const result = validateAuditUrl(raw);
  if (!result.valid) return null;
  return result.url.origin;
}

export type ClassifyAuditUrlResult =
  | { valid: true; url: URL; type: AuditUrlType; label: string }
  | { valid: false; reason: string };

const URL_TYPE_LABELS: Record<Exclude<AuditUrlType, "unsupported">, string> = {
  product_page: "Product Page",
  store_homepage: "Store Homepage",
};

export function classifyAuditUrl(raw: string): ClassifyAuditUrlResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, reason: "Enter a URL to analyze." };
  }

  const validation = validateAuditUrl(trimmed);
  if (!validation.valid) {
    return { valid: false, reason: validation.reason };
  }

  const { url } = validation;
  const hostname = url.hostname.toLowerCase();

  if (isUnsupportedHost(hostname)) {
    return {
      valid: false,
      reason: "This URL type is not supported. Use a product or store page.",
    };
  }

  const type = classifyPath(url.pathname);
  if (type === "unsupported") {
    return {
      valid: false,
      reason: "This URL type is not supported. Use a product or store homepage.",
    };
  }

  return {
    valid: true,
    url,
    type,
    label: URL_TYPE_LABELS[type],
  };
}
