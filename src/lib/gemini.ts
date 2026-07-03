import "server-only";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AuditData, OnboardingAnswers } from "./types";
import { SAMPLE_AUDIT, AI_GENERATED } from "./mock-data";

let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!_client) _client = new GoogleGenerativeAI(key);
  return _client;
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export interface ScrapedPage {
  url: string;
  title: string;
  description: string;
  markdown: string;
  html?: string;
  images?: string[];
}

/**
 * Run a full audit on a scraped product page using Gemini.
 * Falls back to the sample audit if Gemini isn't configured.
 */
export async function runAudit(
  page: ScrapedPage,
  competitor: ScrapedPage | null,
  onboarding: OnboardingAnswers | null
): Promise<AuditData> {
  const client = getClient();
  if (!client) {
    // Demo mode — return the sample audit personalized with the URL.
    return {
      ...SAMPLE_AUDIT,
      productUrl: page.url,
      productName: page.title || SAMPLE_AUDIT.productName,
      createdAt: new Date().toISOString(),
    };
  }

  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = buildAuditPrompt(page, competitor, onboarding);

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    return normalizeAudit(parsed, page, competitor);
  } catch (err) {
    console.error("[gemini] audit failed, falling back to sample:", err);
    return {
      ...SAMPLE_AUDIT,
      productUrl: page.url,
      productName: page.title || SAMPLE_AUDIT.productName,
      createdAt: new Date().toISOString(),
    };
  }
}

function buildAuditPrompt(
  page: ScrapedPage,
  competitor: ScrapedPage | null,
  onboarding: OnboardingAnswers | null
): string {
  return `You are StorePulse AI, an expert e-commerce auditor. Analyze the product page below and return a JSON audit.

# Product page
URL: ${page.url}
Title: ${page.title}
Description: ${page.description}
Content (markdown):
${page.markdown.slice(0, 8000)}

${competitor ? `# Competitor page\nURL: ${competitor.url}\nTitle: ${competitor.title}\nContent:\n${competitor.markdown.slice(0, 4000)}` : "No competitor provided."}

${onboarding ? `# User context\nPlatform: ${onboarding.platform}\nMain challenge: ${onboarding.challenge}\nPrice range: ${onboarding.priceRange}\nAudience: ${onboarding.audience}` : ""}

Score the page across four pillars (0-100 each):
- conversion: title, description, images, price, CTA, persuasion
- seo: meta, keywords, schema, structure
- geo: can ChatGPT/Perplexity/Google AI understand & recommend it?
- trust: policies, shipping, returns, reviews, UX

Return ONLY valid JSON in this exact shape:
{
  "overallScore": number,
  "breakdown": [
    { "pillar": "conversion", "score": number, "label": "Conversion", "summary": "string" },
    { "pillar": "seo", "score": number, "label": "SEO", "summary": "string" },
    { "pillar": "geo", "score": number, "label": "GEO / AI Visibility", "summary": "string" },
    { "pillar": "trust", "score": number, "label": "Trust", "summary": "string" }
  ],
  "competitorScore": number | null,
  "competitorBreakdown": [ same shape as breakdown ] | null,
  "geoReadability": { "chatgpt": number, "perplexity": number, "googleAI": number },
  "recommendations": [
    {
      "id": "r1",
      "pillar": "conversion" | "seo" | "geo" | "trust",
      "severity": "critical" | "warning" | "opportunity",
      "impact": "high" | "medium" | "low",
      "problem": "string",
      "solution": "string"
    }
  ]
}

Return 6-10 recommendations prioritized by impact. Be specific and actionable.`;
}

function normalizeAudit(parsed: any, page: ScrapedPage, competitor: ScrapedPage | null): AuditData {
  return {
    productUrl: page.url,
    productName: page.title || "Untitled product",
    storeName: extractStoreName(page.url),
    competitorUrl: competitor?.url,
    competitorScore: parsed.competitorScore ?? undefined,
    overallScore: parsed.overallScore ?? 75,
    breakdown: parsed.breakdown ?? SAMPLE_AUDIT.breakdown,
    competitorBreakdown: parsed.competitorBreakdown ?? undefined,
    geoReadability: parsed.geoReadability ?? SAMPLE_AUDIT.geoReadability,
    recommendations: (parsed.recommendations ?? []).map((r: any, i: number) => ({
      id: r.id ?? `r${i + 1}`,
      pillar: r.pillar,
      severity: r.severity,
      impact: r.impact,
      problem: r.problem,
      solution: r.solution,
    })),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generate AI copy (title, description, FAQ, meta, ads) for a product.
 * Falls back to sample copy if Gemini isn't configured.
 */
export async function generateContent(page: ScrapedPage): Promise<typeof AI_GENERATED> {
  const client = getClient();
  if (!client) return AI_GENERATED;

  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `You are an e-commerce copywriter. Generate optimized copy for this product page. Return ONLY JSON.

Product: ${page.title}
URL: ${page.url}
Content:
${page.markdown.slice(0, 4000)}

Return JSON:
{
  "title": "SEO + GEO optimized product title (max 70 chars)",
  "description": "Benefit-led markdown description, 150-250 words, with a short bullet list",
  "faq": [ { "q": "string", "a": "string" } x5 ],
  "metaDescription": "155 char meta description",
  "adCopy": [
    { "platform": "Meta / Instagram", "headline": "string", "body": "string", "cta": "string" },
    { "platform": "TikTok", "headline": "string", "body": "string", "cta": "string" },
    { "platform": "Google Search", "headline": "string", "body": "string", "cta": "string" }
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (err) {
    console.error("[gemini] generateContent failed:", err);
    return AI_GENERATED;
  }
}

function extractStoreName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").split(".")[0].replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "Your Store";
  }
}
