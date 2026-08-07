import "server-only";

import type { AlertDraft } from "@/lib/alerts/types";
import { insertNotificationDrafts } from "@/lib/db/notifications-repository";
import {
  notificationDraftFromAlertDraft,
  notificationDraftFromCompletedTask,
  notificationDraftFromSubscriptionWarning,
  notificationDraftFromWeeklyReport,
} from "./build";

/** Mirror AI alert drafts into the Notification Center (deduped by alert dedupe_key). */
export async function emitNotificationsFromAlertDrafts(input: {
  workspaceId: string;
  storeId?: string | null;
  drafts: AlertDraft[];
}): Promise<number> {
  if (!input.drafts.length) return 0;
  try {
    const drafts = input.drafts.map(notificationDraftFromAlertDraft);
    const inserted = await insertNotificationDrafts({
      workspaceId: input.workspaceId,
      storeId: input.storeId,
      drafts,
    });
    return inserted.length;
  } catch (err) {
    console.error(
      "[notifications] alert mirror failed:",
      err instanceof Error ? err.message : err
    );
    return 0;
  }
}

export async function emitWeeklyReportNotification(input: {
  workspaceId: string;
  storeId: string;
  reportId: string;
  storeName: string;
  overallScore: number | null;
  overallDelta: number | null;
}): Promise<number> {
  try {
    const inserted = await insertNotificationDrafts({
      workspaceId: input.workspaceId,
      storeId: input.storeId,
      drafts: [
        notificationDraftFromWeeklyReport({
          reportId: input.reportId,
          storeName: input.storeName,
          overallScore: input.overallScore,
          overallDelta: input.overallDelta,
        }),
      ],
    });
    return inserted.length;
  } catch (err) {
    console.error(
      "[notifications] weekly report emit failed:",
      err instanceof Error ? err.message : err
    );
    return 0;
  }
}

export async function emitCompletedTaskNotification(input: {
  workspaceId: string;
  storeId?: string | null;
  taskId: string;
  title: string;
  completionSource: "user" | "reanalysis";
}): Promise<number> {
  try {
    const inserted = await insertNotificationDrafts({
      workspaceId: input.workspaceId,
      storeId: input.storeId,
      drafts: [
        notificationDraftFromCompletedTask({
          taskId: input.taskId,
          title: input.title,
          completionSource: input.completionSource,
        }),
      ],
    });
    return inserted.length;
  } catch (err) {
    console.error(
      "[notifications] completed task emit failed:",
      err instanceof Error ? err.message : err
    );
    return 0;
  }
}

export async function emitSubscriptionWarningNotification(input: {
  workspaceId: string;
  kind: "expired" | "quota_exhausted";
  planLabel?: string;
  metricLabel?: string;
}): Promise<number> {
  try {
    const inserted = await insertNotificationDrafts({
      workspaceId: input.workspaceId,
      drafts: [notificationDraftFromSubscriptionWarning(input)],
    });
    return inserted.length;
  } catch (err) {
    console.error(
      "[notifications] subscription warning emit failed:",
      err instanceof Error ? err.message : err
    );
    return 0;
  }
}
