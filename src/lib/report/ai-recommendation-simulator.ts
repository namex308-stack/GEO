import { prioritizeRecommendations } from "@/lib/ai/recommendations";
import type { AuditData, Recommendation, ScorePillar } from "@/lib/types";

export type PromptIntent = "recommend" | "best_store" | "trust" | "general";

export type SimulatedAiResponse = {
  intent: PromptIntent;
  answer: string;
  confidence: number;
  reasons: string[];
  improvements: string[];
  fixFirst: string;
};

const EXAMPLE_PROMPTS = [
  "هل تنصح بهذا المتجر؟",
  "ما أفضل متجر لشراء هذا المنتج؟",
  "هل هذا المتجر موثوق؟",
] as const;

export const AI_SIMULATOR_EXAMPLE_PROMPTS: readonly string[] = EXAMPLE_PROMPTS;

function clamp(n: number, min = 0, max = 100): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function pillarScore(audit: AuditData, pillar: ScorePillar): number {
  return clamp(audit.breakdown.find((b) => b.pillar === pillar)?.score ?? 0);
}

function avgGeoReadability(audit: AuditData): number {
  const { chatgpt, perplexity, googleAI } = audit.geoReadability;
  return clamp((chatgpt + perplexity + googleAI) / 3);
}

function storeLabel(audit: AuditData): string {
  return audit.storeName?.trim() || audit.productName?.trim() || "هذا المتجر";
}

function productLabel(audit: AuditData): string {
  return audit.productName?.trim() || "هذا المنتج";
}

function topStrengths(audit: AuditData, limit = 2): string[] {
  return [...audit.breakdown]
    .sort((a, b) => b.score - a.score)
    .filter((b) => b.summary?.trim() && b.score >= 55)
    .slice(0, limit)
    .map((b) => b.summary.trim());
}

function topIssues(audit: AuditData, limit = 3): Recommendation[] {
  return prioritizeRecommendations(audit.recommendations).slice(0, limit);
}

export function detectPromptIntent(prompt: string): PromptIntent {
  const p = prompt.trim();
  if (!p) return "general";
  if (/موثوق|ثقة|آمن|احتيال|نصب/.test(p)) return "trust";
  if (/أفضل متجر|أفضل مكان|أين أشتري|وين أشتري/.test(p)) return "best_store";
  if (/تنصح|توصي|توصية|أنصح|ينصح/.test(p)) return "recommend";
  return "general";
}

function confidenceFor(
  audit: AuditData,
  intent: PromptIntent,
  criticalCount: number
): number {
  const overall = clamp(audit.overallScore);
  const trust = pillarScore(audit, "trust");
  const geo = clamp(audit.geoAnalysis?.score ?? avgGeoReadability(audit));
  const conversion = pillarScore(audit, "conversion");
  const seo = pillarScore(audit, "seo");

  let base: number;
  switch (intent) {
    case "trust":
      base = trust * 0.55 + overall * 0.25 + geo * 0.2;
      break;
    case "best_store":
      base = conversion * 0.35 + seo * 0.25 + geo * 0.25 + trust * 0.15;
      break;
    case "recommend":
      base = overall * 0.4 + conversion * 0.25 + trust * 0.2 + geo * 0.15;
      break;
    case "general":
      base = overall * 0.45 + geo * 0.35 + trust * 0.2;
      break;
    default: {
      const _exhaustive: never = intent;
      return _exhaustive;
    }
  }

  // High confidence only when signals are strong and critical gaps are few.
  const penalty = Math.min(28, criticalCount * 8);
  const geoBoost = geo >= 70 ? 4 : geo < 45 ? -6 : 0;
  return clamp(base - penalty + geoBoost);
}

