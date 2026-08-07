import type { AlertNotificationChannel, AlertRecord } from "./types";

export type AlertDeliveryPlan = {
  alertId: string;
  /** Channels that should attempt delivery for this alert. */
  channels: AlertNotificationChannel[];
  /** In-app is satisfied by persisting the row (inbox). */
  inAppStatus: "delivered" | "skipped";
  /** Email is intentionally not sent in this milestone. */
  emailStatus: "pending" | "skipped" | "not_implemented";
};

/**
 * Plan notification delivery for an alert.
 * In-app: row persistence is the delivery mechanism.
 * Email: reserved for a future Resend job — do not send here.
 */
export function planAlertDelivery(alert: AlertRecord): AlertDeliveryPlan {
  const channels: AlertNotificationChannel[] = [];
  if (alert.notifyInApp) channels.push("in_app");
  if (alert.notifyEmail) channels.push("email");

  return {
    alertId: alert.id,
    channels,
    inAppStatus: alert.notifyInApp ? "delivered" : "skipped",
    emailStatus: alert.notifyEmail ? "not_implemented" : "skipped",
  };
}
