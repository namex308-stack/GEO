import type {
  CompetitorChangeSeverity,
  CompetitorChangeType,
  CompetitorSignals,
  DetectedCompetitorChange,
} from "./types";

const SCORE_DELTA = 2;

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function textChanged(prev: string, next: string): boolean {
  const a = normalizeText(prev);
  const b = normalizeText(next);
  if (!a && !b) return false;
  return a !== b;
}

function setDiff(prev: string[], next: string[]): { added: string[]; removed: string[] } {
  const prevSet = new Set(prev);
  const nextSet = new Set(next);
  const added = [...nextSet].filter((k) => !prevSet.has(k));
  const removed = [...prevSet].filter((k) => !nextSet.has(k));
  return { added, removed };
}

function change(
  changeType: CompetitorChangeType,
  severity: CompetitorChangeSeverity,
  fieldPath: string,
  previousValue: unknown,
  currentValue: unknown,
  summary: string,
  businessImpact: string,
  recommendedAction: string
): DetectedCompetitorChange {
  return {
    changeType,
    severity,
    fieldPath,
    previousValue,
    currentValue,
    summary,
    businessImpact,
    recommendedAction,
  };
}

/**
 * Diff two competitor signal snapshots. Pure function — no I/O.
 */
export function detectCompetitorChanges(
  previous: CompetitorSignals,
  current: CompetitorSignals
): DetectedCompetitorChange[] {
  const out: DetectedCompetitorChange[] = [];

  // Price
  if (
    previous.priceValue != null &&
    current.priceValue != null &&
    previous.priceValue !== current.priceValue
  ) {
    if (current.priceValue > previous.priceValue) {
      out.push(
        change(
          "price_increase",
          "warning",
          "price",
          previous.priceRaw,
          current.priceRaw,
          `ارتفع سعر المنافس من ${previous.priceRaw} إلى ${current.priceRaw}.`,
          "رفع السعر قد يفتح فرصة لاستقطاب المشترين الحساسين للسعر أو لتعزيز عرض القيمة لديك.",
          "راجع تسعيرك وعروضك — أبرز ميزة واضحة أو حزمة أفضل دون سباق خصم غير مدروس."
        )
      );
    } else {
      out.push(
        change(
          "price_drop",
          "critical",
          "price",
          previous.priceRaw,
          current.priceRaw,
          `انخفض سعر المنافس من ${previous.priceRaw} إلى ${current.priceRaw}.`,
          "انخفاض سعر المنافس يضغط على التحويل وقد يسرق الطلب من صفحة منتجك.",
          "اختبر عرضاً محدوداً أو أبرز قيمة إضافية (شحن، ضمان، تقسيط) لتعويض فرق السعر."
        )
      );
    }
  } else if (
    (previous.priceRaw || current.priceRaw) &&
    previous.priceRaw !== current.priceRaw &&
    (previous.priceValue == null || current.priceValue == null)
  ) {
    out.push(
      change(
        "content_change",
        "info",
        "price",
        previous.priceRaw,
        current.priceRaw,
        "تغيّر عرض السعر لدى المنافس.",
        "تغيير صياغة السعر يؤثر على مقارنة المشترين بين المتاجر.",
        "تأكد أن سعرك واضح بنفس عملة السوق مع أي رسوم ظاهرة."
      )
    );
  }

  // Title / description / content
  if (textChanged(previous.title, current.title)) {
    out.push(
      change(
        "title_change",
        "info",
        "title",
        previous.title,
        current.title,
        "عدّل المنافس عنوان المنتج.",
        "تغيير العنوان قد يحسّن ظهوره في البحث أو جذب النقر.",
        "قارن عنوانك بالجديد — ركّز على الفائدة والكلمات التي يبحث عنها عملاؤك."
      )
    );
  }

  if (textChanged(previous.description, current.description)) {
    out.push(
      change(
        "description_change",
        "info",
        "description",
        previous.description.slice(0, 240),
        current.description.slice(0, 240),
        "عدّل المنافس وصف المنتج.",
        "وصف أقوى قد يرفع الثقة والتحويل لدى المنافس.",
        "حدّث فقرتك الأولى بفائدة واضحة وإشارات ثقة قريبة من زر الشراء."
      )
    );
  }

  if (
    previous.contentHash &&
    current.contentHash &&
    previous.contentHash !== current.contentHash &&
    !textChanged(previous.title, current.title) &&
    !textChanged(previous.description, current.description)
  ) {
    out.push(
      change(
        "content_change",
        "info",
        "contentHash",
        previous.contentHash.slice(0, 16),
        current.contentHash.slice(0, 16),
        "تغيّر محتوى صفحة المنافس.",
        "تحديثات المحتوى قد تشمل عروضاً أو إشارات ثقة جديدة.",
        "راجع صفحة المنافس يدوياً والتقط أي عرض أو رسالة يمكنك مضاهاتها."
      )
    );
  }

  // FAQ
  const faqDiff = setDiff(previous.faqKeys, current.faqKeys);
  if (faqDiff.added.length) {
    out.push(
      change(
        "new_faq",
        "warning",
        "faq",
        previous.faqKeys.length,
        current.faqKeys.length,
        `أضاف المنافس ${faqDiff.added.length} سؤال/جواب جديد.`,
        "الأسئلة الشائعة تحسّن الظهور في محركات AI وتقلّل تردد الشراء.",
        "أضف أسئلة مشابهة حول الشحن والإرجاع والاستخدام في صفحة منتجك."
      )
    );
  }
  if (faqDiff.removed.length) {
    out.push(
      change(
        "removed_faq",
        "info",
        "faq",
        previous.faqKeys.length,
        current.faqKeys.length,
        `أزال المنافس ${faqDiff.removed.length} سؤال/جواب.`,
        "إزالة FAQ قد تضعف ظهور المنافس في الإجابات التوليدية — فرصة لك.",
        "حافظ على FAQ قوي ومنظّم بمخطط FAQPage لتعزيز GEO."
      )
    );
  }

  // Reviews
  const prevReviews = previous.reviewCount ?? 0;
  const nextReviews = current.reviewCount ?? 0;
  if (nextReviews > prevReviews) {
    out.push(
      change(
        "new_reviews",
        "warning",
        "reviews",
        prevReviews,
        nextReviews,
        `زادت تقييمات/مراجعات المنافس من ${prevReviews} إلى ${nextReviews}.`,
        "المزيد من المراجعات يرفع الثقة ومعدل إتمام الشراء لدى المنافس.",
        "فعّل جمع مراجعات حقيقية واعرض أحدثها قرب زر الشراء."
      )
    );
  } else if (nextReviews < prevReviews && prevReviews > 0) {
    out.push(
      change(
        "removed_reviews",
        "info",
        "reviews",
        prevReviews,
        nextReviews,
        `انخفض عدد مراجعات المنافس الظاهرة من ${prevReviews} إلى ${nextReviews}.`,
        "انخفاض المراجعات الظاهرة قد يضعف ثقة الزائر في المنافس.",
        "أبرز مراجعاتك الأحدث وشارات التحقق إن وُجدت."
      )
    );
  }

  // Schema
  if (previous.schemaFingerprint !== current.schemaFingerprint) {
    out.push(
      change(
        "schema_change",
        "warning",
        "schema",
        previous.schemaTypes,
        current.schemaTypes,
        "تغيّرت بيانات Schema / JSON-LD لدى المنافس.",
        "تحسين المخطط يرفع أهلية الظهور في البحث ومحركات AI.",
        "حدّث Product/Offer/FAQPage schema في صفحتك وتحقق من صحتها."
      )
    );
  }

  // Trust / SEO / AI visibility scores
  const trustDelta = current.trustScore - previous.trustScore;
  if (Math.abs(trustDelta) >= SCORE_DELTA) {
    out.push(
      change(
        "trust_change",
        trustDelta > 0 ? "warning" : "info",
        "trustScore",
        previous.trustScore,
        current.trustScore,
        `تغيّرت إشارات الثقة لدى المنافس (${trustDelta > 0 ? "+" : ""}${trustDelta}).`,
        "تحسّن الثقة لدى المنافس يصعّب الفوز بقرار الشراء.",
        "أظهر سياسات الإرجاع والدفع المحلي بوضوح بجانب السعر."
      )
    );
  }

  const seoDelta = current.seoScore - previous.seoScore;
  if (Math.abs(seoDelta) >= SCORE_DELTA) {
    out.push(
      change(
        "seo_change",
        seoDelta > 0 ? "warning" : "info",
        "seoScore",
        previous.seoScore,
        current.seoScore,
        `تغيّر أداء SEO لدى المنافس (${seoDelta > 0 ? "+" : ""}${seoDelta}).`,
        "تحسين SEO للمنافس قد يزيد زياراته العضوية على حسابك.",
        "حسّن العنوان والوصف التعريفي والعناوين الفرعية لكلمات الشراء."
      )
    );
  }

  const geoDelta = current.geoScore - previous.geoScore;
  if (Math.abs(geoDelta) >= SCORE_DELTA) {
    out.push(
      change(
        "ai_visibility_change",
        geoDelta > 0 ? "critical" : "info",
        "geoScore",
        previous.geoScore,
        current.geoScore,
        `تغيّر ظهور المنافس في محركات AI (${geoDelta > 0 ? "+" : ""}${geoDelta}).`,
        "ارتفاع GEO لدى المنافس يزيد احتمال ترشيحه في إجابات ChatGPT وغيرها.",
        "عزّز البنية (FAQ، Schema، وضوح الكيان) لرفع قابلية الاستشهاد بصفحتك."
      )
    );
  }

  return out;
}

