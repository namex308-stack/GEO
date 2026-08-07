import { describe, expect, it } from "vitest";
import type { AlertDraft } from "@/lib/alerts/types";
import {
  notificationDraftFromAlertDraft,
  notificationDraftFromCompletedTask,
  notificationDraftFromSubscriptionWarning,
  notificationDraftFromWeeklyReport,
} from "./build";

function alertDraft(partial: Partial<AlertDraft> & Pick<AlertDraft, "alertType" | "dedupeKey">): AlertDraft {
  return {
    priority: "high",
    title: "عنوان",
    reason: "سبب",
    businessImpact: "أثر",
    suggestedAction: "إجراء",
    source: "audit",
    sourceRefType: "audit",
    sourceRefId: "a1",
    payload: {},
    ...partial,
  };
}

describe("notification builders", () => {
  it("maps score alerts to score_change category", () => {
    const draft = notificationDraftFromAlertDraft(
      alertDraft({
        alertType: "overall_score_drop",
        dedupeKey: "overall_score_drop:audit-1",
        priority: "critical",
      })
    );
    expect(draft.category).toBe("score_change");
    expect(draft.dedupeKey).toBe("alert:overall_score_drop:audit-1");
    expect(draft.actionHref).toBe("/alerts");
  });

  it("maps competitor alerts to competitor_change", () => {
    const draft = notificationDraftFromAlertDraft(
      alertDraft({
        alertType: "competitor_price_drop",
        dedupeKey: "competitor_price_drop:t1:s1",
        source: "competitor",
      })
    );
    expect(draft.category).toBe("competitor_change");
    expect(draft.source).toBe("competitor");
  });

  it("maps other alerts to ai_alert", () => {
    const draft = notificationDraftFromAlertDraft(
      alertDraft({
        alertType: "important_recommendation",
        dedupeKey: "important_recommendation:audit-1:x",
      })
    );
    expect(draft.category).toBe("ai_alert");
  });

  it("builds weekly report notification", () => {
    const draft = notificationDraftFromWeeklyReport({
      reportId: "wr-1",
      storeName: "متجر تجريبي",
      overallScore: 72,
      overallDelta: -3,
    });
    expect(draft.category).toBe("weekly_report");
    expect(draft.actionHref).toBe("/reports/weekly/wr-1");
    expect(draft.body).toContain("72");
  });

  it("builds completed task notification", () => {
    const draft = notificationDraftFromCompletedTask({
      taskId: "task-1",
      title: "أصلح CTA",
      completionSource: "reanalysis",
    });
    expect(draft.category).toBe("completed_task");
    expect(draft.title).toContain("إعادة التحليل");
  });

  it("builds subscription warning notification", () => {
    const draft = notificationDraftFromSubscriptionWarning({
      workspaceId: "w1",
      kind: "quota_exhausted",
      metricLabel: "تحليلات الشهر",
    });
    expect(draft.category).toBe("subscription_warning");
    expect(draft.priority).toBe("critical");
    expect(draft.actionHref).toBe("/settings/billing");
  });
});
