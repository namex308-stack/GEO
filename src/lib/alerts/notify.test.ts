import { describe, expect, it } from "vitest";
import type { AlertRecord } from "./types";
import { planAlertDelivery } from "./notify-plan";

function alert(partial: Partial<AlertRecord> = {}): AlertRecord {
  return {
    id: "a1",
    workspaceId: "w1",
    storeId: null,
    alertType: "overall_score_drop",
    priority: "high",
    title: "t",
    reason: "r",
    businessImpact: "b",
    suggestedAction: "s",
    source: "audit",
    sourceRefType: "audit",
    sourceRefId: "x",
    payload: {},
    isRead: false,
    readAt: null,
    notifyInApp: true,
    notifyEmail: false,
    inAppDeliveredAt: new Date().toISOString(),
    emailDeliveredAt: null,
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

describe("planAlertDelivery", () => {
  it("marks in-app delivered and leaves email unimplemented when requested", () => {
    const plan = planAlertDelivery(alert({ notifyInApp: true, notifyEmail: true }));
    expect(plan.channels).toEqual(["in_app", "email"]);
    expect(plan.inAppStatus).toBe("delivered");
    expect(plan.emailStatus).toBe("not_implemented");
  });

  it("skips email when notifyEmail is false", () => {
    const plan = planAlertDelivery(alert({ notifyEmail: false }));
    expect(plan.emailStatus).toBe("skipped");
    expect(plan.channels).toEqual(["in_app"]);
  });
});
