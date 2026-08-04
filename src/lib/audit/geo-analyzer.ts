/**
 * Deterministic GEO (AI Visibility) analyzer.
 * Measures how well a product page can be understood, cited, and recommended by AI systems.
 */

import {
  scoreAllGeoComponents,
  sumComponentScores,
  type GeoComponentScores,
} from "@/lib/audit/citation-score";
import {
  detectStructuredContent,
  type StructuredContentSignals,
} from "@/lib/audit/structured-content";
import type { AnalyzerJsonResult } from "@/lib/db/types";
import type { NormalizedPage } from "@/lib/db/types";
import type {
  GeoAnalysisResult,
  GeoFinding,
  GeoFindingStatus,
  Recommendation,
} from "@/lib/types";

export type { GeoFinding, GeoFindingStatus };

export interface GeoAnalysis extends GeoAnalysisResult {
  recommendations: Recommendation[];
  signals: StructuredContentSignals;
  readability: {
    chatgpt: number;
    perplexity: number;
    googleAI: number;
  };
}

/** Slim GEO payload persisted on AuditData (report API / reports.summary). */
export function toGeoAnalysisResult(geo: GeoAnalysis): GeoAnalysisResult {
  return {
    score: geo.score,
    summary: geo.summary,
    findings: geo.findings,
    componentScores: geo.componentScores,
    signals: {
      faqCount: geo.signals.faqCount,
      hasFaq: geo.signals.hasFaq,
      hasFaqSchema: geo.signals.hasFaqSchema,
      hasProductSchema: geo.signals.hasProductSchema,
      hasOrganizationSchema: geo.signals.hasOrganizationSchema,
      hasBreadcrumbSchema: geo.signals.hasBreadcrumbSchema,
      headingCount: geo.signals.headingCount,
      internalLinkCount: geo.signals.internalLinkCount,
      wordCount: geo.signals.wordCount,
    },
  };
}

/** Run the full GEO analysis for a normalized page. Never throws. */
export function analyzeGeo(page: NormalizedPage | null | undefined): GeoAnalysis {
  try {
    const signals = detectStructuredContent(page);
    const componentScores = scoreAllGeoComponents(signals);
    const score = sumComponentScores(componentScores);
    const findings = buildFindings(signals, componentScores);
    const recommendations = buildRecommendations(signals, findings);
    const summary = buildSummary(score, signals, findings);
    const readability = deriveReadability(score, signals);

    return {
      score,
      summary,
      findings,
      recommendations,
      componentScores,
      signals,
      readability,
    };
  } catch {
    return emptyGeoAnalysis();
  }
}

/** Map GEO analysis into the analyzer JSON contract used by analysis_runs. */
export function geoAnalysisToAnalyzerResult(geo: GeoAnalysis): AnalyzerJsonResult {
  return {
    scores: [
      {
        categorySlug: "geo",
        score: geo.score,
        max: 100,
        label: "الظهور في محركات AI",
        summary: geo.summary,
      },
    ],
    geoReadability: geo.readability,
    recommendations: geo.recommendations.map((r) => ({
      externalKey: r.id,
      categorySlug: "geo",
      severity: r.severity,
      impact: r.impact,
      effort: r.effort,
      problem: r.problem,
      solution: r.solution,
      confidence: r.confidence ?? 90,
      affectedPage: r.affectedPage,
      projectedImpact: r.projectedImpact,
      source: "rule_engine",
      fixType: r.fixType ?? "manual",
    })),
  };
}

