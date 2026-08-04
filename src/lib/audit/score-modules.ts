/**
 * Core scoring modules for store audits.
 * Each pillar returns { score, findings[], severity } from scraped page data.
 * Conversion / SEO / Trust heuristics are deterministic; GEO wraps the rule engine.
 * Gemini (when available) enriches conversion/SEO/trust via a single batched call.
 */

import { analyzeGeo } from "@/lib/audit/geo-analyzer";
import { clampScore } from "@/lib/audit/scoring";
import type { CategorySlug, NormalizedPage } from "@/lib/db/types";
import type { Recommendation } from "@/lib/types";

export type PillarModuleSeverity = "low" | "medium" | "high";

export type PillarScoreModuleResult = {
  score: number;
  findings: string[];
  severity: PillarModuleSeverity;
  /** Short Arabic summary for ScoreBreakdown / audit_scores.summary */
  summary: string;
};

export const PILLAR_LABELS_AR: Record<CategorySlug, string> = {
  conversion: "التحويل",
  seo: "تحسين محركات البحث",
  geo: "الظهور في محركات AI",
  trust: "الثقة",
};

/** Local MENA payment methods checked inside Trust Score. */
export type LocalPaymentMethodId = "mada" | "tabby" | "tamara" | "apple_pay" | "cod";

export const LOCAL_PAYMENT_LABELS_AR: Record<LocalPaymentMethodId, string> = {
  mada: "مدى",
  tabby: "تابي",
  tamara: "تمارا",
  apple_pay: "Apple Pay",
  cod: "الدفع عند الاستلام",
};

/** Stable id prefix so prioritization / recommendations can spot this finding. */
export const TRUST_PAYMENT_FINDING_ID = "trust-local-payments";

export const TRUST_PAYMENT_MISSING_FINDING =
  "طرق الدفع المحلية غير ظاهرة (مدى، تابي، تمارا، Apple Pay، أو الدفع عند الاستلام). غيابها يقلّل ثقة المشتري في مصر والخليج ويزيد التردد عند إتمام الشراء.";

export const TRUST_PAYMENT_MISSING_SOLUTION =
  "أظهر بوضوح بجانب السعر أو زر الشراء: مدى و/أو تابي و/أو تمارا و/أو Apple Pay و/أو الدفع عند الاستلام (COD) — حسب ما يدعمه متجرك فعليًا.";

const LOCAL_PAYMENT_PATTERNS: Record<LocalPaymentMethodId, RegExp> = {
  mada: /\bmada\b|مدى|بطاقة\s*مدى/i,
  tabby: /\btabby\b|تابي|تابى/i,
  tamara: /\btamara\b|تمارا/i,
  apple_pay: /\bapple\s*pay\b|\bapplepay\b|آبل\s*باي|ابل\s*باي|أبل\s*باي/i,
  cod:
    /\bcod\b|\bcash\s*on\s*delivery\b|الدفع\s*عند\s*الاستلام|الدفع\s*كاش|كاش\s*عند\s*الاستلام|الدفع\s*نقدًا|الدفع\s*نقدا|دفع\s*عند\s*الاستلام/i,
};

export type LocalPaymentDetection = {
  detected: LocalPaymentMethodId[];
  labelsAr: string[];
  haystackLength: number;
};

function trustHaystack(page: NormalizedPage): string {
  const sd = page.structuredData ?? {};
  const parts = [
    page.title,
    page.description,
    page.markdown,
    page.url,
    JSON.stringify(sd),
  ];
  return parts.filter(Boolean).join("\n");
}

function paymentHaystack(page: NormalizedPage): string {
  return trustHaystack(page);
}

/** Lightweight text/pattern detection for local payment trust signals. */
export function detectLocalPaymentMethods(page: NormalizedPage): LocalPaymentDetection {
  const haystack = paymentHaystack(page);
  const detected = (Object.keys(LOCAL_PAYMENT_PATTERNS) as LocalPaymentMethodId[]).filter((id) =>
    LOCAL_PAYMENT_PATTERNS[id].test(haystack)
  );
  return {
    detected,
    labelsAr: detected.map((id) => LOCAL_PAYMENT_LABELS_AR[id]),
    haystackLength: haystack.length,
  };
}

export function buildLocalPaymentTrustFinding(detection: LocalPaymentDetection): string {
  if (detection.detected.length === 0) return TRUST_PAYMENT_MISSING_FINDING;
  return `طرق دفع محلية ظاهرة تدعم الثقة: ${detection.labelsAr.join("، ")}.`;
}

