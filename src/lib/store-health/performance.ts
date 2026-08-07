/**
 * Presentation-only performance proxy from existing crawl timing.
 * Does not invent a new scoring engine or re-run pillar modules.
 */
export function performanceScoreFromCrawlMs(crawlMs: number | null | undefined): number | null {
  if (crawlMs == null || !Number.isFinite(crawlMs) || crawlMs < 0) return null;
  if (crawlMs < 3_000) return 95;
  if (crawlMs < 8_000) return 80;
  if (crawlMs < 15_000) return 60;
  if (crawlMs < 30_000) return 45;
  return 30;
}