function emptyGeoAnalysis(): GeoAnalysis {
  const signals = detectStructuredContent(null);
  const componentScores = scoreAllGeoComponents(signals);
  return {
    score: 0,
    summary: "تعذّر تقييم ظهور الصفحة في محركات AI؛ اعتُبرت الإشارات مفقودة.",
    findings: [
      {
        id: "geo-error",
        status: "fail",
        label: "التحليل غير متاح",
        detail: "تعذّر تقييم الصفحة بأمان. أعد تشغيل التحليل بعد إصلاح مشكلة الزحف.",
      },
    ],
    recommendations: [],
    componentScores,
    signals,
    readability: { chatgpt: 0, perplexity: 0, googleAI: 0 },
  };
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function deriveReadability(
  score: number,
  signals: StructuredContentSignals
): GeoAnalysis["readability"] {
  let chatgpt = score;
  let perplexity = score;
  let googleAI = score;

  // ChatGPT / assistants prefer explicit Q&A
  if (signals.hasFaq || signals.hasFaqSchema) chatgpt += 4;
  else chatgpt -= 6;
  if (signals.faqCount >= 3) chatgpt += 2;

  // Perplexity-style citation engines prefer quotable structure + entities
  if (signals.hasProductSchema && signals.hasFaq) perplexity += 3;
  if (signals.internalLinkCount >= 2) perplexity += 2;
  if (!signals.hasProductName) perplexity -= 4;

  // Google AI Overviews lean on schema + metadata
  if (signals.hasProductSchema) googleAI += 4;
  else googleAI -= 5;
  if (signals.hasBreadcrumbSchema) googleAI += 2;
  if (signals.hasOrganizationSchema) googleAI += 1;
  if (!signals.hasOgImage) googleAI -= 2;

  return {
    chatgpt: clamp(chatgpt),
    perplexity: clamp(perplexity),
    googleAI: clamp(googleAI),
  };
}

function buildFindings(
  signals: StructuredContentSignals,
  components: GeoComponentScores
): GeoFinding[] {
  const findings: GeoFinding[] = [];

  findings.push(
    finding(
      "faq",
      signals.hasFaq || signals.hasFaqSchema
        ? signals.faqCount >= 3 || signals.hasFaqSchema
          ? "pass"
          : "warn"
        : "fail",
      "توفر الأسئلة الشائعة",
      signals.hasFaq || signals.hasFaqSchema
        ? `تم العثور على ${signals.faqCount} سؤال/جواب${signals.hasFaqSchema ? " مع مخطط FAQPage" : ""}.`
        : "لا يوجد محتوى أسئلة شائعة أو مخطط FAQPage."
    )
  );

  findings.push(
    finding(
      "product-schema",
      signals.hasProductSchema ? "pass" : "fail",
      "مخطط المنتج",
      signals.hasProductSchema
        ? "مخطط Product (JSON-LD) موجود."
        : "مخطط المنتج (JSON-LD) مفقود."
    )
  );

  findings.push(
    finding(
      "organization-schema",
      signals.hasOrganizationSchema ? "pass" : "warn",
      "مخطط المؤسسة",
      signals.hasOrganizationSchema
        ? "مخطط Organization موجود."
        : "مخطط المؤسسة / العلامة التجارية مفقود."
    )
  );

  findings.push(
    finding(
      "breadcrumb-schema",
      signals.hasBreadcrumbSchema ? "pass" : "warn",
      "مخطط مسار التنقل",
      signals.hasBreadcrumbSchema
        ? "مخطط BreadcrumbList موجود."
        : "مخطط BreadcrumbList مفقود."
    )
  );

  findings.push(
    finding(
      "headings",
      components.headings >= 7 ? "pass" : components.headings >= 3 ? "warn" : "fail",
      "العناوين المنظمة",
      signals.headingCount > 0
        ? `تم رصد ${signals.headingCount} عنوانًا يساعد أنظمة AI على فهم الهيكل.`
        : "لا يوجد هيكل عناوين واضح."
    )
  );

  findings.push(
    finding(
      "content-structure",
      components.contentStructure >= 8 ? "pass" : components.contentStructure >= 4 ? "warn" : "fail",
      "هيكل المحتوى القابل للقراءة آليًا",
      `${signals.wordCount} كلمة، ${signals.paragraphCount} فقرة، ${signals.listItemCount} عنصر قائمة.`
    )
  );

  findings.push(
    finding(
      "internal-links",
      components.internalLinks >= 6 ? "pass" : components.internalLinks >= 3 ? "warn" : "fail",
      "جودة الروابط الداخلية",
      signals.internalLinkCount > 0
        ? `تم العثور على ${signals.internalLinkCount} رابطًا داخليًا.`
        : "لا توجد روابط داخلية تدعم السياق الموضوعي."
    )
  );

  findings.push(
    finding(
      "entities",
      components.entityRichness >= 7 ? "pass" : components.entityRichness >= 4 ? "warn" : "fail",
      "ثراء الكيانات",
      [
        signals.hasProductName ? "اسم" : null,
        signals.hasBrand ? "علامة" : null,
        signals.hasPrice ? "سعر" : null,
        signals.hasCategoryHint ? "فئة" : null,
      ]
        .filter(Boolean)
        .join("، ") || "كيانات المنتج المكتشفة قليلة."
    )
  );

  findings.push(
    finding(
      "metadata",
      components.metadata >= 6 ? "pass" : components.metadata >= 3 ? "warn" : "fail",
      "اكتمال البيانات الوصفية",
      signals.hasTitle && signals.hasDescription
        ? "العنوان والوصف موجودان؛ تم فحص تغطية Open Graph."
        : "العنوان و/أو الوصف التعريفي غير مكتملين."
    )
  );

  findings.push(
    finding(
      "clarity",
      components.contentClarity >= 5 ? "pass" : components.contentClarity >= 2 ? "warn" : "fail",
      "وضوح المحتوى",
      signals.hasBenefitStatement
        ? "تم رصد عبارات فائدة / جمهور مستهدف."
        : "لا توجد عبارة فائدة أو جمهور مستهدف واضحة."
    )
  );

  return findings;
}

function finding(
  id: string,
  status: GeoFindingStatus,
  label: string,
  detail: string
): GeoFinding {
  return { id: `geo-${id}`, status, label, detail };
}

function buildRecommendations(
  signals: StructuredContentSignals,
  findings: GeoFinding[]
): Recommendation[] {
  const recs: Recommendation[] = [];
  const failed = new Set(findings.filter((f) => f.status === "fail").map((f) => f.id));
  const warned = new Set(findings.filter((f) => f.status === "warn").map((f) => f.id));

  if (failed.has("geo-faq") || warned.has("geo-faq")) {
    recs.push({
      id: "geo-rec-faq",
      pillar: "geo",
      severity: failed.has("geo-faq") ? "critical" : "opportunity",
      impact: "high",
      effort: "medium",
      problem: "تغطية الأسئلة الشائعة ضعيفة لمحركات الإجابة والاستشهاد بالذكاء الاصطناعي.",
      solution: "أضف 5–8 أسئلة شائعة عن المنتج بإجابات واضحة مع مخطط FAQPage JSON-LD.",
      confidence: 92,
      source: "rule_engine",
      fixType: "manual",
      projectedImpact: "يرفع احتمال الاستشهاد في ChatGPT / Perplexity.",
    });
  }

  if (failed.has("geo-product-schema")) {
    recs.push({
      id: "geo-rec-product-schema",
      pillar: "geo",
      severity: "critical",
      impact: "high",
      effort: "quick",
      problem: "مخطط المنتج مفقود، فتصعب على أنظمة AI التعرف على كيان المنتج.",
      solution: "أضف Product JSON-LD يتضمن الاسم والصورة والعلامة والعروض والتقييم عند توفره.",
      confidence: 95,
      source: "rule_engine",
      fixType: "manual",
    });
  }

  if (warned.has("geo-organization-schema") || failed.has("geo-organization-schema")) {
    recs.push({
      id: "geo-rec-org-schema",
      pillar: "geo",
      severity: "warning",
      impact: "medium",
      effort: "quick",
      problem: "مخطط المؤسسة مفقود.",
      solution: "أضف Organization JSON-LD بالاسم والرابط والشعار لتعزيز ربط العلامة التجارية.",
      confidence: 88,
      source: "rule_engine",
      fixType: "manual",
    });
  }

  if (warned.has("geo-breadcrumb-schema") || failed.has("geo-breadcrumb-schema")) {
    recs.push({
      id: "geo-rec-breadcrumb",
      pillar: "geo",
      severity: "opportunity",
      impact: "medium",
      effort: "quick",
      problem: "مخطط BreadcrumbList مفقود.",
      solution: "أضف BreadcrumbList JSON-LD يعكس: الرئيسية ← الفئة ← المنتج.",
      confidence: 86,
      source: "rule_engine",
      fixType: "manual",
    });
  }

  if (failed.has("geo-headings") || warned.has("geo-headings")) {
    recs.push({
      id: "geo-rec-headings",
      pillar: "geo",
      severity: failed.has("geo-headings") ? "warning" : "opportunity",
      impact: "medium",
      effort: "quick",
      problem: "هيكل العناوين مسطح جدًا لاستخراج مخطط المحتوى بواسطة AI.",
      solution: "استخدم H1 واحدًا وعناوين H2/H3 واضحة (فوائد، مواصفات، طريقة الاستخدام، أسئلة شائعة).",
      confidence: 90,
      source: "rule_engine",
      fixType: "manual",
    });
  }

  if (failed.has("geo-content-structure")) {
    recs.push({
      id: "geo-rec-structure",
      pillar: "geo",
      severity: "warning",
      impact: "high",
      effort: "medium",
      problem: "محتوى الصفحة ضعيف أو غير منظم لتلخيص موثوق بواسطة AI.",
      solution: "وسّع المحتوى بفقرات قصيرة وقوائم نقطية وعناوين أقسام صريحة.",
      confidence: 89,
      source: "rule_engine",
      fixType: "manual",
    });
  }

  if (failed.has("geo-internal-links") || warned.has("geo-internal-links")) {
    recs.push({
      id: "geo-rec-internal-links",
      pillar: "geo",
      severity: "opportunity",
      impact: "medium",
      effort: "quick",
      problem: "الروابط الداخلية ضعيفة وتحدّ من السياق الموضوعي لمحركات AI.",
      solution: "اربط بمنتجات ذات صلة وصفحات فئات وأدلة باستخدام نصوص روابط وصفية.",
      confidence: 84,
      source: "rule_engine",
      fixType: "manual",
    });
  }

  if (failed.has("geo-entities") || warned.has("geo-entities")) {
    recs.push({
      id: "geo-rec-entities",
      pillar: "geo",
      severity: "warning",
      impact: "high",
      effort: "quick",
      problem: "كيانات المنتج (العلامة، السعر، الاسم) غير مكتملة لتوصية أنظمة AI.",
      solution: "أظهر العلامة والسعر واسم المنتج بوضوح في النص الظاهر والبيانات المنظمة.",
      confidence: 91,
      source: "rule_engine",
      fixType: "manual",
    });
  }

  if (failed.has("geo-metadata") || warned.has("geo-metadata")) {
    recs.push({
      id: "geo-rec-metadata",
      pillar: "geo",
      severity: failed.has("geo-metadata") ? "warning" : "opportunity",
      impact: "medium",
      effort: "quick",
      problem: "البيانات الوصفية غير مكتملة للاكتشاف في البحث وAI.",
      solution: "أكمل العنوان والوصف التعريفي وOpen Graph (عنوان، وصف، صورة).",
      confidence: 93,
      source: "rule_engine",
      fixType: "manual",
    });
  }

  if (failed.has("geo-clarity") || warned.has("geo-clarity")) {
    recs.push({
      id: "geo-rec-clarity",
      pillar: "geo",
      severity: "opportunity",
      impact: "medium",
      effort: "medium",
      problem: "المحتوى يفتقد عبارة فائدة أو جمهور يمكن لأنظمة AI اقتباسها.",
      solution: "أضف جملة واضحة في أعلى الصفحة: لمن المنتج وما الفائدة الأساسية.",
      confidence: 85,
      source: "rule_engine",
      fixType: "manual",
    });
  }

  if (!signals.hasFaqSchema && signals.faqCount > 0) {
    recs.push({
      id: "geo-rec-faq-schema",
      pillar: "geo",
      severity: "opportunity",
      impact: "medium",
      effort: "quick",
      problem: "توجد أسئلة شائعة بدون مخطط FAQPage.",
      solution: "غلّف أزواج السؤال والجواب الحالية في FAQPage JSON-LD ليسهل الاستشهاد بها.",
      confidence: 90,
      source: "rule_engine",
      fixType: "manual",
    });
  }

  return recs.slice(0, 10);
}

function buildSummary(
  score: number,
  signals: StructuredContentSignals,
  findings: GeoFinding[]
): string {
  const fails = findings.filter((f) => f.status === "fail").length;
  const passes = findings.filter((f) => f.status === "pass").length;

  if (score >= 75) {
    return `إشارات ظهور قوية في محركات AI (${passes} فحصًا ناجحًا). تغطية الأسئلة الشائعة والمخططات تدعم الاستشهاد.`;
  }
  if (score >= 50) {
    return `ظهور جزئي في محركات AI. يوجد ${fails} فجوة حرجة؛ حسّن الأسئلة الشائعة/المخططات وهيكل المحتوى.`;
  }
  if (signals.hasProductSchema || signals.hasFaq) {
    return `ظهور محدود في محركات AI. توجد بعض الإشارات المنظمة، لكن إشارات الاستشهاد الأساسية ناقصة.`;
  }
  return `ظهور ضعيف في محركات AI. غياب الأسئلة الشائعة/المخططات والمحتوى المنظم يقلل احتمال الاستشهاد.`;
}
