import { prioritizeRecommendations } from "@/lib/ai/recommendations";
import {
  MEANINGFUL_SCORE_DELTA,
  buildScoreChange,
  pillarScoreFromAudit,
  recommendationKey,
} from "@/lib/weekly-report/compare";
import type { AuditData, GeoFinding, Recommendation } from "@/lib/types";
import type { DetectedCompetitorChange } from "@/lib/competitor-monitor/types";
import type { AlertDraft, AlertPriority } from "./types";

/** Trust score floor used to treat signals as "present". */
const TRUST_PRESENT_FLOOR = 45;
/** Drop below this after having signals → "disappeared". */
const TRUST_LOST_CEILING = 35;
/** Large overall drop escalates priority. */
const LARGE_OVERALL_DROP = 10;

function findingStatus(
  findings: GeoFinding[] | undefined,
  id: string
): GeoFinding["status"] | null {
  const hit = (findings ?? []).find((f) => f.id === id);
  return hit?.status ?? null;
}

function schemaWasValid(audit: AuditData): boolean {
  const status = findingStatus(audit.geoAnalysis?.findings, "product-schema");
  if (status === "pass") return true;
  return Boolean(audit.geoAnalysis?.signals?.hasProductSchema);
}

function schemaIsInvalid(audit: AuditData): boolean {
  const status = findingStatus(audit.geoAnalysis?.findings, "product-schema");
  if (status === "fail") return true;
  if (status === "pass") return false;
  return !audit.geoAnalysis?.signals?.hasProductSchema;
}

function healthScore(audit: AuditData): number {
  const pillars = (["seo", "geo", "conversion", "trust"] as const)
    .map((p) => pillarScoreFromAudit(audit, p))
    .filter((n): n is number => n != null);
  if (!pillars.length) return Math.round(audit.overallScore);
  return Math.round(pillars.reduce((a, b) => a + b, 0) / pillars.length);
}

function dropPriority(delta: number): AlertPriority {
  return Math.abs(delta) >= LARGE_OVERALL_DROP ? "critical" : "high";
}

function importantRecPriority(rec: Recommendation): AlertPriority {
  if (rec.severity === "critical") return "critical";
  if (rec.severity === "warning" && rec.impact === "high") return "high";
  return "medium";
}

/**
 * Generate store/audit alerts by comparing the latest completed audit
 * with the previous one. Pure — no I/O.
 */
