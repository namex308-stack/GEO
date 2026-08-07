import { prioritizeRecommendations } from "@/lib/ai/recommendations";
import type { AuditData, Recommendation, ScorePillar } from "@/lib/types";

/** Qualitative uplift potential — no numeric revenue claims. */
export type QualitativeImpactLevel = "low" | "medium" | "high" | "very_high";

export type QualitativeImpactItem = {
  id: "conversion" | "trust" | "seo" | "geo" | "revenue";
  level: QualitativeImpactLevel;
  /** Arabic explanation grounded in audit evidence. */
  reason: string;
  currentScore: number | null;
};

export type EstimatedBusinessImpactModel = {
  items: QualitativeImpactItem[];
};

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function pillarScore(audit: AuditData, pillar: ScorePillar): number {
  return clampScore(audit.breakdown.find((b) => b.pillar === pillar)?.score ?? 0);
}

function levelFromGapAndPressure(
  score: number,
  highPressureCount: number
): QualitativeImpactLevel {
  const gap = 100 - clampScore(score);
  // Larger gap + more high-severity/high-impact findings → higher potential.
  if (gap >= 45 || (gap >= 30 && highPressureCount >= 2)) return "very_high";
  if (gap >= 30 || (gap >= 20 && highPressureCount >= 1)) return "high";
  if (gap >= 15 || highPressureCount >= 1) return "medium";
  return "low";
}

function bumpLevel(
  level: QualitativeImpactLevel,
  steps: number
): QualitativeImpactLevel {
  const order: QualitativeImpactLevel[] = ["low", "medium", "high", "very_high"];
  const idx = order.indexOf(level);
  return order[Math.max(0, Math.min(order.length - 1, idx + steps))]!;
}

function maxLevel(
  a: QualitativeImpactLevel,
  b: QualitativeImpactLevel
): QualitativeImpactLevel {
  const order: QualitativeImpactLevel[] = ["low", "medium", "high", "very_high"];
  return order.indexOf(a) >= order.indexOf(b) ? a : b;
}

function countPressure(
  recs: Recommendation[],
  pillar: ScorePillar
): { high: number; critical: number; topIssue: string | null } {
  const scoped = recs.filter((r) => r.pillar === pillar);
  const critical = scoped.filter((r) => r.severity === "critical").length;
  const high = scoped.filter(
    (r) => r.severity === "critical" || r.impact === "high"
  ).length;
  const top =
    scoped.find((r) => r.severity === "critical") ||
    scoped.find((r) => r.impact === "high") ||
    scoped[0];
  return {
    high,
    critical,
    topIssue: top?.problem?.trim() || null,
  };
}

function reasonForPillar(opts: {
  label: string;
  score: number;
  level: QualitativeImpactLevel;
  critical: number;
  high: number;
  topIssue: string | null;
  extra?: string;
}): string {
  const parts: string[] = [];
  parts.push(
    `درجة ${opts.label} الحالية ${opts.score}/100، لذا فجوة التحسين ${
      opts.level === "low" ? "محدودة" : opts.level === "medium" ? "واضحة" : "كبيرة"
    }.`
  );
  if (opts.critical > 0) {
    parts.push(`يوجد ${opts.critical} مشكلة حرجة مرتبطة بهذا المحور.`);
  } else if (opts.high > 0) {
    parts.push(`توجد ${opts.high} إشارة عالية الأثر تحتاج معالجة.`);
  } else {
    parts.push("لا تظهر مشاكل حرجة كثيرة هنا؛ التحسين سيكون تدريجياً.");
  }
  if (opts.topIssue) {
    parts.push(`أبرز مؤشر من التحليل: ${opts.topIssue}`);
  }
  if (opts.extra) parts.push(opts.extra);
  return parts.join(" ");
}

/**
 * Qualitative business-impact estimates from audit evidence only.
 * Never invents revenue percentages or currency figures.
 */
