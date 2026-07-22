import "server-only";
import type {
  AuditData,
  AuditEngineResultsPayload,
  CustomerEyeTest,
  Recommendation,
  ScrapedPage,
} from "./types";
import type { OnboardingAnswers } from "./types";
import { AI_GENERATED } from "./mock-data";
import { buildSnapshot } from "./engines/snapshot";
import { fetchSiteSignals } from "./engines/site-signals";
import { deriveGeoReadability } from "./engines/summary";
import { interpretResults } from "./ai/interpreter";
import { analyzeContentWithAI } from "./ai/content-analysis";
import { validateSnapshot } from "./engines/validation-engine";
import { buildExplainability } from "./engines/explainability-engine";
import { runScoringSystem } from "./engines/scoring-system";
import { buildInsights } from "./engines/insights-engine";
import { generateJson, isGeminiConfigured } from "./ai/client";

export { isGeminiConfigured };

export interface AuditContext {
  overallScore?: number;
  breakdown?: { pillar: string; score: number; label: string; summary?: string }[];
  recommendations?: Recommendation[];
  /** From Customer Eye Test — primary purchase blocker to fix in generated copy. */
  customerEyeBlocker?: string;
}

const CUSTOMER_EYE_FALLBACK: CustomerEyeTest = {
  confusionScore: 50,
  mainBlocker: "المعلومات غير واضحة بما يكفي لاتخاذ قرار الشراء الآن.",
  firstImpression: "صفحة منتج تحتاج توضيحاً أسرع للقيمة والثقة.",
  trustLevel: "mid",
  buyingIntent: "mid",
  topQuestion: "هل هذا المنتج مناسب لي وهل يستحق السعر؟",
};

function normalizeCustomerEyeTest(raw: Partial<CustomerEyeTest> | null | undefined): CustomerEyeTest {
  const level = (v: unknown): "low" | "mid" | "high" =>
    v === "low" || v === "mid" || v === "high" ? v : "mid";
  const score = typeof raw?.confusionScore === "number" ? raw.confusionScore : CUSTOMER_EYE_FALLBACK.confusionScore;
  return {
    confusionScore: Math.max(0, Math.min(100, Math.round(score))),
    mainBlocker: (raw?.mainBlocker || CUSTOMER_EYE_FALLBACK.mainBlocker).trim(),
    firstImpression: (raw?.firstImpression || CUSTOMER_EYE_FALLBACK.firstImpression).trim(),
    trustLevel: level(raw?.trustLevel),
    buyingIntent: level(raw?.buyingIntent),
    topQuestion: (raw?.topQuestion || CUSTOMER_EYE_FALLBACK.topQuestion).trim(),
  };
}

/**
 * Separate Gemini pass: Arabic-speaking first-time customer eye test.
 * Does not alter the main audit scoring pipeline.
 */
async function runCustomerEyeTest(
  scrapedContent: string,
  onboarding: OnboardingAnswers | null,
  productTitle: string
): Promise<CustomerEyeTest> {
  const productType = productTitle || onboarding?.primaryGoal || "منتج";
  const audience =
    [onboarding?.storeStage, onboarding?.challenge, onboarding?.trafficSource]
      .filter(Boolean)
      .join(" / ") || "زائر عام";

  const customerEyePrompt = `
You are an Arabic-speaking customer visiting
this product page for the first time.
You know nothing about this brand.
You have 3 seconds to decide if you stay or leave.

Page content: ${scrapedContent.slice(0, 8000)}
Product type: ${productType}
Target audience: ${audience}

Answer ONLY in Arabic. Be brutally honest.
Return valid JSON only, no markdown:

{
  "confusionScore": [0-100, higher = more confused],
  "mainBlocker": "[single sentence: what stops you buying RIGHT NOW]",
  "firstImpression": "[what you understood in 3 seconds]",
  "trustLevel": "[low|mid|high]",
  "buyingIntent": "[low|mid|high]",
  "topQuestion": "[the one question in your mind right now]"
}
`;

  const { data } = await generateJson<Partial<CustomerEyeTest>>(customerEyePrompt, CUSTOMER_EYE_FALLBACK);
  return normalizeCustomerEyeTest(data);
}

/**
 * Run a full audit: deterministic engines score the page,
 * then Gemini interprets results to generate recommendations.
 */