function buildAnswer(audit: AuditData, intent: PromptIntent, confidence: number): string {
  const store = storeLabel(audit);
  const product = productLabel(audit);
  const overall = clamp(audit.overallScore);
  const trust = pillarScore(audit, "trust");
  const conversion = pillarScore(audit, "conversion");
  const geo = clamp(audit.geoAnalysis?.score ?? avgGeoReadability(audit));
  const strengths = topStrengths(audit, 2);
  const issues = topIssues(audit, 2);
  const strengthText =
    strengths.length > 0
      ? ` من الإشارات الإيجابية: ${strengths.join("؛ ")}.`
      : "";
  const issueText =
    issues.length > 0
      ? ` في المقابل تظهر فجوات مثل: ${issues.map((i) => i.problem).join("؛ ")}.`
      : "";

  switch (intent) {
    case "recommend": {
      if (confidence >= 72 && overall >= 70) {
        return `نعم، يمكن التوصية بـ«${store}» لشراء «${product}» بدرجة ثقة جيدة. درجة المتجر الحالية ${overall}/100، مع إشارات تحويل وثقة داعمة.${strengthText}${issueText ? ` مع ذلك يُفضَّل مراعاة: ${issues.map((i) => i.problem).join("؛ ")}.` : ""}`;
      }
      if (confidence >= 50) {
        return `توصية مشروطة لـ«${store}». الأداء العام (${overall}/100) مقبول لكنه غير مكتمل للمساعدات الذكية.${strengthText}${issueText} أنصح بالتحقق من السعر والسياسات قبل الشراء.`;
      }
      return `لا أنصح حالياً بالاعتماد على «${store}» دون تحقق إضافي. الإشارات المتاحة ضعيفة نسبياً (درجة ${overall}/100)، وظهور المتجر في إجابات AI محدود.${issueText || " تحتاج صفحة المنتج إلى إشارات أوضح للثقة والتحويل."}`;
    }
    case "best_store": {
      if (confidence >= 70 && conversion >= 65) {
        return `من بين الخيارات المتاحة، يبدو «${store}» خياراً قوياً لشراء «${product}» بفضل وضوح عرض المنتج وإشارات التحويل (درجة التحويل ${conversion}/100).${strengthText}`;
      }
      if (confidence >= 48) {
        return `«${store}» قد يكون مناسباً لشراء «${product}»، لكنه ليس الخيار الأوضح بعد لمحركات AI. درجة التحويل ${conversion}/100 وSEO ${pillarScore(audit, "seo")}/100.${issueText} قارن السعر والسياسات مع متجر بديل قبل القرار.`;
      }
      return `بناءً على الإشارات الحالية، لا يظهر «${store}» كأفضل متجر واضح لـ«${product}». الفجوات في التحويل أو الثقة أو البنية تقلل فرصة ترشيحه.${issueText}`;
    }
    case "trust": {
      if (confidence >= 72 && trust >= 70) {
        return `نعم، تبدو إشارات الثقة في «${store}» قوية نسبياً (درجة الثقة ${trust}/100)، مما يدعم اعتباره موثوقاً لشراء «${product}».${strengthText}`;
      }
      if (confidence >= 48) {
        return `الثقة في «${store}» متوسطة (درجة ${trust}/100). توجد إشارات إيجابية، لكن نقصاً في بعض عناصر الطمأنة التي تعتمد عليها المساعدات الذكية.${issueText}`;
      }
      return `لا يمكن الجزم بأن «${store}» موثوق من منظور AI حالياً. درجة الثقة ${trust}/100، مع غياب أو ضعف إشارات مهمة للسياسات والدفع والسمعة.${issueText || " أصلح عناصر الثقة أولاً قبل توقع توصية إيجابية."}`;
    }
    case "general": {
      return `ملخص ظهور «${store}» في إجابات AI: الدرجة الإجمالية ${overall}/100، ودرجة الظهور في AI حوالي ${geo}/100. متوسط قابلية القراءة عبر المحركات ${avgGeoReadability(audit)}/100.${strengthText}${issueText}`;
    }
    default: {
      const _exhaustive: never = intent;
      return _exhaustive;
    }
  }
}

