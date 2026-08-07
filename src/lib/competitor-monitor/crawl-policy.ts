/**
 * Competitor monitoring must not continuously crawl in development.
 * Production scheduled jobs opt in via NODE_ENV=production.
 * Local/manual runs require COMPETITOR_MONITOR_ALLOW_CRAWL=true.
 */
export function isCompetitorCrawlAllowed(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if (env.COMPETITOR_MONITOR_ALLOW_CRAWL === "true") return true;
  if (env.COMPETITOR_MONITOR_ALLOW_CRAWL === "false") return false;
  return env.NODE_ENV === "production";
}