/**
 * Ensure Trust module results include the local-payment sub-check.
 * Safe to apply on heuristic or Gemini trust payloads.
 * Set `adjustScore: false` when the score already includes this signal (e.g. Gemini anchored on heuristic).
 */
export function enrichTrustWithLocalPayments(
  page: NormalizedPage,
  trust: PillarScoreModuleResult,
  options?: { adjustScore?: boolean }
): PillarScoreModuleResult {
  const adjustScore = options?.adjustScore !== false;
  const detection = detectLocalPaymentMethods(page);
  const paymentFinding = buildLocalPaymentTrustFinding(detection);

  const withoutOldPayment = trust.findings.filter(
    (f) =>
      !f.includes("طرق دفع") &&
      !f.includes("طرق الدفع") &&
      !/mada|tabby|tamara|apple pay|الدفع عند الاستلام/i.test(f)
  );

  const findings = [paymentFinding, ...withoutOldPayment].slice(0, 8);

  let score = trust.score;
  if (adjustScore) {
    if (detection.detected.length === 0) {
      score = clampScore(score - 12);
    } else {
      score = clampScore(score + Math.min(10, 4 + detection.detected.length * 2));
    }
  }

  // Missing local payments is always a high-severity trust gap for MENA shoppers.
  const severity: PillarModuleSeverity =
    detection.detected.length === 0 ? "high" : severityFromScore(score);

  const summary =
    detection.detected.length === 0
      ? "ثقة محدودة: طرق الدفع المحلية غير ظاهرة للمشتري."
      : trust.summary.includes("دفع")
        ? trust.summary
        : `${trust.summary} · دفع محلي: ${detection.labelsAr.join("، ")}.`;

  return { score, findings, severity, summary };
}

export type PolicyClarity = "specific" | "vague" | "missing";

export type ShippingReturnsPolicyId = "shipping_duration" | "return_policy" | "exchange_policy";

export type ShippingReturnsClarity = {
  shippingDuration: PolicyClarity;
  returnPolicy: PolicyClarity;
  exchangePolicy: PolicyClarity;
  /** Count of dimensions that are missing or only vague. */
  weakCount: number;
};

export const TRUST_SHIPPING_FINDING_ID = "trust-shipping-returns";

export const TRUST_SHIPPING_MISSING_SOLUTION =
  "اكتب بجانب المنتج أو في صفحة السياسات: مدة شحن رقمية (مثل 3–5 أيام عمل)، ومدة/شروط الإرجاع، ومدة/شروط الاستبدال — بلغة واضحة يراها المشتري قبل الدفع.";

const DURATION_NUMBER =
  /(\d{1,2}\s*[-–—إلىto]{1,4}\s*\d{1,2}|\d{1,2})\s*(أيام\s*عمل|يوم\s*عمل|أيامً?ا?|يومً?ا?|ساعات|ساعة|business\s*days?|days?|hours?)/i;

function clarityForPolicy(
  text: string,
  specific: RegExp,
  vague: RegExp,
  topic: RegExp
): PolicyClarity {
  if (specific.test(text)) return "specific";
  if (vague.test(text) || topic.test(text)) {
    // Topic-only mention without numbers/details counts as vague if topic hits, missing if nothing.
    if (vague.test(text)) return "vague";
    if (topic.test(text) && !specific.test(text)) return "vague";
  }
  return "missing";
}

