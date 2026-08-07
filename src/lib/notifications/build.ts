import type { AlertDraft, AlertRecord, AlertType } from "@/lib/alerts/types";
import type {
  NotificationCategory,
  NotificationDraft,
  NotificationPriority,
} from "./types";

const SCORE_ALERT_TYPES = new Set<AlertType>([
  "overall_score_drop",
  "geo_score_drop",
  "store_healthier",
]);

const COMPETITOR_ALERT_TYPES = new Set<AlertType>([
  "competitor_improved",
  "competitor_price_drop",
]);

function categoryForAlertType(alertType: AlertType): NotificationCategory {
  if (SCORE_ALERT_TYPES.has(alertType)) return "score_change";
  if (COMPETITOR_ALERT_TYPES.has(alertType)) return "competitor_change";
  return "ai_alert";
}

/** Map an AI alert draft into a Notification Center row (stable on alert dedupe_key). */
export function notificationDraftFromAlertDraft(alert: AlertDraft): NotificationDraft {
  return {
    category: categoryForAlertType(alert.alertType),
    priority: alert.priority,
    title: alert.title,
    body: alert.reason,
    actionLabel: "عرض التنبيه",
    actionHref: "/alerts",
    source:
      alert.source === "competitor"
        ? "competitor"
        : alert.source === "geo"
          ? "geo"
          : alert.source === "audit"
            ? "audit"
            : "system",
    sourceRefType: "alert",
    sourceRefId: alert.sourceRefId,
    dedupeKey: `alert:${alert.dedupeKey}`,
    payload: {
      alertType: alert.alertType,
      businessImpact: alert.businessImpact,
      suggestedAction: alert.suggestedAction,
    },
  };
}

/** Map a persisted AI alert into a Notification Center draft. */
export function notificationDraftFromAlert(alert: AlertRecord): NotificationDraft {
  return {
    category: categoryForAlertType(alert.alertType),
    priority: alert.priority,
    title: alert.title,
    body: alert.reason,
    actionLabel: "عرض التنبيه",
    actionHref: "/alerts",
    source:
      alert.source === "competitor"
        ? "competitor"
        : alert.source === "geo"
          ? "geo"
          : alert.source === "audit"
            ? "audit"
            : "system",
    sourceRefType: "alert",
    sourceRefId: alert.id,
    dedupeKey: `alert:${alert.id}`,
    payload: {
      alertType: alert.alertType,
      businessImpact: alert.businessImpact,
      suggestedAction: alert.suggestedAction,
    },
  };
}

export function notificationDraftFromWeeklyReport(input: {
  reportId: string;
  storeName: string;
  overallScore: number | null;
  overallDelta: number | null;
}): NotificationDraft {
  const delta =
    input.overallDelta == null
      ? ""
      : input.overallDelta > 0
        ? ` (+${input.overallDelta})`
        : input.overallDelta < 0
          ? ` (${input.overallDelta})`
          : "";
  const scorePart =
    input.overallScore == null ? "" : ` — الدرجة ${input.overallScore}${delta}`;

  return {
    category: "weekly_report",
    priority: "medium",
    title: `التقرير الأسبوعي جاهز — ${input.storeName}`,
    body: `تقرير الأسبوع متاح الآن${scorePart}. راجع ملخص التغييرات والإجراءات ذات الأولوية.`,
    actionLabel: "فتح التقرير",
    actionHref: `/reports/weekly/${input.reportId}`,
    source: "report",
    sourceRefType: "weekly_report",
    sourceRefId: input.reportId,
    dedupeKey: `weekly_report:${input.reportId}`,
    payload: {
      overallScore: input.overallScore,
      overallDelta: input.overallDelta,
    },
  };
}

export function notificationDraftFromCompletedTask(input: {
  taskId: string;
  title: string;
  completionSource: "user" | "reanalysis";
}): NotificationDraft {
  const byReanalysis = input.completionSource === "reanalysis";
  return {
    category: "completed_task",
    priority: "low",
    title: byReanalysis ? "مهمة أُغلقت بعد إعادة التحليل" : "تم إكمال مهمة نمو",
    body: byReanalysis
      ? `اختفت المشكلة المرتبطة بالمهمة: ${input.title}`
      : `أتممت المهمة: ${input.title}`,
    actionLabel: "عرض المهام",
    actionHref: "/tasks",
    source: "task",
    sourceRefType: "growth_task",
    sourceRefId: input.taskId,
    dedupeKey: `completed_task:${input.taskId}:${input.completionSource}`,
    payload: { completionSource: input.completionSource },
  };
}

export function notificationDraftFromSubscriptionWarning(input: {
  workspaceId: string;
  kind: "expired" | "quota_exhausted";
  planLabel?: string;
  metricLabel?: string;
}): NotificationDraft {
  if (input.kind === "expired") {
    return {
      category: "subscription_warning",
      priority: "high",
      title: "انتهت صلاحية الاشتراك",
      body: `تم الرجوع إلى الباقة المجانية${
        input.planLabel ? ` بعد انتهاء ${input.planLabel}` : ""
      }. جدّد الاشتراك لاستعادة الحدود الأعلى.`,
      actionLabel: "إدارة الفوترة",
      actionHref: "/settings/billing",
      source: "billing",
      sourceRefType: "subscription",
      sourceRefId: input.workspaceId,
      dedupeKey: `subscription_warning:expired:${input.workspaceId}:${new Date()
        .toISOString()
        .slice(0, 10)}`,
      payload: { kind: input.kind },
    };
  }

  return {
    category: "subscription_warning",
    priority: "critical",
    title: "نفدت حصة الاستخدام",
    body: `وصلت إلى حد ${input.metricLabel || "الاستخدام"} في باقتك الحالية. رقِّ الباقة للمتابعة.`,
    actionLabel: "ترقية الباقة",
    actionHref: "/settings/billing",
    source: "billing",
    sourceRefType: "quota",
    sourceRefId: input.workspaceId,
    dedupeKey: `subscription_warning:quota:${input.workspaceId}:${
      input.metricLabel || "usage"
    }:${new Date().toISOString().slice(0, 7)}`,
    payload: { kind: input.kind, metricLabel: input.metricLabel },
  };
}

export function emptyCategoryCounts(): Record<NotificationCategory, number> {
  return {
    ai_alert: 0,
    weekly_report: 0,
    competitor_change: 0,
    score_change: 0,
    completed_task: 0,
    subscription_warning: 0,
  };
}

export function priorityRank(priority: NotificationPriority): number {
  switch (priority) {
    case "critical":
      return 0;
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
      return 3;
    default: {
      const _exhaustive: never = priority;
      return _exhaustive;
    }
  }
}
