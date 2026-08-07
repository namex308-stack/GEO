"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { NotificationsView } from "@/components/app/notifications-view";
import { ApiLoadError } from "@/components/runtime/api-load-error";
import { useT } from "@/lib/i18n";
import type { NotificationsOverview } from "@/lib/notifications/types";

export default function NotificationsPage() {
  const t = useT();
  const [overview, setOverview] = React.useState<NotificationsOverview | null>(null);
  const [filter, setFilter] =
    React.useState<NotificationsOverview["filter"]>("all");
  const [error, setError] = React.useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setError(null);
    setNeedsAuth(false);
    async function load() {
      try {
        const qs =
          filter === "all" ? "" : `?category=${encodeURIComponent(filter)}`;
        const res = await fetch(`/api/notifications${qs}`);
        if (!res.ok) {
          if (!cancelled) {
            setNeedsAuth(res.status === 401);
            setError(
              res.status === 401
                ? t("notifications.signInRequired")
                : t("notifications.loadError")
            );
          }
          return;
        }
        const data = (await res.json()) as { notifications: NotificationsOverview };
        if (!cancelled) setOverview(data.notifications);
      } catch {
        if (!cancelled) setError(t("notifications.loadError"));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [t, retryKey, filter]);

  const markRead = async (id: string) => {
    const res = await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read" }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      notification: NotificationsOverview["notifications"][number];
    };
    setOverview((prev) => {
      if (!prev) return prev;
      const notifications = prev.notifications.map((n) =>
        n.id === id ? data.notification : n
      );
      return {
        ...prev,
        notifications,
        unreadCount: Math.max(0, prev.unreadCount - (prev.notifications.find((n) => n.id === id && !n.isRead) ? 1 : 0)),
      };
    });
  };

  const archive = async (id: string) => {
    const res = await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive" }),
    });
    if (!res.ok) return;
    setOverview((prev) => {
      if (!prev) return prev;
      const wasUnread = prev.notifications.some((n) => n.id === id && !n.isRead);
      return {
        ...prev,
        notifications:
          prev.filter === "archived"
            ? prev.notifications
            : prev.notifications.filter((n) => n.id !== id),
        unreadCount: Math.max(0, prev.unreadCount - (wasUnread ? 1 : 0)),
        archivedCount: prev.archivedCount + 1,
      };
    });
  };

  const markAllRead = async () => {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read_all" }),
    });
    if (!res.ok) return;
    setOverview((prev) => {
      if (!prev) return prev;
      const now = new Date().toISOString();
      return {
        ...prev,
        unreadCount: 0,
        notifications: prev.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt ?? now,
        })),
      };
    });
  };

  return (
    <PageShell>
      <PageHeader
        title={t("notifications.title")}
        subtitle={t("notifications.subtitle")}
        icon={Bell}
        back="/dashboard"
      />
      <PageContent className="max-w-4xl">
        {error ? (
          <ApiLoadError
            message={error}
            needsAuth={needsAuth}
            onRetry={() => setRetryKey((k) => k + 1)}
          />
        ) : overview == null ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        ) : (
          <NotificationsView
            overview={overview}
            onFilter={(next) => {
              setFilter(next);
              setOverview(null);
            }}
            onMarkRead={(id) => void markRead(id)}
            onArchive={(id) => void archive(id)}
            onMarkAllRead={() => void markAllRead()}
          />
        )}
      </PageContent>
    </PageShell>
  );
}
