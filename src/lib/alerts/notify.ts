import "server-only";

import type { AlertRecord } from "./types";
import { planAlertDelivery, type AlertDeliveryPlan } from "./notify-plan";

export type { AlertDeliveryPlan };
export { planAlertDelivery };

/**
 * Future hook for email + push fan-out.
 * Currently a no-op beyond planning — email must not be sent yet.
 */
export async function dispatchAlertNotifications(
  alerts: AlertRecord[]
): Promise<AlertDeliveryPlan[]> {
  return alerts.map((alert) => planAlertDelivery(alert));
}
