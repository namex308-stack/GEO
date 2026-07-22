import "server-only";
import { generateJson, isGeminiConfigured } from "@/lib/ai/client";

export interface ContentAnalysisResult {
  score: number;
  confidence: number;
  strengths: string[];
  gaps: string[];
  evidence: string[];
  aiEnhanced: boolean;
}

const FALLBACK: ContentAnalysisResult = {
  score: 50,
  confidence: 0.3,
  strengths: [],
  gaps: ["AI content analysis is unavailable (Gemini not configured or request failed)."],
  evidence: [],
  aiEnhanced: false,
};

export async function analyzeContentWithAI(markdown: string): Promise<ContentAnalysisResult> {
  if (!isGeminiConfigured()) return FALLBACK;

  const prompt = `You are a strict content quality evaluator for an e-commerce product page.
Return a JSON-only assessment focused on clarity, credibility, and extractability for AI search.

Content:
${markdown.slice(0, 9000)}

Return ONLY valid JSON:
{
  "score": 0-100,
  "confidence": 0-1,
  "strengths": ["..."],
  "gaps": ["..."],
  "evidence": ["..."]
}`;

  const { data, aiEnhanced } = await generateJson(prompt, FALLBACK);
  return { ...data, aiEnhanced };
}

