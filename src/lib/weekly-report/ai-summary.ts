import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiModelId, isGeminiConfigured } from "@/lib/gemini";
import { buildDeterministicAiSummary } from "./build";
import type { WeeklyReportPayload } from "./types";

function getClient(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenerativeAI(key);
}

/**
 * Short Arabic AI executive narrative. Falls back to deterministic prose
 * when Gemini is unavailable or returns unusable text.
 */
export async function generateAiExecutiveSummary(
  draft: Omit<WeeklyReportPayload, "aiExecutiveSummary"> & {
    aiExecutiveSummary?: string;
  }
): Promise<string> {
  const fallback = buildDeterministicAiSummary({
    storeName: draft.storeName,
    executiveSummary: draft.executiveSummary,
    overall: draft.overallScoreChange,
    geo: draft.geoScoreChange,
    seo: draft.seoScoreChange,
    trust: draft.trustScoreChange,
    conversion: draft.conversionScoreChange,
    newIssueCount: draft.newIssues.length,
    resolvedIssueCount: draft.resolvedIssues.length,
    topActions: draft.highestPriorityActions,
  });

  if (!isGeminiConfigured()) return fallback;

  const client = getClient();
  if (!client) return fallback;

  const model = client.getGenerativeModel({ model: getGeminiModelId() });
  const prompt = `أنت مستشار نمو لمتجر إلكتروني. اكتب فقرة تنفيذية قصيرة بالعربية الفصحى (3–5 جمل) لتقرير أسبوعي.
ركّز فقط على التغييرات ذات المعنى. لا تكرر توصيات لم تتغير.
لا تستخدم نقاطاً ولا عناوين. لا تخترع أرقاماً غير موجودة.

بيانات التقرير:
- المتجر: ${draft.storeName}
- الدرجة الإجمالية: ${draft.overallScoreChange.current} (Δ ${draft.overallScoreChange.delta})
- GEO: ${draft.geoScoreChange.current} (Δ ${draft.geoScoreChange.delta})
- SEO: ${draft.seoScoreChange.current} (Δ ${draft.seoScoreChange.delta})
- الثقة: ${draft.trustScoreChange.current} (Δ ${draft.trustScoreChange.delta})
- التحويل: ${draft.conversionScoreChange.current} (Δ ${draft.conversionScoreChange.delta})
- مشاكل جديدة: ${draft.newIssues.length}
- مشاكل محلولة: ${draft.resolvedIssues.length}
- أولويات: ${draft.highestPriorityActions.map((a) => a.problem).join(" | ") || "لا شيء"}
- ملخص جاهز: ${draft.executiveSummary.headline}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text()?.trim();
    if (!text || text.length < 40) return fallback;
    return text.slice(0, 1200);
  } catch (err) {
    console.error(
      "[weekly-report] AI summary failed:",
      err instanceof Error ? err.message : err
    );
    return fallback;
  }
}