export function summarizeBusinessImpact(changes: DetectedCompetitorChange[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of changes) {
    const text = c.businessImpact.trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
    if (out.length >= 6) break;
  }
  return out;
}

export function summarizeRecommendedActions(changes: DetectedCompetitorChange[]): string[] {
  const severityRank: Record<CompetitorChangeSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  const ranked = [...changes].sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity]
  );
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of ranked) {
    const text = c.recommendedAction.trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
    if (out.length >= 6) break;
  }
  return out;
}

/** Build impact/action bullets from persisted change rows or live detections. */
export function buildMonitorInsights(
  changes: Array<{
    businessImpact: string | null;
    recommendedAction: string | null;
    summary: string;
    severity: CompetitorChangeSeverity;
    changeType: string;
    previousValue: unknown;
    currentValue: unknown;
    fieldPath?: string;
  }>
): { businessImpact: string[]; recommendedActions: string[] } {
  const mapped: DetectedCompetitorChange[] = changes.map((c) => ({
    changeType: c.changeType as CompetitorChangeType,
    severity: c.severity,
    fieldPath: c.fieldPath ?? "",
    previousValue: c.previousValue,
    currentValue: c.currentValue,
    summary: c.summary,
    businessImpact: c.businessImpact ?? "",
    recommendedAction: c.recommendedAction ?? "",
  }));
  return {
    businessImpact: summarizeBusinessImpact(mapped),
    recommendedActions: summarizeRecommendedActions(mapped),
  };
}