/** Detect clarity of shipping duration, return policy, and exchange policy. */
export function detectShippingReturnsClarity(page: NormalizedPage): ShippingReturnsClarity {
  const text = trustHaystack(page);

  const shippingDuration = (() => {
    const specific = new RegExp(
      String.raw`((توصيل|شحن|delivery|shipping|arrives?).{0,40}${DURATION_NUMBER.source})|(${DURATION_NUMBER.source}.{0,40}(توصيل|شحن|delivery|shipping))|(خلال\s*${DURATION_NUMBER.source})`,
      "i"
    );
    if (specific.test(text) || (/(شحن|توصيل|shipping|delivery)/i.test(text) && DURATION_NUMBER.test(text))) {
      return "specific" as const;
    }
    if (/شحن\s*سريع|توصيل\s*سريع|fast\s*shipping|free\s*shipping|شحن\s*مجاني|نوصل\s*ل|shipping\s*available|delivery\s*available/i.test(text)) {
      return "vague" as const;
    }
    if (/شحن|توصيل|shipping|delivery|التوصيل/i.test(text)) return "vague";
    return "missing";
  })();

  const returnPolicy = clarityForPolicy(
    text,
    new RegExp(
      String.raw`((إرجاع|استرجاع|return).{0,40}${DURATION_NUMBER.source})|(${DURATION_NUMBER.source}.{0,40}(إرجاع|استرجاع|return))|(إرجاع\s*خلال)|(return\s*within)|(استرجاع\s*خلال)`,
      "i"
    ),
    /سياسة\s*الإرجاع|سياسة\s*الاسترجاع|returns?\s*policy|easy\s*returns?|يمكن\s*الإرجاع|قبول\s*الإرجاع|returns?\s*accepted/i,
    /إرجاع|استرجاع|\breturns?\b/i
  );

  const exchangePolicy = clarityForPolicy(
    text,
    new RegExp(
      String.raw`((استبدال|تبديل|exchange).{0,40}${DURATION_NUMBER.source})|(${DURATION_NUMBER.source}.{0,40}(استبدال|تبديل|exchange))|(استبدال\s*خلال)|(exchange\s*within)`,
      "i"
    ),
    /سياسة\s*الاستبدال|سياسة\s*التبديل|exchange\s*policy|يمكن\s*الاستبدال|exchanges?\s*accepted|easy\s*exchange/i,
    /استبدال|تبديل|\bexchanges?\b/i
  );

  const weakCount = [shippingDuration, returnPolicy, exchangePolicy].filter(
    (c) => c !== "specific"
  ).length;

  return { shippingDuration, returnPolicy, exchangePolicy, weakCount };
}

function shippingClarityLabelAr(clarity: PolicyClarity): string {
  switch (clarity) {
    case "specific":
      return "محددة";
    case "vague":
      return "عامة/غير دقيقة";
    case "missing":
      return "غير ظاهرة";
    default: {
      const _exhaustive: never = clarity;
      return _exhaustive;
    }
  }
}

export function buildShippingReturnsFindings(clarity: ShippingReturnsClarity): string[] {
  if (clarity.weakCount === 0) {
    return [
      "سياسات الشحن والإرجاع والاستبدال واضحة ومحددة (مدد زمنية ظاهرة للمشتري).",
    ];
  }

  const findings: string[] = [];

  if (clarity.shippingDuration === "missing") {
    findings.push(
      "مدة الشحن غير ظاهرة. المشتري في مصر والخليج يتردد عندما لا يعرف متى يصل الطلب."
    );
  } else if (clarity.shippingDuration === "vague") {
    findings.push(
      "مدة الشحن مذكورة بشكل عام وغير محددة (مثل «شحن سريع»). وضّح رقمًا مثل «3–5 أيام عمل»."
    );
  }

  if (clarity.returnPolicy === "missing") {
    findings.push(
      "سياسة الإرجاع غير ظاهرة. غياب شروط الإرجاع يضعف الثقة ويزيد التخلي عن السلة."
    );
  } else if (clarity.returnPolicy === "vague") {
    findings.push(
      "سياسة الإرجاع موجودة لكن غير محددة (بدون مدة أو شروط واضحة). اذكر مثلًا «إرجاع خلال 14 يومًا»."
    );
  }

  if (clarity.exchangePolicy === "missing") {
    findings.push(
      "سياسة الاستبدال غير ظاهرة. توضيح الاستبدال يقلل القلق قبل إتمام الشراء."
    );
  } else if (clarity.exchangePolicy === "vague") {
    findings.push(
      "سياسة الاستبدال عامة وغير دقيقة. حدّد المدة والشروط بجانب المنتج أو في السياسات."
    );
  }

  return findings;
}

function isShippingReturnsFinding(text: string): boolean {
  return (
    text.includes("سياسات الشحن والإرجاع") ||
    text.includes("مدة الشحن") ||
    text.includes("سياسة الإرجاع") ||
    text.includes("سياسة الاستبدال") ||
    text.includes("لم يتم رصد سياسات شحن") ||
    text.includes("توجد إشارات لسياسات")
  );
}

/**
 * Ensure Trust results include shipping / returns / exchange clarity findings.
 */
