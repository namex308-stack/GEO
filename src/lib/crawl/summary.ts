import "server-only";
import type { ScoreBreakdown } from "@/lib/types";

export interface CrawlPageSummary {
  url: string;
  title: string;
  score: number;
}

export interface CrawlSummary {
  totalPages: number;
  pagesWithIssues: number;
  averageScore: number;
  bestPage: CrawlPageSummary | null;
  worstPage: CrawlPageSummary | null;
  pillarAverages: Record<string, number>;
}

export interface PageAnalysisResult {
  overallScore: number;
  breakdown: ScoreBreakdown[];
  geoReadability: { chatgpt: number; perplexity: number; googleAI: number };
  hasIssues: boolean;
}

const ISSUE_SCORE_THRESHOLD = 70;

export function pageHasIssues(score: number, breakdown: ScoreBreakdown[]): boolean {
  if (score < ISSUE_SCORE_THRESHOLD) return true;
  return breakdown.some((b) => b.score < ISSUE_SCORE_THRESHOLD);
}

export function buildCrawlSummary(
  pages: Array<{ url: string; title: string; score: number; breakdown: ScoreBreakdown[]; hasIssues: boolean }>
): CrawlSummary {
  if (pages.length === 0) {
    return {
      totalPages: 0,
      pagesWithIssues: 0,
      averageScore: 0,
      bestPage: null,
      worstPage: null,
      pillarAverages: {},
    };
  }

  const sorted = [...pages].sort((a, b) => b.score - a.score);
  const totalScore = pages.reduce((sum, p) => sum + p.score, 0);
  const pillarTotals: Record<string, { sum: number; count: number }> = {};

  for (const page of pages) {
    for (const b of page.breakdown) {
      if (!pillarTotals[b.pillar]) pillarTotals[b.pillar] = { sum: 0, count: 0 };
      pillarTotals[b.pillar].sum += b.score;
      pillarTotals[b.pillar].count += 1;
    }
  }

  const pillarAverages: Record<string, number> = {};
  for (const [pillar, { sum, count }] of Object.entries(pillarTotals)) {
    pillarAverages[pillar] = Math.round(sum / count);
  }

  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return {
    totalPages: pages.length,
    pagesWithIssues: pages.filter((p) => p.hasIssues).length,
    averageScore: Math.round(totalScore / pages.length),
    bestPage: best ? { url: best.url, title: best.title, score: best.score } : null,
    worstPage: worst ? { url: worst.url, title: worst.title, score: worst.score } : null,
    pillarAverages,
  };
}

export interface AuditComparison {
  scoreDelta: number;
  previousScore: number;
  currentScore: number;
  newIssues: string[];
  regressedPillars: string[];
  improvedPillars: string[];
}

export function compareAudits(
  previous: { overall_score: number | null; breakdown?: ScoreBreakdown[]; recommendations?: unknown[] },
  current: { overall_score: number | null; breakdown?: ScoreBreakdown[]; recommendations?: unknown[] }
): AuditComparison {
  const prevScore = previous.overall_score ?? 0;
  const currScore = current.overall_score ?? 0;
  const prevBreakdown = (previous.breakdown as ScoreBreakdown[]) ?? [];
  const currBreakdown = (current.breakdown as ScoreBreakdown[]) ?? [];

  const regressedPillars: string[] = [];
  const improvedPillars: string[] = [];

  for (const curr of currBreakdown) {
    const prev = prevBreakdown.find((b) => b.pillar === curr.pillar);
    if (!prev) continue;
    if (curr.score < prev.score - 2) regressedPillars.push(curr.label);
    if (curr.score > prev.score + 2) improvedPillars.push(curr.label);
  }

  const prevRecIds = new Set(
    ((previous.recommendations as Array<{ id?: string; problem?: string }>) ?? []).map((r) => r.id ?? r.problem)
  );
  const newIssues = ((current.recommendations as Array<{ id?: string; problem?: string; severity?: string }>) ?? [])
    .filter((r) => r.severity === "critical" || r.severity === "warning")
    .filter((r) => !prevRecIds.has(r.id ?? r.problem ?? ""))
    .map((r) => r.problem ?? "New issue detected")
    .slice(0, 5);

  return {
    scoreDelta: currScore - prevScore,
    previousScore: prevScore,
    currentScore: currScore,
    newIssues,
    regressedPillars,
    improvedPillars,
  };
}
