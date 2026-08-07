import type { Recommendation, ScorePillar } from "@/lib/types";

export type ImpactLabelKey =
  | "report.highImpact"
  | "report.mediumImpact"
  | "report.lowImpact";

export type EffortLabelKey =
  | "report.quickFix"
  | "report.mediumEffort"
  | "report.involved";

export type SeverityLabelKey =
  | "severity.critical"
  | "severity.warning"
  | "severity.opportunity";

export type PillarLabelKey =
  | "pillar.conversion"
  | "pillar.seo"
  | "pillar.geo"
  | "pillar.trust";

/** Presentation-only priority badge (does not change ranking engine). */
export type PriorityBadgeLevel = "critical" | "high" | "medium" | "low";

export type PriorityBadgeLabelKey =
  | "report.priorityBadgeCritical"
  | "report.priorityBadgeHigh"
  | "report.priorityBadgeMedium"
  | "report.priorityBadgeLow";

export type DifficultyLabelKey =
  | "report.difficultyEasy"
  | "report.difficultyMedium"
  | "report.difficultyHard";

/** Shared pillar → i18n key map for report/compare UI. */
export const PILLAR_LABEL_KEYS: Record<ScorePillar, PillarLabelKey> = {
  conversion: "pillar.conversion",
  seo: "pillar.seo",
  geo: "pillar.geo",
  trust: "pillar.trust",
};

/**
 * Map severity + impact → Critical / High / Medium / Low badge.
 * Presentation only — does not alter recommendation ranking.
 */
export function priorityBadgeLevel(rec: Recommendation): PriorityBadgeLevel {
  if (rec.severity === "critical") return "critical";
  if (rec.impact === "high") return "high";
  if (rec.impact === "medium" || rec.severity === "warning") return "medium";
  return "low";
}