export function enrichTrustWithShippingReturns(
  page: NormalizedPage,
  trust: PillarScoreModuleResult,
  options?: { adjustScore?: boolean }
): PillarScoreModuleResult {
  const adjustScore = options?.adjustScore !== false;
  const clarity = detectShippingReturnsClarity(page);
  const shippingFindings = buildShippingReturnsFindings(clarity);

  const withoutOld = trust.findings.filter((f) => !isShippingReturnsFinding(f));

  // Keep payment finding first when present, then shipping sub-findings.
  const paymentIdx = withoutOld.findIndex(
    (f) =>
      f === TRUST_PAYMENT_MISSING_FINDING ||
      f.includes("طرق دفع محلية") ||
      f.includes("طرق الدفع المحلية")
  );
  const findings =
    paymentIdx >= 0
      ? [
          withoutOld[paymentIdx]!,
          ...shippingFindings,
          ...withoutOld.filter((_, i) => i !== paymentIdx),
        ].slice(0, 8)
      : [...shippingFindings, ...withoutOld].slice(0, 8);

  let score = trust.score;
  if (adjustScore) {
    for (const c of [clarity.shippingDuration, clarity.returnPolicy, clarity.exchangePolicy]) {
      if (c === "specific") score += 5;
      else if (c === "vague") score += 2;
      else score -= 4;
    }
    score = clampScore(score);
  }

  const gapsMissing = [clarity.shippingDuration, clarity.returnPolicy, clarity.exchangePolicy].filter(
    (c) => c === "missing"
  ).length;
  const severity: PillarModuleSeverity =
    trust.severity === "high" || gapsMissing >= 2 || clarity.weakCount === 3
      ? "high"
      : severityFromScore(score);

  const summaryParts = [
    `شحن: ${shippingClarityLabelAr(clarity.shippingDuration)}`,
    `إرجاع: ${shippingClarityLabelAr(clarity.returnPolicy)}`,
    `استبدال: ${shippingClarityLabelAr(clarity.exchangePolicy)}`,
  ];
  const policySummary = `وضوح السياسات — ${summaryParts.join(" · ")}.`;
  const summary =
    clarity.weakCount === 0
      ? trust.summary.includes("شحن")
        ? trust.summary
        : `${trust.summary} · ${policySummary}`
      : trust.summary.includes("ثقة محدودة")
        ? `${trust.summary} ${policySummary}`
        : `ثقة محدودة في وضوح الشحن/الإرجاع. ${policySummary}`;

  return { score, findings, severity, summary };
}

/** Apply all Trust sub-checks (payments + shipping/returns). */
export function enrichTrustSubChecks(
  page: NormalizedPage,
  trust: PillarScoreModuleResult,
  options?: { adjustScore?: boolean }
): PillarScoreModuleResult {
  const withPayments = enrichTrustWithLocalPayments(page, trust, options);
  return enrichTrustWithShippingReturns(page, withPayments, options);
}

export function severityFromScore(score: number): PillarModuleSeverity {
  const s = clampScore(score);
  if (s < 50) return "high";
  if (s < 70) return "medium";
  return "low";
}

export function moduleSeverityToRecommendation(severity: PillarModuleSeverity): {
  severity: Recommendation["severity"];
  impact: Recommendation["impact"];
} {
  switch (severity) {
    case "high":
      return { severity: "critical", impact: "high" };
    case "medium":
      return { severity: "warning", impact: "medium" };
    case "low":
      return { severity: "opportunity", impact: "low" };
    default: {
      const _exhaustive: never = severity;
      return _exhaustive;
    }
  }
}

function pageSignals(page: NormalizedPage) {
  const sd = page.structuredData ?? {};
  return {
    sd,
    hasPrice: Boolean(sd.hasPriceSignal || sd.price),
    hasImages: page.imageCount > 0 || Boolean(sd.ogImage || sd.primaryImageUrl),
    hasBrand: Boolean(sd.brand),
    hasSchema: Array.isArray(sd.jsonLdTypes) && (sd.jsonLdTypes as string[]).length > 0,
    hasFaq: Array.isArray(sd.faq) && (sd.faq as unknown[]).length > 0,
    hasRating: Boolean(sd.rating || sd.reviews),
    hasCta: Boolean(sd.hasCtaSignal),
    descLen: (page.description || "").length,
    mdLen: (page.markdown || "").length,
    hasPolicy: /policy|return|shipping|warranty|ضمان|إرجاع|شحن|استرجاع/i.test(page.markdown),
  };
}

