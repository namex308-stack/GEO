/**
 * Store URL reachability probe + platform detection for onboarding.
 */

import "server-only";

import { fetchSafePublicHttpUrl } from "@/lib/safe-http-fetch";
import { assertSafePublicHttpUrl } from "@/lib/url-safety";
import { normalizeStoreUrl } from "@/lib/onboarding/schema";
import {
  detectEcommercePlatform,
  extractDomainFromUrl,
  extractHomepageTitle,
  type DetectedPlatform,
} from "@/lib/onboarding/detect-platform";

const PROBE_TIMEOUT_MS = 15_000;
const MAX_HTML_BYTES = 1_500_000;

export type StoreProbeSuccess = {
  ok: true;
  storeUrl: string;
  domain: string;
  homepageTitle: string;
  platform: DetectedPlatform;
  confidence: number;
  signals: string[];
};

export type StoreProbeFailure = {
  ok: false;
  error: string;
  code: "invalid_url" | "blocked_url" | "unreachable" | "empty_response";
};

export type StoreProbeResult = StoreProbeSuccess | StoreProbeFailure;

const FRIENDLY_UNREACHABLE =
  "تعذّر الوصول إلى هذا الموقع. تحقق من الرابط وتأكد من أن المتجر متاح للعامة، ثم حاول مرة أخرى.";

/**
 * Validate format, fetch the homepage, detect platform, extract title + domain.
 */
export async function probeStoreUrl(rawUrl: string): Promise<StoreProbeResult> {
  const normalized = normalizeStoreUrl(rawUrl);
  if (!normalized) {
    return { ok: false, code: "invalid_url", error: "أدخل رابط متجر صالحًا." };
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return { ok: false, code: "invalid_url", error: "أدخل رابط متجر صالحًا." };
  }

  if (!parsed.hostname.includes(".")) {
    return {
      ok: false,
      code: "invalid_url",
      error: "أدخل رابط متجر كاملاً يتضمّن النطاق (مثال: https://shop.example.com).",
    };
  }

  const safe = await assertSafePublicHttpUrl(normalized);
  if (!safe.ok) {
    return { ok: false, code: "blocked_url", error: safe.reason };
  }

  try {
    const fetched = await fetchSafePublicHttpUrl(safe.href, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ConvAuditBot/1.0; +https://convaudit.com)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });

    if (!fetched.ok) {
      return {
        ok: false,
        code: fetched.blocked ? "blocked_url" : "unreachable",
        error: fetched.blocked ? fetched.reason : FRIENDLY_UNREACHABLE,
      };
    }

    const finalUrl = fetched.url || safe.href;
    const safeFinal = await assertSafePublicHttpUrl(finalUrl);
    if (!safeFinal.ok) {
      return { ok: false, code: "blocked_url", error: FRIENDLY_UNREACHABLE };
    }

    if (fetched.status < 200 || fetched.status >= 300) {
      return { ok: false, code: "unreachable", error: FRIENDLY_UNREACHABLE };
    }

    const htmlRaw = fetched.bodyText;
    if (!htmlRaw || htmlRaw.trim().length < 40) {
      return {
        ok: false,
        code: "empty_response",
        error: FRIENDLY_UNREACHABLE,
      };
    }

    const html = htmlRaw.slice(0, MAX_HTML_BYTES);
    const headerBag: Record<string, string> = {};
    fetched.headers.forEach((value, key) => {
      headerBag[key] = value;
    });

    const detection = detectEcommercePlatform({
      url: safeFinal.href,
      html,
      headers: headerBag,
    });

    return {
      ok: true,
      storeUrl: safeFinal.href,
      domain: extractDomainFromUrl(safeFinal.href),
      homepageTitle: extractHomepageTitle(html),
      platform: detection.platform,
      confidence: detection.confidence,
      signals: detection.signals,
    };
  } catch (err) {
    const timedOut =
      err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    console.error("[store-probe]", timedOut ? "timeout" : err);
    return {
      ok: false,
      code: "unreachable",
      error: timedOut
        ? "استغرق هذا الموقع وقتًا طويلاً للاستجابة. حاول مرة أخرى بعد قليل."
        : FRIENDLY_UNREACHABLE,
    };
  }
}