export function generateAuditAlerts(input: {
  latest: AuditData;
  previous: AuditData | null;
  auditId: string;
}): AlertDraft[] {
  const { latest, previous, auditId } = input;
  const out: AlertDraft[] = [];

  if (previous) {
    const overall = buildScoreChange(
      "overall",
      previous.overallScore,
      latest.overallScore
    );
    if (overall.meaningful && overall.direction === "down") {
      out.push({
        alertType: "overall_score_drop",
        priority: dropPriority(overall.delta),
        title: "انخفاض الدرجة الإجمالية للمتجر",
        reason: `انخفضت الدرجة الإجمالية من ${overall.previous} إلى ${overall.current} (${overall.delta}).`,
        businessImpact:
          "تراجع الصحة العامة للمتجر يقلّل الثقة والتحويل وقد يضعف ترتيبك أمام المنافسين.",
        suggestedAction:
          "راجع التوصيات الحرجة في أحدث تقرير وابدأ بإصلاحات التحويل والثقة ذات الأثر الأعلى.",
        source: "audit",
        sourceRefType: "audit",
        sourceRefId: auditId,
        dedupeKey: `overall_score_drop:${auditId}`,
        payload: {
          previous: overall.previous,
          current: overall.current,
          delta: overall.delta,
        },
      });
    }

    const geo = buildScoreChange(
      "geo",
      pillarScoreFromAudit(previous, "geo"),
      pillarScoreFromAudit(latest, "geo")
    );
    if (geo.meaningful && geo.direction === "down") {
      out.push({
        alertType: "geo_score_drop",
        priority: "high",
        title: "انخفاض درجة GEO / ظهور AI",
        reason: `انخفضت درجة GEO من ${geo.previous} إلى ${geo.current} (${geo.delta}).`,
        businessImpact:
          "ضعف قابلية الاستشهاد يقلّل فرص ظهور منتجك في إجابات ChatGPT ومحركات AI.",
        suggestedAction:
          "عزّز FAQ وSchema ووضوح الكيانات في صفحة المنتج، ثم أعد التحليل للتحقق.",
        source: "audit",
        sourceRefType: "audit",
        sourceRefId: auditId,
        dedupeKey: `geo_score_drop:${auditId}`,
        payload: {
          previous: geo.previous,
          current: geo.current,
          delta: geo.delta,
        },
      });
    }

    const prevTrust = pillarScoreFromAudit(previous, "trust");
    const nextTrust = pillarScoreFromAudit(latest, "trust");
    const trust = buildScoreChange("trust", prevTrust, nextTrust);
    const hadSignals =
      (prevTrust ?? 0) >= TRUST_PRESENT_FLOOR ||
      Boolean(
        previous.breakdown.find((b) => b.pillar === "trust")?.summary?.trim()
      );
    const lostSignals =
      hadSignals &&
      (nextTrust == null || nextTrust <= TRUST_LOST_CEILING) &&
      trust.direction === "down" &&
      Math.abs(trust.delta) >= MEANINGFUL_SCORE_DELTA;

    if (lostSignals) {
      out.push({
        alertType: "trust_signals_lost",
        priority: "high",
        title: "اختفاء إشارات الثقة",
        reason: `انخفضت درجة الثقة من ${trust.previous ?? "—"} إلى ${trust.current ?? "—"} — إشارات الدفع/السياسات/المراجعات ضعفت أو اختفت.`,
        businessImpact:
          "غياب إشارات الثقة يرفع تردد الشراء ويضر بمعدل إتمام الطلب.",
        suggestedAction:
          "أعد إظهار سياسات الإرجاع والشحن ووسائل الدفع المحلية والمراجعات قرب زر الشراء.",
        source: "audit",
        sourceRefType: "audit",
        sourceRefId: auditId,
        dedupeKey: `trust_signals_lost:${auditId}`,
        payload: {
          previous: trust.previous,
          current: trust.current,
          delta: trust.delta,
        },
      });
    }

    if (schemaWasValid(previous) && schemaIsInvalid(latest)) {
      out.push({
        alertType: "schema_invalid",
        priority: "critical",
        title: "مخطط المنتج أصبح غير صالح / مفقود",
        reason:
          "كان مخطط Product (JSON-LD) موجوداً في التحليل السابق وهو الآن مفقود أو فاشل.",
        businessImpact:
          "فقدان Schema يضعف الفهم الآلي للمنتج ويقلّل الأهلية للظهور الغني وفي محركات AI.",
        suggestedAction:
          "أصلح أو أعد نشر Product/Offer JSON-LD وتحقق من صحته في أداة اختبار النتائج المنسّقة.",
        source: "audit",
        sourceRefType: "audit",
        sourceRefId: auditId,
        dedupeKey: `schema_invalid:${auditId}`,
        payload: {
          previousHasProductSchema: true,
          currentHasProductSchema: Boolean(
            latest.geoAnalysis?.signals?.hasProductSchema
          ),
        },
      });
    }

    const prevHealth = healthScore(previous);
    const nextHealth = healthScore(latest);
    const healthDelta = nextHealth - prevHealth;
    if (healthDelta >= MEANINGFUL_SCORE_DELTA) {
      out.push({
        alertType: "store_healthier",
        priority: "medium",
        title: "تحسّن صحة المتجر",
        reason: `ارتفعت صحة المتجر المركّبة من ${prevHealth} إلى ${nextHealth} (+${healthDelta}).`,
        businessImpact:
          "تحسّن الصحة يعني أساساً أقوى للتحويل والظهور — حافظ على الزخم.",
        suggestedAction:
          "ثبّت الإصلاحات الناجحة وأغلق التوصيات المتبقية ذات الأولوية العالية.",
        source: "audit",
        sourceRefType: "audit",
        sourceRefId: auditId,
        dedupeKey: `store_healthier:${auditId}`,
        payload: {
          previous: prevHealth,
          current: nextHealth,
          delta: healthDelta,
        },
      });
    }
  }

  const prevKeys = new Set(
    (previous?.recommendations ?? []).map((r) => recommendationKey(r)).filter(Boolean)
  );
  const important = prioritizeRecommendations(latest.recommendations ?? []).filter(
    (r) =>
      (r.severity === "critical" ||
        (r.severity === "warning" && r.impact === "high")) &&
      !prevKeys.has(recommendationKey(r))
  );

  for (const rec of important.slice(0, 5)) {
    const key = recommendationKey(rec) || rec.id;
    out.push({
      alertType: "important_recommendation",
      priority: importantRecPriority(rec),
      title: "توصية مهمة جديدة",
      reason: rec.problem,
      businessImpact:
        rec.projectedImpact?.trim() ||
        `أثر متوقع: ${rec.impact} على عمود ${rec.pillar}.`,
      suggestedAction: rec.solution,
      source: "audit",
      sourceRefType: "recommendation",
      sourceRefId: rec.id,
      dedupeKey: `important_recommendation:${auditId}:${key}`,
      payload: {
        recommendationId: rec.id,
        pillar: rec.pillar,
        severity: rec.severity,
        impact: rec.impact,
      },
    });
  }

  return out;
}

