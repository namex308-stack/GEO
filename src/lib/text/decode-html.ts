/**
 * Decode common HTML entities in scraped titles / names for UI display.
 * Handles named entities and decimal/hex numeric character references.
 */

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

export function decodeHtmlEntities(input: string): string {
  if (!input || !input.includes("&")) return input;

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
