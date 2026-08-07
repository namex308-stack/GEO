export type NotificationCategory =
  | "ai_alert"
  | "weekly_report"
  | "competitor_change"
  | "score_change"
  | "completed_task"
  | "subscription_warning";

export type NotificationPriority = "critical" | "high" | "medium" | "low";

export type NotificationSource =
  | "audit"
  | "competitor"
  | "geo"
  | "report"
  | "task"
  | "billing"
  | "system";

export type NotificationDraft = {
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  actionLabel?: string | null;
  actionHref?: string | null;
  source: NotificationSource;
  sourceRefType?: string | null;
  sourceRefId?: string | null;
  dedupeKey: string;
  payload?: Record<string, unknown>;
};

export type NotificationRecord = {
  id: string;
  workspaceId: string;
  storeId: string | null;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  actionLabel: string | null;
  actionHref: string | null;
  source: NotificationSource;
  sourceRefType: string | null;
  sourceRefId: string | null;
  payload: Record<string, unknown>;
  isRead: boolean;
  readAt: string | null;
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string;
};

export type NotificationsOverview = {
  notifications: NotificationRecord[];
  unreadCount: number;
  archivedCount: number;
  categoryCounts: Record<NotificationCategory, number>;
  filter: NotificationCategory | "all" | "archived";
};

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  "ai_alert",
  "weekly_report",
  "competitor_change",
  "score_change",
  "completed_task",
  "subscription_warning",
];
