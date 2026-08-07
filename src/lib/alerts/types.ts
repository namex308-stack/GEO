export type AlertType =
  | "overall_score_drop"
  | "geo_score_drop"
  | "trust_signals_lost"
  | "schema_invalid"
  | "competitor_improved"
  | "competitor_price_drop"
  | "important_recommendation"
  | "store_healthier";

export type AlertPriority = "critical" | "high" | "medium" | "low";

export type AlertSource = "audit" | "competitor" | "geo" | "system";

/** Draft alert produced by pure generators before persistence. */
export type AlertDraft = {
  alertType: AlertType;
  priority: AlertPriority;
  title: string;
  reason: string;
  businessImpact: string;
  suggestedAction: string;
  source: AlertSource;
  sourceRefType: string | null;
  sourceRefId: string | null;
  dedupeKey: string;
  payload: Record<string, unknown>;
};

export type AlertRecord = {
  id: string;
  workspaceId: string;
  storeId: string | null;
  alertType: AlertType;
  priority: AlertPriority;
  title: string;
  reason: string;
  businessImpact: string;
  suggestedAction: string;
  source: AlertSource;
  sourceRefType: string | null;
  sourceRefId: string | null;
  payload: Record<string, unknown>;
  isRead: boolean;
  readAt: string | null;
  notifyInApp: boolean;
  notifyEmail: boolean;
  inAppDeliveredAt: string | null;
  emailDeliveredAt: string | null;
  createdAt: string;
};

export type AlertsOverview = {
  alerts: AlertRecord[];
  unreadCount: number;
  /** Channels reserved for future delivery wiring. */
  channels: {
    inApp: boolean;
    email: boolean;
  };
};

/** Future email/in-app delivery preferences (not applied yet). */
export type AlertNotificationChannel = "in_app" | "email";