/** Deterministic Conversion Score (0–100) with Arabic findings. */
export function scoreConversionModule(page: NormalizedPage): PillarScoreModuleResult {
  const s = pageSignals(page);
  let score = 40;
  const findings: string[] = [];

  if (s.hasPrice) {
    score += 15;
    findings.push("تم رصد إشارة واضحة للسعر على الصفحة.");
  } else {
    findings.push("لا توجد إشارة واضحة للسعر قرب زر الشراء.");
  }

  if (s.hasImages) {
    score += 15;
    findings.push("توجد صور للمنتج تدعم قرار الشراء.");
  } else {
    findings.push("لم يتم العثور على صورة منتج واضحة.");
  }

  if (s.hasCta) {
    score += 15;
    findings.push("يوجد زر أو دعوة واضحة لاتخاذ إجراء (CTA).");
  } else {
    findings.push("دعوة الشراء (CTA) غير واضحة أو غير مكتشفة.");
  }

  if (s.descLen > 80) {
    score += 10;
    findings.push("وصف المنتج كافٍ نسبيًا لتقليل احتكاك التحويل.");
  } else {
    findings.push("وصف المنتج قصير وقد يزيد من تردد المشتري.");
  }

  const clamped = clampScore(score);
  return {
    score: clamped,
    findings,
    severity: severityFromScore(clamped),
    summary: s.hasPrice
      ? "تم رصد إشارات سعر ودعوة شراء من محتوى الصفحة."
      : "إشارات التحويل (السعر / زر الشراء) محدودة على الصفحة.",
  };
}

/** Deterministic SEO Score (0–100) with Arabic findings. */
export function scoreSeoModule(page: NormalizedPage): PillarScoreModuleResult {
  const s = pageSignals(page);
  let score = 35;
  const findings: string[] = [];

  if (page.title) {
    score += 15;
    findings.push("عنوان الصفحة (Title) موجود.");
  } else {
    findings.push("عنوان الصفحة مفقود أو فارغ.");
  }

  if (s.descLen > 50) {
    score += 15;
    findings.push("الوصف التعريفي (Meta) موجود بطول مناسب.");
  } else {
    findings.push("الوصف التعريفي قصير أو غير مكتمل.");
  }

  if (s.hasImages) {
    score += 10;
    findings.push("توجد صور يمكن فهرستها أو ربطها بـ Open Graph.");
  } else {
    findings.push("لا توجد صور كافية لدعم الظهور في البحث.");
  }

  if (s.hasSchema) {
    score += 15;
    findings.push("تم رصد بيانات منظمة (Schema / JSON-LD).");
  } else {
    findings.push("لا توجد بيانات منظمة Schema.org على الصفحة.");
  }

  if (s.mdLen > 800) {
    score += 10;
    findings.push("محتوى الصفحة غني بما يكفي لمحركات البحث.");
  } else {
    findings.push("محتوى الصفحة قليل وقد يضعف الترتيب.");
  }

  const clamped = clampScore(score);
  return {
    score: clamped,
    findings,
    severity: severityFromScore(clamped),
    summary: s.hasSchema
      ? "عنوان ووصف موجودان مع بيانات منظمة مكتشفة."
      : "حقول SEO الأساسية موجودة؛ تغطية البيانات المنظمة محدودة.",
  };
}

/** Deterministic Trust Score (0–100) with Arabic findings. */
export function scoreTrustModule(page: NormalizedPage): PillarScoreModuleResult {
  const s = pageSignals(page);
  let score = 30;
  const findings: string[] = [];

  if (s.hasRating) {
    score += 20;
    findings.push("توجد تقييمات أو مراجعات مرئية.");
  } else {
    findings.push("لا توجد تقييمات أو عدد مراجعات واضح.");
  }

  if (s.hasBrand) {
    score += 10;
    findings.push("اسم العلامة التجارية ظاهر في البيانات.");
  } else {
    findings.push("هوية العلامة التجارية غير واضحة.");
  }

  // Shipping / returns / exchange clarity is handled by enrichTrustSubChecks (not a vague policy keyword).

  if (s.hasImages) {
    score += 10;
    findings.push("الصور تدعم مصداقية عرض المنتج.");
  }

  if (s.descLen > 80) {
    score += 10;
    findings.push("جودة المحتوى النصي تدعم الثقة.");
  } else {
    findings.push("المحتوى النصي ضعيف وقد يقلل ثقة الزائر.");
  }

  if (s.mdLen > 600) score += 5;

  const base: PillarScoreModuleResult = {
    score: clampScore(score),
    findings,
    severity: severityFromScore(score),
    summary: s.hasRating
      ? "توجد إشارات ثقة ومراجعات؛ عناصر UX جزئيًا مكتملة."
      : "إشارات الثقة (مراجعات، وضوح المحتوى) محدودة.",
  };

  return enrichTrustSubChecks(page, base);
}