export async function runAudit(
  page: ScrapedPage,
  competitor: ScrapedPage | null,
  onboarding: OnboardingAnswers | null
): Promise<AuditData> {
  const siteSignals = await fetchSiteSignals(page.url);
  const snapshot = buildSnapshot(page.url, { markdown: page.markdown, html: page.html }, siteSignals);
  const validation = validateSnapshot(snapshot);

  const scoring = runScoringSystem(snapshot);

  const competitorSnapshot = competitor ? buildSnapshot(competitor.url, { markdown: competitor.markdown, html: competitor.html }) : null;
  const competitorScoring = competitorSnapshot ? runScoringSystem(competitorSnapshot) : null;

  const interpretation = await interpretResults(
    scoring.breakdown,
    page.markdown,
    competitorScoring?.breakdown,
    onboarding
  );

  const geoEngine = scoring.breakdown.find((e) => e.pillar === "geo");
  const geoReadability = geoEngine
    ? deriveGeoReadability(geoEngine)
    : { chatgpt: 0, perplexity: 0, googleAI: 0 };

  const breakdown = scoring.breakdown.map((e) => ({
    pillar: e.pillar,
    score: e.score,
    max: e.maxScore,
    label: e.label,
    summary: interpretation.pillarSummaries[e.pillar] ?? e.summary,
  }));

  const competitorBreakdown = competitorScoring?.breakdown?.map((e) => ({
    pillar: e.pillar,
    score: e.score,
    max: e.maxScore,
    label: e.label,
    summary: e.summary,
  }));

  const explainability = buildExplainability(scoring.breakdown);
  const insights = buildInsights(scoring.categoryResults);
  const contentAnalysis = await analyzeContentWithAI(page.markdown);

  // Separate pass after main audit — does not change scoring/recommendations.
  const customerEyeTest = await runCustomerEyeTest(
    page.markdown,
    onboarding,
    page.title || "Untitled product"
  );

  const engineResults: AuditEngineResultsPayload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    aiEnhanced: interpretation.aiEnhanced,
    engines: {
      overallScore: scoring.overallScore,
      breakdown: scoring.breakdown,
      competitorScore: competitorScoring?.overallScore,
      competitorBreakdown: competitorScoring?.breakdown,
    },
    categories: scoring.categoryResults,
    validation,
    explainability,
    contentAnalysis,
    insights,
    geoReadability,
    interpretation: {
      pillarSummaries: interpretation.pillarSummaries,
      compareGaps: interpretation.compareGaps,
    },
    customerEyeTest,
  };

  return {
    productUrl: page.url,
    productName: page.title || "Untitled product",
    storeName: extractStoreName(page.url),
    competitorUrl: competitor?.url,
    competitorScore: competitorScoring?.overallScore ?? undefined,
    overallScore: scoring.overallScore,
    breakdown,
    competitorBreakdown,
    geoReadability,
    recommendations: interpretation.recommendations,
    aiEnhanced: interpretation.aiEnhanced,
    engineResults,
    customerEyeTest,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generate AI copy informed by audit findings. Falls back to sample if Gemini isn't configured.
 */
export async function generateContent(
  page: ScrapedPage,
  auditContext?: AuditContext
): Promise<{ content: typeof AI_GENERATED; aiEnhanced: boolean }> {
  if (!isGeminiConfigured()) return { content: AI_GENERATED, aiEnhanced: false };

  const eyeBlocker = auditContext?.customerEyeBlocker?.trim();
  const auditBlock = auditContext
    ? `
## Audit Intelligence (use these gaps to drive copy improvements)
Overall score: ${auditContext.overallScore ?? "N/A"}/100
Pillar scores: ${(auditContext.breakdown ?? []).map((b) => `${b.label}: ${b.score}/100`).join(", ") || "N/A"}
Priority fixes from audit:
${(auditContext.recommendations ?? [])
  .slice(0, 6)
  .map((r, i) => `${i + 1}. [${r.severity}/${r.pillar}] ${r.problem} → ${r.solution}`)
  .join("\n") || "None provided"}
${eyeBlocker ? `\n## Customer Eye Test — primary purchase blocker (fix this first)\n${eyeBlocker}\nWrite copy that directly removes this blocker for an Arabic-speaking first-time visitor.` : ""}`
    : "";

  const prompt = `You are a senior e-commerce growth strategist and conversion copywriter for convaudit.
Write production-ready, professional copy that fixes audit gaps and maximizes conversion, SEO, and GEO (AI search) visibility.

Product: ${page.title}
URL: ${page.url}
${auditBlock}

Page content (excerpt):
${page.markdown.slice(0, 6000)}

Requirements:
- Title: benefit-led, includes primary keyword, max 70 chars, no clickbait
- Description: 180–280 words, markdown with H2 subhead, bullet list of benefits, objection handling, clear CTA
- FAQ: 5 items targeting buyer objections and GEO/AI extractability (concise, factual answers)
- Meta description: 150–160 chars, includes primary keyword + value prop
- Ad copy: platform-native tone for Meta/Instagram, TikTok, and Google Search

- Alt text: 3–5 descriptive alt strings for product images (SEO + accessibility)
- JSON-LD is generated separately — focus on copy fields

Return ONLY valid JSON:
{
  "title": "string",
  "description": "string (markdown)",
  "faq": [{ "q": "string", "a": "string" }],
  "metaDescription": "string",
  "altTexts": ["string", "string"],
  "adCopy": [
    { "platform": "Meta / Instagram", "headline": "string", "body": "string", "cta": "string" },
    { "platform": "TikTok", "headline": "string", "body": "string", "cta": "string" },
    { "platform": "Google Search", "headline": "string", "body": "string", "cta": "string" }
  ]
}`;

  const { data, aiEnhanced } = await generateJson(prompt, AI_GENERATED);
  return { content: data, aiEnhanced };
}

function extractStoreName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").split(".")[0].replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "Your Store";
  }
}