const COMPETITOR_IMPROVEMENT_TYPES = new Set([
  "ai_visibility_change",
  "trust_change",
  "seo_change",
  "schema_change",
  "new_faq",
  "new_reviews",
]);

/**
 * Map competitor monitor diffs into alerts.
 * Pure — no I/O.
 */
export function generateCompetitorAlerts(input: {
  changes: DetectedCompetitorChange[];
  targetId: string;
  snapshotId: string;
  targetLabel?: string | null;
  targetUrl?: string | null;
}): AlertDraft[] {
  const label =
    input.targetLabel?.trim() ||
    input.targetUrl?.trim() ||
    "المنافس";
  const out: AlertDraft[] = [];

  for (const change of input.changes) {
    if (change.changeType === "price_drop") {
      out.push({
        alertType: "competitor_price_drop",
        priority: "critical",
        title: `انخفاض سعر المنافس — ${label}`,
        reason: change.summary,
        businessImpact: change.businessImpact,
        suggestedAction: change.recommendedAction,
        source: "competitor",
        sourceRefType: "competitor_target",
        sourceRefId: input.targetId,
        dedupeKey: `competitor_price_drop:${input.targetId}:${input.snapshotId}`,
        payload: {
          changeType: change.changeType,
          previousValue: change.previousValue,
          currentValue: change.currentValue,
          targetUrl: input.targetUrl ?? null,
        },
      });
      continue;
    }

    const isImprovement =
      COMPETITOR_IMPROVEMENT_TYPES.has(change.changeType) &&
      (change.severity === "critical" || change.severity === "warning");

    if (!isImprovement) continue;

    // Score "improvements" for competitor are warning/critical in the diff engine.
    // Skip info-level regressions that use the same change_type with severity info.
    out.push({
      alertType: "competitor_improved",
      priority: change.severity === "critical" ? "critical" : "high",
      title: `تحسّن المنافس — ${label}`,
      reason: change.summary,
      businessImpact: change.businessImpact,
      suggestedAction: change.recommendedAction,
      source: "competitor",
      sourceRefType: "competitor_target",
      sourceRefId: input.targetId,
      dedupeKey: `competitor_improved:${input.targetId}:${input.snapshotId}:${change.changeType}`,
      payload: {
        changeType: change.changeType,
        previousValue: change.previousValue,
        currentValue: change.currentValue,
        targetUrl: input.targetUrl ?? null,
      },
    });
  }

  return out;
}
