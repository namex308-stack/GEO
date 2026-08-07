"use client";

import * as React from "react";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AlertPriority, AlertRecord, AlertsOverview } from "@/lib/alerts/types";

function priorityClass(priority: AlertPriority): string {
  switch (priority) {
    case "critical":
      return "bg-rose-500/15 text-rose-700";
    case "high":
      return "bg-amber-500/15 text-amber-800";
    case "medium":
      return "bg-sky-500/15 text-sky-800";
    case "low":
      return "bg-muted text-muted-foreground";
    default: {
      const _exhaustive: never = priority;
      return _exhaustive;
    }
  }
}

function formatTimestamp(iso: string): string {
  return iso.slice(0, 16).replace("T", " ");
}

export function AlertsView({
  overview,
  onMarkRead,
  onMarkAllRead,
}: {
  overview: AlertsOverview;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  const t = useT();
  const { alerts, unreadCount, channels } = overview;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bell className="size-4 text-primary" />
          <span>{t("alerts.unreadCount", { count: unreadCount })}</span>
          <span className="text-border">·</span>
          <span>
            {t("alerts.channelsHint", {
              inApp: channels.inApp ? t("alerts.channelOn") : t("alerts.channelOff"),
              email: channels.email ? t("alerts.channelOn") : t("alerts.channelOff"),
            })}
          </span>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="rounded-xl" onClick={onMarkAllRead}>
            <CheckCheck className="size-4 me-1.5" />
            {t("alerts.markAllRead")}
          </Button>
        )}
      </div>

      {!alerts.length ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("alerts.empty")}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <AlertCard alert={alert} onMarkRead={onMarkRead} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AlertCard({
  alert,
  onMarkRead,
}: {
  alert: AlertRecord;
  onMarkRead: (id: string) => void;
}) {
  const t = useT();

  return (
    <Card
      className={cn(
        "transition-colors",
        !alert.isRead && "border-primary/30 bg-primary/[0.03]"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base leading-relaxed flex items-start gap-2">
            {alert.alertType === "store_healthier" ? (
              <Sparkles className="size-4 text-primary mt-1 shrink-0" />
            ) : alert.priority === "critical" ? (
              <AlertTriangle className="size-4 text-rose-600 mt-1 shrink-0" />
            ) : (
              <Lightbulb className="size-4 text-amber-600 mt-1 shrink-0" />
            )}
            <span>{alert.title}</span>
          </CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className={priorityClass(alert.priority)}>
              {t(`alerts.priority.${alert.priority}`)}
            </Badge>
            {!alert.isRead && (
              <Badge variant="outline" className="text-[10px]">
                {t("alerts.unread")}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          {formatTimestamp(alert.createdAt)}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            {t("alerts.reason")}
          </p>
          <p className="leading-relaxed">{alert.reason}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            {t("alerts.businessImpact")}
          </p>
          <p className="leading-relaxed">{alert.businessImpact}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            {t("alerts.suggestedAction")}
          </p>
          <p className="leading-relaxed">{alert.suggestedAction}</p>
        </div>
        {!alert.isRead && (
          <div className="pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg"
              onClick={() => onMarkRead(alert.id)}
            >
              {t("alerts.markRead")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
