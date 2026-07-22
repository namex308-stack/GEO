import "server-only";
import type { EngineResult } from "@/lib/engines/types";
import type { OnboardingAnswers, Recommendation } from "@/lib/types";
import { generateJson } from "@/lib/ai/client";
import { buildDeterministicInterpretation } from "@/lib/engines/recommendation-engine";

export interface InterpretResult {
  recommendations: Recommendation[];
  pillarSummaries: Record<string, string>;
  compareGaps?: { pillar: string; delta: number; narrative: string }[];
  aiEnhanced: boolean;
}

export async function interpretResults(
  engineResults: EngineResult[],
  pageMarkdown: string,
  competitorResults?: EngineResult[],
  onboarding?: OnboardingAnswers | null
): Promise<InterpretResult> {
  const rulesSummary = engineResults.map((e) => ({
    pillar: e.pillar,
    label: e.label,
    score: e.score,
    maxScore: e.maxScore,
    engineSummary: e.summary,
    failedRules: e.rules
      .filter((r) => !r.passed)
      .map((r) => ({
        id: r.id,
        label: r.label,
        score: r.score,
        maxScore: r.maxScore,
        detail: r.detail,
        pointsLost: r.maxScore - r.score,
      })),
    partialRules: e.rules
      .filter((r) => r.passed && r.score < r.maxScore)
      .map((r) => ({ label: r.label, score: r.score, maxScore: r.maxScore, detail: r.detail })),
  }));

  const onboardingBlock = onboarding
    ? `## Merchant Context
Platform: ${onboarding.platform}
Store stage: ${onboarding.storeStage}
Main challenge: ${onboarding.challenge}
Primary goal: ${onboarding.primaryGoal}
Price range: ${onboarding.priceRange}
Traffic source: ${onboarding.trafficSource}
Tailor recommendations to this merchant's stage, goal, and platform.`
    : "";

  const prompt = `You are convaudit — a senior e-commerce CRO, SEO, and GEO consultant producing executive-grade audit reports for Shopify, WooCommerce, Salla, and Zid stores.

Scores are pre-computed by deterministic engines. Do NOT invent or change numeric scores. Your job is expert interpretation: diagnose root causes, quantify business impact, and prescribe specific fixes.

## Engine Results (deterministic)
${JSON.stringify(rulesSummary, null, 2)}

## Product Page Content
${pageMarkdown.slice(0, 8000)}

${competitorResults ? `## Competitor Scores\n${JSON.stringify(competitorResults.map((e) => ({ pillar: e.pillar, label: e.label, score: e.score })), null, 2)}` : ""}

${onboardingBlock}

Produce a professional audit interpretation. Each recommendation must:
- Reference a specific failed or partial rule by name
- State the business impact (conversion, discoverability, AI visibility, or trust)
- Give an actionable fix a store owner can implement this week (not vague advice)
- Include estimated effort: quick (<1h), medium (half day), involved (multi-day)

Return ONLY valid JSON:
{
  "recommendations": [
    {
      "id": "r1",
      "pillar": "conversion" | "seo" | "geo" | "trust",
      "severity": "critical" | "warning" | "opportunity",
      "impact": "high" | "medium" | "low",
      "effort": "quick" | "medium" | "involved",
      "problem": "Specific, evidence-based problem (reference page content or rule)",
      "why": "Why this hurts conversion, SEO, GEO visibility, or trust — business impact",
      "solution": "Concrete fix with implementation steps"
    }
  ],
  "pillarSummaries": {
    "conversion": "2-3 sentence executive summary with score context and top priority",
    "seo": "2-3 sentence executive summary",
    "geo": "2-3 sentence executive summary covering AI visibility (ChatGPT, Perplexity, Google AI)",
    "trust": "2-3 sentence executive summary"
  }${competitorResults ? `,
  "compareGaps": [
    { "pillar": "Conversion|SEO|GEO / AI Visibility|Trust", "delta": number, "narrative": "Specific competitive gap analysis" }
  ]` : ""}
}

Generate 8-12 recommendations sorted by business impact. Use professional, direct language — no filler.`;

  const fallback = buildFallbackInterpretation(engineResults, competitorResults);
  const { data, aiEnhanced } = await generateJson(prompt, fallback);
  return { ...data, aiEnhanced };
}

function buildFallbackInterpretation(
  results: EngineResult[],
  competitorResults?: EngineResult[]
): InterpretResult {
  const { recommendations, pillarSummaries } = buildDeterministicInterpretation(results);

  const compareGaps = competitorResults
    ? results.map((r) => {
        const comp = competitorResults.find((c) => c.pillar === r.pillar);
        const delta = r.score - (comp?.score ?? 0);
        return {
          pillar: r.label,
          delta,
          narrative:
            delta > 5
              ? `You lead in ${r.label} by ${delta} points — protect this advantage with continued optimization.`
              : delta < -5
                ? `Competitor outperforms you in ${r.label} by ${Math.abs(delta)} points. Prioritize the failed rules in this pillar.`
                : `${r.label} is competitive (${delta >= 0 ? "+" : ""}${delta} vs competitor). Small improvements can create separation.`,
        };
      })
    : undefined;

  return { recommendations, pillarSummaries, compareGaps, aiEnhanced: false };
}
