"use client";

import {
  Archive,
  Bell,
  CheckCheck,
  FileText,
  ListChecks,
  Swords,
  TrendingDown,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type {
  NotificationCategory,
  NotificationRecord,
  NotificationsOverview,
} from "@/lib/notifications/types";
import { NOTIFICATION_CATEGORIES } from "@/lib/notifications/types";
import Link from "next/link";

function priorityClass(priority: NotificationRecord["priority"]): string {
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

function categoryIcon(category: NotificationCategory) {
  switch (category) {
    case "ai_alert":
      return AlertTriangle;
    case "weekly_report":
      return FileText;
    case "competitor_change":
      return Swords;
    case "score_change":
      return TrendingDown;
    case "completed_task":
      return ListChecks;
    case "subscription_warning":
      return CreditCard;
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

function formatTimestamp(iso: string): string {
  return iso.slice(0, 16).replace("T", " ");
}

export function NotificationsView({
  overview,
  onFilter,
  onMarkRead,
  onArchive,
  onMarkAllRead,
}: {
  overview: NotificationsOverview;
  onFilter: (filter: NotificationsOverview["filter"]) => void;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  const t = useT();
  const filters: Array<NotificationsOverview["filter"]> = [
    "all",
    ...NOTIFICATION_CATEGORIES,
    "archived",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bell className="size-4 text-primary" />
          <span>{t("notifications.unreadCount", { count: overview.unreadCount })}</span>
          <span className="text-border">·</span>
          <span>
            {t("notifications.archivedCount", { count: overview.archivedCount })}
          </span>
        </div>
        {overview.unreadCount > 0 && overview.filter !== "archived" && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={onMarkAllRead}
          >
            <CheckCheck className="size-4 me-1.5" />
            {t("notifications.markAllRead")}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = overview.filter === filter;
          const count =
            filter === "all"
              ? Object.values(overview.categoryCounts).reduce((a, b) => a + b, 0)
              : filter === "archived"
                ? overview.archivedCount
                : overview.categoryCounts[filter];
          return (
            <Button
              key={filter}
              size="sm"
              variant={active ? "default" : "outline"}
              className="rounded-xl"
              onClick={() => onFilter(filter)}
            >
              {t(`notifications.filter.${filter}`)}
              <span className="ms-1.5 opacity-70">{count}</span>
            </Button>
          );
        })}
      </div>

      {!overview.notifications.length ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("notifications.empty")}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {overview.notifications.map((item) => (
            <li key={item.id}>
              <NotificationCard
                item={item}
                onMarkRead={onMarkRead}
                onArchive={onArchive}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationCard({
  item,
  onMarkRead,
  onArchive,
}: {
  item: NotificationRecord;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
}) {
  const t = useT();
  const Icon = categoryIcon(item.category);

  return (
    <Card
      className={cn(
        "transition-colors",
        !item.isRead && !item.isArchived && "border-primary/30 bg-primary/[0.03]"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base leading-relaxed flex items-start gap-2">
            <Icon className="size-4 text-primary mt-1 shrink-0" />
            <span>{item.title}</span>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <Badge variant="secondary" className={priorityClass(item.priority)}>
              {t(`notifications.priority.${item.priority}`)}
            </Badge>
            <Badge variant="outline">
              {t(`notifications.filter.${item.category}`)}
            </Badge>
            {!item.isRead && !item.isArchived && (
              <Badge variant="outline" className="text-[10px]">
                {t("notifications.unread")}
              </Badge>
            )}
            {item.isArchived && (
              <Badge variant="outline" className="text-[10px]">
                {t("notifications.archived")}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          {formatTimestamp(item.createdAt)}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="leading-relaxed">{item.body}</p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {item.actionHref && (
            <Button asChild variant="secondary" size="sm" className="rounded-lg">
              <Link href={item.actionHref}>
                {item.actionLabel || t("notifications.open")}
              </Link>
            </Button>
          )}
          {!item.isRead && !item.isArchived && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg"
              onClick={() => onMarkRead(item.id)}
            >
              {t("notifications.markRead")}
            </Button>
          )}
          {!item.isArchived && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg"
              onClick={() => onArchive(item.id)}
            >
              <Archive className="size-3.5 me-1" />
              {t("notifications.archive")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
