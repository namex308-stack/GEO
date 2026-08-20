/**
 * Decode common HTML entities in scraped titles / names for UI display.
 * Handles named entities and decimal/hex numeric character references.
 */

import type { AuditData } from "@/lib/types";

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  trade: "™",
  reg: "®",
  copy: "©",
};

function decodeOnce(input: string): string {
  return input
    .replace(/&([a-zA-Z]+);/g, (match, name: string) => {
      const decoded = NAMED[name.toLowerCase()];
      return decoded ?? match;
    })
    .replace(/&#(\d+);/g, (match, code: string) => {
      const n = Number(code);
      return Number.isFinite(n) && n >= 0 && n <= 0x10ffff
        ? String.fromCodePoint(n)
        : match;
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex: string) => {
      const n = Number.parseInt(hex, 16);
      return Number.isFinite(n) && n >= 0 && n <= 0x10ffff
        ? String.fromCodePoint(n)
        : match;
    });
}

export function decodeHtmlEntities(input: string): string {
  if (!input || !input.includes("&")) return input;

  // A second pass handles double-escaped titles such as `&amp;amp;`.
  let current = decodeOnce(input);
  if (current.includes("&")) {
    const nested = decodeOnce(current);
    if (nested !== current) current = nested;
  }
  return current;
}

/** Decode merchant-facing names/titles stored on an audit payload. */
export function decodeAuditDisplayFields(audit: AuditData): AuditData {
  return {
    ...audit,
    productName: decodeHtmlEntities(audit.productName),
    storeName: decodeHtmlEntities(audit.storeName),
    pageSignals: audit.pageSignals
      ? {
          ...audit.pageSignals,
          pageTitle: audit.pageSignals.pageTitle
            ? decodeHtmlEntities(audit.pageSignals.pageTitle)
            : audit.pageSignals.pageTitle,
        }
      : audit.pageSignals,
    generatedContent: audit.generatedContent
      ? {
          ...audit.generatedContent,
          title: decodeHtmlEntities(audit.generatedContent.title),
        }
      : audit.generatedContent,
  };
}