/** GEO Score via deterministic rule engine, exposed as shared module contract. */
export function scoreGeoModule(page: NormalizedPage): PillarScoreModuleResult {
  const geo = analyzeGeo(page);
  const findings = geo.findings.map((f) => `${f.label}: ${f.detail}`);
  return {
    score: clampScore(geo.score),
    findings,
    severity: severityFromScore(geo.score),
    summary: geo.summary,
  };
}

export function scorePillarModule(
  pillar: CategorySlug,
  page: NormalizedPage
): PillarScoreModuleResult {
  switch (pillar) {
    case "conversion":
      return scoreConversionModule(page);
    case "seo":
      return scoreSeoModule(page);
    case "geo":
      return scoreGeoModule(page);
    case "trust":
      return scoreTrustModule(page);
    default: {
      const _exhaustive: never = pillar;
      return _exhaustive;
    }
  }
}

/** Turn module findings into recommendations for DB / report UI. */
export function moduleResultToRecommendations(
  pillar: CategorySlug,
  result: PillarScoreModuleResult,
  source: Recommendation["source"] = "rule_engine"
): Recommendation[] {
  const mapped = moduleSeverityToRecommendation(result.severity);
  return result.findings.slice(0, 6).map((finding, i) => {
    const isPaymentGap =
      pillar === "trust" &&
      (finding === TRUST_PAYMENT_MISSING_FINDING || finding.includes("طرق الدفع المحلية غير ظاهرة"));

    const isShippingGap =
      pillar === "trust" &&
      !isPaymentGap &&
      isShippingReturnsFinding(finding) &&
      !finding.includes("واضحة ومحددة");

    const severity =
      isPaymentGap || isShippingGap ? ("critical" as const) : mapped.severity;
    const impact = isPaymentGap || isShippingGap ? ("high" as const) : mapped.impact;

    return {
      id: isPaymentGap
        ? TRUST_PAYMENT_FINDING_ID
        : isShippingGap
          ? `${TRUST_SHIPPING_FINDING_ID}-${i}`
          : `${pillar}-f${i + 1}`,
      pillar,
      severity,
      impact,
      effort: "quick" as const,
      problem: finding,
      solution: isPaymentGap
        ? TRUST_PAYMENT_MISSING_SOLUTION
        : isShippingGap
          ? TRUST_SHIPPING_MISSING_SOLUTION
          : result.severity === "high"
            ? "عالج هذه النقطة أولًا لأنها تؤثر بقوة على درجة المتجر."
            : result.severity === "medium"
              ? "حسّن هذه النقطة لرفع الدرجة واستقرار الأداء."
              : "فرصة تحسين إضافية لتعزيز التجربة.",
      confidence: source === "gemini" ? 80 : 90,
      source,
      fixType: "manual" as const,
      severityBand: isPaymentGap || isShippingGap ? ("high" as const) : undefined,
    };
  });
}

/** Normalize a Gemini/heuristic pillar payload into the module contract. */
export function normalizePillarModuleResult(input: {
  score: unknown;
  findings?: unknown;
  severity?: unknown;
  summary?: unknown;
}): PillarScoreModuleResult {
  const score = clampScore(typeof input.score === "number" ? input.score : 0);
  const findings = Array.isArray(input.findings)
    ? input.findings
        .filter((f): f is string => typeof f === "string" && f.trim().length > 0)
        .map((f) => f.trim().slice(0, 500))
        .slice(0, 8)
    : [];
  const severityRaw = input.severity;
  const severity: PillarModuleSeverity =
    severityRaw === "low" || severityRaw === "medium" || severityRaw === "high"
      ? severityRaw
      : severityFromScore(score);
  const summary =
    typeof input.summary === "string" && input.summary.trim()
      ? input.summary.trim().slice(0, 800)
      : findings[0] ?? "تم تحليل الصفحة.";

  return { score, findings, severity, summary };
}
