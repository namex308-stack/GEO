import type { NormalizedPage } from "@/lib/db/types";
import {
  scoreConversionModule,
  scoreGeoModule,
  scoreSeoModule,
  scoreTrustModule,
} from "@/lib/audit/score-modules";
import type {
  CompetitorFaqItem,
  CompetitorScoresPayload,
  CompetitorSignals,
} from "./types";

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[^\d.,-]/g, "").replace(/,/g, "");
  if (!cleaned) return null;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseReviewCount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }
  if (typeof value !== "string") return null;
  const match = value.replace(/,/g, "").match(/(\d+)/);
  if (!match) return null;
  return Number.parseInt(match[1]!, 10);
}

function normalizeFaq(raw: unknown): CompetitorFaqItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CompetitorFaqItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const q = asString((item as { q?: unknown }).q) ?? asString((item as { question?: unknown }).question);
    const a = asString((item as { a?: unknown }).a) ?? asString((item as { answer?: unknown }).answer);
    if (!q) continue;
    out.push({ q, a: a ?? "" });
  }
  return out.slice(0, 40);
}

export function faqKey(item: CompetitorFaqItem): string {
  return item.q
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function schemaFingerprint(types: string[], schema: unknown): string {
  const typeKey = [...types].map((t) => t.toLowerCase()).sort().join("|");
  let schemaKey = "";
  try {
    schemaKey = JSON.stringify(schema ?? []).slice(0, 400);
  } catch {
    schemaKey = "";
  }
  return `${typeKey}::${schemaKey}`;
}

function hasTrustSignals(page: NormalizedPage, rating: string | null, reviews: number | null): boolean {
  const hay = `${page.markdown}\n${page.description}\n${JSON.stringify(page.structuredData ?? {})}`;
  const policy = /return|refund|shipping|warranty|إرجاع|استبدال|شحن|ضمان|سياسة/i.test(hay);
  const payments = /mada|tabby|tamara|apple\s*pay|cod|مدى|تابي|تمارا|الدفع\s*عند\s*الاستلام/i.test(hay);
  return Boolean(rating || (reviews != null && reviews > 0) || policy || payments);
}

export function parsePriceValue(priceRaw: string | null): number | null {
  return asNumber(priceRaw);
}

/**
 * Extract monitorable competitor signals from a NormalizedPage.
 * Pure — safe for unit tests without network.
 */
export function extractCompetitorSignals(page: NormalizedPage): {
  signals: CompetitorSignals;
  scores: CompetitorScoresPayload;
} {
  const sd = page.structuredData ?? {};
  const priceRaw = asString(sd.price);
  const rating = asString(sd.rating);
  const reviewCount = parseReviewCount(sd.reviews);
  const faq = normalizeFaq(sd.faq);
  const schemaTypes = Array.isArray(sd.jsonLdTypes)
    ? sd.jsonLdTypes.filter((t): t is string => typeof t === "string").slice(0, 24)
    : [];

  const conversion = scoreConversionModule(page);
  const seo = scoreSeoModule(page);
  const geo = scoreGeoModule(page);
  const trust = scoreTrustModule(page);
  const overall = Math.round(
    (conversion.score + seo.score + geo.score + trust.score) / 4
  );

  const scores: CompetitorScoresPayload = {
    overall,
    conversion: conversion.score,
    seo: seo.score,
    geo: geo.score,
    trust: trust.score,
    summaries: {
      conversion: conversion.summary,
      seo: seo.summary,
      geo: geo.summary,
      trust: trust.summary,
    },
  };

  const signals: CompetitorSignals = {
    title: page.title?.trim() || "",
    description: page.description?.trim() || "",
    priceRaw,
    priceValue: parsePriceValue(priceRaw),
    currency: asString((sd.openGraph as Record<string, unknown> | undefined)?.["og:price:currency"])
      ?? asString((sd.metadata as Record<string, unknown> | undefined)?.["product:price:currency"]),
    rating,
    reviewCount,
    faq,
    faqKeys: faq.map(faqKey).filter(Boolean),
    schemaTypes,
    schemaFingerprint: schemaFingerprint(schemaTypes, sd.schema),
    trustScore: trust.score,
    seoScore: seo.score,
    geoScore: geo.score,
    conversionScore: conversion.score,
    overallScore: overall,
    contentHash: page.contentHash || "",
    hasTrustSignals: hasTrustSignals(page, rating, reviewCount),
  };

  return { signals, scores };
}