function buildReasons(audit: AuditData, intent: PromptIntent): string[] {
  const reasons: string[] = [];
  const overall = clamp(audit.overallScore);
  const trust = pillarScore(audit, "trust");
  const geo = clamp(audit.geoAnalysis?.score ?? avgGeoReadability(audit));
  const conversion = pillarScore(audit, "conversion");
  const geoAvg = avgGeoReadability(audit);

  reasons.push(`الدرجة الإجمالية للمتجر ${overall}/100 من تحليل الصفحة.`);

  switch (intent) {
    case "trust":
      reasons.push(`درجة الثقة ${trust}/100 هي المحرك الأساسي لهذا النوع من الأسئلة.`);
      break;
    case "best_store":
      reasons.push(`درجة التحويل ${conversion}/100 وSEO ${pillarScore(audit, "seo")}/100 تؤثر على ترشيح «أفضل متجر».`);
      break;
    case "recommend":
      reasons.push(`التوصية تُوزَّن بين الدرجة الكلية (${overall}) والثقة (${trust}) والتحويل (${conversion}).`);
      break;
    case "general":
      reasons.push(`أسئلة عامة تعتمد على توازن الدرجة الكلية (${overall}) مع ظهور GEO (${geo}).`);
      break;
    default: {
      const _exhaustive: never = intent;
      return _exhaustive;
    }
  }

  reasons.push(
    `متوسط قابلية القراءة لمحركات AI (ChatGPT / Perplexity / Google AI) ≈ ${geoAvg}/100.`
  );

  if (audit.geoAnalysis?.summary?.trim()) {
    reasons.push(audit.geoAnalysis.summary.trim());
  }

  const passFindings =
    audit.geoAnalysis?.findings.filter((f) => f.status === "pass").slice(0, 2) ?? [];
  for (const f of passFindings) {
    reasons.push(`${f.label}: ${f.detail}`);
  }

  const failFindings =
    audit.geoAnalysis?.findings
      .filter((f) => f.status === "fail" || f.status === "warn")
      .slice(0, 2) ?? [];
  for (const f of failFindings) {
    reasons.push(`${f.label}: ${f.detail}`);
  }

  return reasons.slice(0, 5);
}

function buildImprovements(audit: AuditData): string[] {
  const prioritized = prioritizeRecommendations(audit.recommendations);
  const fromRecs = prioritized.slice(0, 3).map((r) => r.solution?.trim() || r.problem);
  if (fromRecs.length >= 2) return fromRecs;

  const geoFails =
    audit.geoAnalysis?.findings
      .filter((f) => f.status === "fail" || f.status === "warn")
      .slice(0, 3)
      .map((f) => `حسّن «${f.label}»: ${f.detail}`) ?? [];

  const merged = [...fromRecs, ...geoFails].filter(Boolean);
  if (merged.length > 0) return merged.slice(0, 3);

  return [
    "أضف إشارات ثقة واضحة (سياسات الشحن/الإرجاع وطرق الدفع).",
    "حسّن وصف المنتج وهيكل الصفحة لتسهيل اقتباس المساعدات الذكية.",
    "أضف أسئلة شائعة وبيانات منظمة (Product / FAQ schema).",
  ];
}

/**
 * Deterministic AI-answer simulation from audit findings — no external model calls.
 */
export function simulateAiRecommendation(
  audit: AuditData,
  prompt: string
): SimulatedAiResponse {
  const intent = detectPromptIntent(prompt);
  const prioritized = prioritizeRecommendations(audit.recommendations);
  const criticalCount = prioritized.filter((r) => r.severity === "critical").length;
  const confidence = confidenceFor(audit, intent, criticalCount);
  const fixFirst =
    prioritized[0]?.problem?.trim() ||
    audit.geoAnalysis?.findings.find((f) => f.status === "fail")?.detail ||
    "حسّن إشارات الثقة والتحويل في صفحة المنتج أولاً.";

  return {
    intent,
    answer: buildAnswer(audit, intent, confidence),
    confidence,
    reasons: buildReasons(audit, intent),
    improvements: buildImprovements(audit),
    fixFirst,
  };
}
