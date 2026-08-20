/**
 * Ecommerce platform detection from HTML / headers / URL signals.
 * Pure module — safe for unit tests (no network).
 */

import { decodeHtmlEntities } from "@/lib/text/decode-html";

export type DetectedPlatform =
  | "shopify"
  | "woocommerce"
  | "salla"
  | "zid"
  | "magento"
  | "bigcommerce"
  | "custom"
  | "other";

export type PlatformDetection = {
  platform: DetectedPlatform;
  confidence: number;
  signals: string[];
};

type Detector = {
  platform: DetectedPlatform;
  weight: number;
  test: (ctx: DetectionContext) => string | null;
};

type DetectionContext = {
  url: string;
  host: string;
  html: string;
  headers: Record<string, string>;
};

function header(headers: Record<string, string>, name: string): string {
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === lower) return v;
  }
  return "";
}

const DETECTORS: Detector[] = [
  {
    platform: "shopify",
    weight: 0.95,
    test: ({ html, headers, host }) => {
      if (/cdn\.shopify\.com/i.test(html) || /Shopify\.theme/i.test(html)) {
        return "shopify_cdn_or_theme";
      }
      if (/myshopify\.com/i.test(host)) return "myshopify_host";
      if (header(headers, "x-shopid") || header(headers, "x-shopify-stage")) {
        return "shopify_header";
      }
      if (/shopify-section|Shopify\.analytics/i.test(html)) return "shopify_markup";
      return null;
    },
  },
  {
    platform: "woocommerce",
    weight: 0.92,
    test: ({ html }) => {
      if (/woocommerce/i.test(html) || /wp-content\/plugins\/woocommerce/i.test(html)) {
        return "woocommerce_assets";
      }
      if (/wc-block|woocommerce-page|is-woocommerce/i.test(html)) return "woocommerce_class";
      return null;
    },
  },
  {
    platform: "salla",
    weight: 0.99,
    test: ({ html, host }) => {
      if (/\.salla\.sa$/i.test(host) || /(^|\.)salla\.sa$/i.test(host) || host === "salla.sa") {
        return "salla_host";
      }
      if (/cdn\.salla\.sa|salla\.cloud|window\.salla/i.test(html)) return "salla_assets";
      if (/data-salla|salla-product/i.test(html)) return "salla_markup";
      return null;
    },
  },
  {
    platform: "zid",
    weight: 0.99,
    test: ({ html, host }) => {
      if (/\.zid\.store$/i.test(host) || /(^|\.)zid\.store$/i.test(host) || host === "zid.store") {
        return "zid_host";
      }
      if (/cdn\.zid\.store|zid\.sa|zid-app/i.test(html)) return "zid_assets";
      if (/data-zid|zid-theme/i.test(html)) return "zid_markup";
      return null;
    },
  },
  {
    platform: "magento",
    weight: 0.9,
    test: ({ html, headers }) => {
      if (/Magento_|mage\/cookies|static\/version\d+/i.test(html)) return "magento_assets";
      if (
        Object.keys(headers).some((k) => /x-magento/i.test(k)) ||
        header(headers, "x-magento-tags")
      ) {
        return "magento_header";
      }
      if (/mage-init|requirejs\/require\.js/i.test(html) && /catalog\/product/i.test(html)) {
        return "magento_requirejs";
      }
      return null;
    },
  },
  {
    platform: "bigcommerce",
    weight: 0.9,
    test: ({ html, host }) => {
      if (/mybigcommerce\.com/i.test(host)) return "bigcommerce_host";
      if (/cdn\.bcapp\.dev|bigcommerce\.com\/s-|stencil/i.test(html)) return "bigcommerce_assets";
      return null;
    },
  },
];

/**
 * Score platform signals from fetched homepage HTML + response headers.
 * Falls back to `custom` at low confidence when no known stack matches.
 */
export function detectEcommercePlatform(input: {
  url: string;
  html: string;
  headers?: Record<string, string>;
}): PlatformDetection {
  let host = "";
  try {
    host = new URL(input.url).hostname.toLowerCase();
  } catch {
    host = "";
  }

  const ctx: DetectionContext = {
    url: input.url,
    host,
    html: input.html.slice(0, 500_000),
    headers: input.headers ?? {},
  };

  const scores = new Map<DetectedPlatform, { score: number; signals: string[] }>();

  for (const detector of DETECTORS) {
    const signal = detector.test(ctx);
    if (!signal) continue;
    const prev = scores.get(detector.platform) ?? { score: 0, signals: [] };
    prev.score = Math.min(0.99, Math.max(prev.score, detector.weight));
    // Extra corroborating signals bump confidence slightly.
    if (prev.signals.length > 0) {
      prev.score = Math.min(0.99, prev.score + 0.03);
    }
    prev.signals.push(signal);
    scores.set(detector.platform, prev);
  }

  let best: { platform: DetectedPlatform; score: number; signals: string[] } | null = null;
  for (const [platform, entry] of scores) {
    if (!best || entry.score > best.score) {
      best = { platform, score: entry.score, signals: entry.signals };
    }
  }

  if (best && best.score >= 0.55) {
    return {
      platform: best.platform,
      confidence: Number(best.score.toFixed(3)),
      signals: best.signals,
    };
  }

  // Lightweight ecommerce heuristics → custom storefront.
  const looksLikeStore =
    /add to cart|add-to-cart|product|shop|checkout|cart/i.test(ctx.html) ||
    /og:type["']\s*content=["']product/i.test(ctx.html);

  if (looksLikeStore) {
    return {
      platform: "custom",
      confidence: 0.45,
      signals: ["ecommerce_heuristics"],
    };
  }

  return {
    platform: "other",
    confidence: 0.25,
    signals: ["no_strong_match"],
  };
}

export function extractHomepageTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) return "";
  return decodeHtmlEntities(
    match[1]
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim()
  ).slice(0, 300);
}

export function extractDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return "";
  }
}