export function buildEstimatedBusinessImpact(
  audit: AuditData
): EstimatedBusinessImpactModel {
  const prioritized = prioritizeRecommendations(audit.recommendations);
  const conversion = pillarScore(audit, "conversion");
  const trust = pillarScore(audit, "trust");
  const seo = pillarScore(audit, "seo");
  const geo = clampScore(audit.geoAnalysis?.score ?? pillarScore(audit, "geo"));
  const overall = clampScore(audit.overallScore);

  const convP = countPressure(prioritized, "conversion");
  const trustP = countPressure(prioritized, "trust");
  const seoP = countPressure(prioritized, "seo");
  const geoP = countPressure(prioritized, "geo");

  const conversionLevel = levelFromGapAndPressure(conversion, convP.high);
  const trustLevel = levelFromGapAndPressure(trust, trustP.high);
  const seoLevel = levelFromGapAndPressure(seo, seoP.high);
  let geoLevel = levelFromGapAndPressure(geo, geoP.high);
  const geoFailCount =
    audit.geoAnalysis?.findings.filter((f) => f.status === "fail").length ?? 0;
  if (geoFailCount >= 3) geoLevel = bumpLevel(geoLevel, 1);

  // Revenue potential follows conversion + trust pressure — still qualitative only.
  const criticalTotal = prioritized.filter((r) => r.severity === "critical").length;
  let revenueLevel = maxLevel(conversionLevel, trustLevel);
  if (criticalTotal >= 3 && overall < 60) {
    revenueLevel = bumpLevel(revenueLevel, 1);
  } else if (criticalTotal === 0 && overall >= 75) {
    revenueLevel = "low";
  } else if (conversionLevel === "low" && trustLevel === "low") {
    revenueLevel = "low";
  }

  const revenueReasons: string[] = [
    `الإيراد المحتمل هنا تقديري نوعي فقط — مبني على فجوات التحويل (${conversion}/100) والثقة (${trust}/100) والدرجة الإجمالية (${overall}/100).`,
  ];
  if (criticalTotal > 0) {
    revenueReasons.push(
      `عدد المشاكل الحرجة الكلي ${criticalTotal}؛ إصلاحها عادةً يفتح أثراً أقرب للمبيعات من تحسينات SEO وحدها.`
    );
  } else {
    revenueReasons.push(
      "لا توجد مشاكل حرجة كثيرة، لذا أثر الإيراد المتوقع محدود ما لم تُفتح فرص تحويل جديدة."
    );
  }
  const topRevenueIssue =
    prioritized.find((r) => r.pillar === "conversion" || r.pillar === "trust")
      ?.problem || prioritized[0]?.problem;
  if (topRevenueIssue?.trim()) {
    revenueReasons.push(`مؤشر مرتبط بالأثر التجاري: ${topRevenueIssue.trim()}`);
  }
  revenueReasons.push("لا نعرض أرقاماً وهمية للإيراد أو نسب مبيعات غير مدعومة بالبيانات.");

  return {
    items: [
      {
        id: "conversion",
        level: conversionLevel,
        currentScore: conversion,
        reason: reasonForPillar({
          label: "التحويل",
          score: conversion,
          level: conversionLevel,
          critical: convP.critical,
          high: convP.high,
          topIssue: convP.topIssue,
        }),
      },
      {
        id: "trust",
        level: trustLevel,
        currentScore: trust,
        reason: reasonForPillar({
          label: "الثقة",
          score: trust,
          level: trustLevel,
          critical: trustP.critical,
          high: trustP.high,
          topIssue: trustP.topIssue,
        }),
      },
      {
        id: "seo",
        level: seoLevel,
        currentScore: seo,
        reason: reasonForPillar({
          label: "SEO",
          score: seo,
          level: seoLevel,
          critical: seoP.critical,
          high: seoP.high,
          topIssue: seoP.topIssue,
        }),
      },
      {
        id: "geo",
        level: geoLevel,
        currentScore: geo,
        reason: reasonForPillar({
          label: "الظهور في AI",
          score: geo,
          level: geoLevel,
          critical: geoP.critical,
          high: geoP.high,
          topIssue: geoP.topIssue,
          extra:
            geoFailCount > 0
              ? `محرك GEO سجّل ${geoFailCount} إشارة فاشلة تؤثر على قابلية التوصية.`
              : undefined,
        }),
      },
      {
        id: "revenue",
        level: revenueLevel,
        currentScore: null,
        reason: revenueReasons.join(" "),
      },
    ],
  };
}