export function priorityBadgeLabelKey(
  level: PriorityBadgeLevel
): PriorityBadgeLabelKey {
  switch (level) {
    case "critical":
      return "report.priorityBadgeCritical";
    case "high":
      return "report.priorityBadgeHigh";
    case "medium":
      return "report.priorityBadgeMedium";
    case "low":
      return "report.priorityBadgeLow";
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}

/** Tailwind classes for colored priority badges. */
export function priorityBadgeClass(level: PriorityBadgeLevel): string {
  switch (level) {
    case "critical":
      return "bg-rose-500/15 text-rose-600 border-rose-500/40";
    case "high":
      return "bg-primary/15 text-primary border-primary/40";
    case "medium":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40";
    case "low":
      return "bg-muted text-muted-foreground border-border/60";
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}

function resolveEffort(
  effort: Recommendation["effort"] | undefined
): NonNullable<Recommendation["effort"]> {
  if (effort) return effort;
  return "medium";
}

/** Human estimated time from stored effort (presentation). */
export function estimatedTimeLabel(rec: Recommendation): string {
  const effort = resolveEffort(rec.effort);
  switch (effort) {
    case "quick":
      return "١٥–٤٥ دقيقة";
    case "medium":
      return "٢–٤ ساعات";
    case "involved":
      return "١–٣ أيام";
    default: {
      const _exhaustive: never = effort;
      return _exhaustive;
    }
  }
}

export function difficultyLabelKey(rec: Recommendation): DifficultyLabelKey {
  const effort = resolveEffort(rec.effort);
  switch (effort) {
    case "quick":
      return "report.difficultyEasy";
    case "medium":
      return "report.difficultyMedium";
    case "involved":
      return "report.difficultyHard";
    default: {
      const _exhaustive: never = effort;
      return _exhaustive;
    }
  }
}

/** Map stored impact enum to Arabic report i18n keys (presentation only). */
export function impactLabelKey(impact: Recommendation["impact"]): ImpactLabelKey {
  switch (impact) {
    case "high":
      return "report.highImpact";
    case "medium":
      return "report.mediumImpact";
    case "low":
      return "report.lowImpact";
    default: {
      const _exhaustive: never = impact;
      return _exhaustive;
    }
  }
}

/** Map stored effort enum to Arabic report i18n keys; null when unset. */
export function effortLabelKey(
  effort: Recommendation["effort"] | undefined
): EffortLabelKey | null {
  if (!effort) return null;
  switch (effort) {
    case "quick":
      return "report.quickFix";
    case "medium":
      return "report.mediumEffort";
    case "involved":
      return "report.involved";
    default: {
      const _exhaustive: never = effort;
      return _exhaustive;
    }
  }
}

export function severityLabelKey(
  severity: Recommendation["severity"]
): SeverityLabelKey {
  switch (severity) {
    case "critical":
      return "severity.critical";
    case "warning":
      return "severity.warning";
    case "opportunity":
      return "severity.opportunity";
    default: {
      const _exhaustive: never = severity;
      return _exhaustive;
    }
  }
}

/** Prefer explicit business-impact copy already stored on the recommendation. */
export function businessImpactDetail(rec: Recommendation): string | null {
  const projected = rec.projectedImpact?.trim();
  if (projected) return projected;
  const lift = rec.estimatedLift?.trim();
  if (lift) return lift;
  return null;
}

/** Expected business result — prefers stored impact fields, then consultant fallback. */
export function expectedResultLabel(rec: Recommendation): string {
  const detail = businessImpactDetail(rec);
  if (detail) return detail;
  switch (rec.pillar) {
    case "conversion":
      return rec.impact === "high"
        ? "زيادة أوضح في إتمام الشراء وتقليل التردد عند الدفع."
        : "تحسن تدريجي في قرارات الشراء على صفحة المنتج.";
    case "trust":
      return rec.impact === "high"
        ? "ارتفاع ثقة المتسوق وانخفاض التراجع قبل إتمام الطلب."
        : "طمأنينة أعلى أثناء التصفح والشراء.";
    case "seo":
      return rec.impact === "high"
        ? "وصول أفضل من البحث وجذب زيارات أكثر استعداداً للشراء."
        : "تحسن تدريجي في ظهور المنتج لمن يبحث عنه.";
    case "geo":
      return rec.impact === "high"
        ? "فرصة أعلى لأن توصي بك مساعدات التسوق الذكية."
        : "ظهور أوضح لمتجرك عندما يسأل العملاء المساعدات الذكية.";
    default: {
      const _exhaustive: never = rec.pillar;
      return _exhaustive;
    }
  }
}

/** Consultant category label keys — business language, not engineering jargon. */
export type ConsultantCategoryKey =
  | "report.categorySales"
  | "report.categoryTrust"
  | "report.categorySearch"
  | "report.categoryAiVisibility";

export const CONSULTANT_CATEGORY_KEYS: Record<ScorePillar, ConsultantCategoryKey> = {
  conversion: "report.categorySales",
  trust: "report.categoryTrust",
  seo: "report.categorySearch",
  geo: "report.categoryAiVisibility",
};

/** Why this finding matters commercially (presentation only). */
export function whyItMattersLabel(rec: Recommendation): string {
  switch (rec.pillar) {
    case "conversion":
      return rec.impact === "high"
        ? "هذا يؤثر مباشرة على قرار الشراء — الزائر قد يغادر قبل إتمام الطلب."
        : "يضعف سلاسة الشراء ويجعل إقناع المتسوق أصعب مما ينبغي.";
    case "trust":
      return rec.impact === "high"
        ? "بدون طمأنينة كافية، حتى المنتج الجيد يُرفض في آخر خطوة."
        : "الثقة غير المكتملة تبطئ القرار وتزيد التردد.";
    case "seo":
      return rec.impact === "high"
        ? "إذا لم يجدك العميل في البحث، لن تصل إلى صفحة المنتج أصلاً."
        : "ظهور أضعف في البحث يعني زيارات أقل من مشترين جاهزين.";
    case "geo":
      return rec.impact === "high"
        ? "المساعدات الذكية قد تتجاهل متجرك أو توصي بمنافس أوضح."
        : "كلما كان وصف متجرك أوضح للمساعدات الذكية، زادت فرصة الترشيح.";
    default: {
      const _exhaustive: never = rec.pillar;
      return _exhaustive;
    }
  }
}

/** Commercial risk if the merchant ignores this finding (presentation only). */
export function ifIgnoredLabel(rec: Recommendation): string {
  const severe = rec.severity === "critical" || rec.impact === "high";
  switch (rec.pillar) {
    case "conversion":
      return severe
        ? "ستستمر في خسارة جزء من المبيعات يومياً رغم وجود زيارات."
        : "سيبقى معدل إتمام الشراء أقل من طاقتك الحقيقية لفترة أطول.";
    case "trust":
      return severe
        ? "سيتردد العملاء أو يتراجعون عن الطلب لصالح متجر يبدو أوثق."
        : "ستظل نسبة التردد أعلى من المنافسين الذين يبنون ثقة أوضح.";
    case "seo":
      return severe
        ? "سيصعب نمو الزيارات المجانية، وستعتمد أكثر على الإعلانات المدفوعة."
        : "ستفوتك فرص ظهور منتظمة أمام من يبحث عن منتجك.";
    case "geo":
      return severe
        ? "قد يُوصى بمنافسين بدل متجرك عندما يسأل العملاء المساعدات الذكية."
        : "ستتأخر عن موجة التوصية عبر المساعدات الذكية بينما يتقدم غيرك.";
    default: {
      const _exhaustive: never = rec.pillar;
      return _exhaustive;
    }
  }
}

export type ConsultantRecommendationView = {
  whatIsWrong: string;
  whyItMatters: string;
  ifIgnored: string;
  howToFix: string;
  howLong: string;
  businessImpact: string;
  impactLevel: Recommendation["impact"];
  categoryKey: ConsultantCategoryKey;
};

/** Shape one recommendation into a senior-consultant narrative (UI only). */
export function buildConsultantRecommendationView(
  rec: Recommendation
): ConsultantRecommendationView {
  return {
    whatIsWrong: (rec.problem || "").trim() || "هناك فجوة واضحة في تجربة صفحة المنتج.",
    whyItMatters: whyItMattersLabel(rec),
    ifIgnored: ifIgnoredLabel(rec),
    howToFix: (rec.solution || "").trim() || "حسّن عنصر الصفحة المرتبط بهذه الفرصة ثم أعد المراجعة.",
    howLong: estimatedTimeLabel(rec),
    businessImpact: expectedResultLabel(rec),
    impactLevel: rec.impact,
    categoryKey: CONSULTANT_CATEGORY_KEYS[rec.pillar],
  };
}

/**
 * Plain-text consultant brief for clipboard — the six merchant questions.
 */
export function formatRecommendationCopy(
  rec: Recommendation,
  labels: {
    priority: string;
    rank: number;
    whatIsWrong: string;
    whyItMatters: string;
    ifIgnored: string;
    howToFix: string;
    howLong: string;
    businessImpact: string;
    timeValue: string;
    businessDetail: string;
  }
): string {
  const view = buildConsultantRecommendationView(rec);
  return [
    `${labels.priority}: #${labels.rank}`,
    "",
    `${labels.whatIsWrong}`,
    view.whatIsWrong,
    "",
    `${labels.whyItMatters}`,
    view.whyItMatters,
    "",
    `${labels.ifIgnored}`,
    view.ifIgnored,
    "",
    `${labels.howToFix}`,
    view.howToFix,
    "",
    `${labels.howLong}`,
    labels.timeValue || view.howLong,
    "",
    `${labels.businessImpact}`,
    labels.businessDetail || view.businessImpact,
  ].join("\n");
}
