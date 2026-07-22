import "server-only";
import { runEngines } from "@/lib/engines/orchestrator";
import { fetchSiteSignals } from "@/lib/engines/site-signals";
import { deriveGeoReadability } from "@/lib/engines/summary";
import type { ScrapedPage, ScoreBreakdown } from "@/lib/types";
import { pageHasIssues, type PageAnalysisResult } from "./summary";

export async function analyzePage(page: ScrapedPage, siteSignals?: Awaited<ReturnType<typeof fetchSiteSignals>>): Promise<PageAnalysisResult> {
  const signals = siteSignals ?? (await fetchSiteSignals(page.url));
  const engineResult = runEngines(
    page.url,
    { markdown: page.markdown, html: page.html },
    undefined,
    null,
    signals
  );

  const geoEngine = engineResult.breakdown.find((e) => e.pillar === "geo");
  const geoReadability = geoEngine
    ? deriveGeoReadability(geoEngine)
    : { chatgpt: 0, perplexity: 0, googleAI: 0 };

  const breakdown: ScoreBreakdown[] = engineResult.breakdown.map((e) => ({
    pillar: e.pillar,
    score: e.score,
    max: e.maxScore,
    label: e.label,
    summary: e.summary,
  }));

  const overallScore = engineResult.overallScore;
  const hasIssues = pageHasIssues(overallScore, breakdown);

  return { overallScore, breakdown, geoReadability, hasIssues };
}
