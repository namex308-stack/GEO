"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { AlertsView } from "@/components/app/alerts-view";
import { ApiLoadError } from "@/components/runtime/api-load-error";
import { useT } from "@/lib/i18n";
import type { AlertsOverview } from "@/lib/alerts/types";

export default function AlertsPage() {
  const t = useT();
  const [overview, setOverview] = React.useState<AlertsOverview | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setError(null);
    setNeedsAuth(false);
    async function load() {
      try {
        const res = await fetch("/api/alerts");
        if (!res.ok) {
          if (!cancelled) {
            setNeedsAuth(res.status === 401);
            setError(
              res.status === 401 ? t("alerts.signInRequired") : t("alerts.loadError")
            );
          }
          return;
        }
        const data = (await res.json()) as { alerts: AlertsOverview };
        if (!cancelled) setOverview(data.alerts);
      } catch {
        if (!cancelled) setError(t("alerts.loadError"));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [t, retryKey]);

  const markRead = async (id: string) => {
    const res = await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { alert: AlertsOverview["alerts"][number] };
    setOverview((prev) => {
      if (!prev) return prev;
      const alerts = prev.alerts.map((a) => (a.id === id ? data.alert : a));
      return {
        ...prev,
        alerts,
        unreadCount: alerts.filter((a) => !a.isRead).length,
      };
    });
  };

  const markAllRead = async () => {
    const res = await fetch("/api/alerts", {
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
        alerts: prev.alerts.map((a) => ({
          ...a,
          isRead: true,
          readAt: a.readAt ?? now,
        })),
      };
    });
  };

  return (
    <PageShell>
      <PageHeader
        title={t("alerts.title")}
        subtitle={t("alerts.subtitle")}
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
          <AlertsView
            overview={overview}
            onMarkRead={(id) => void markRead(id)}
            onMarkAllRead={() => void markAllRead()}
          />
        )}
      </PageContent>
    </PageShell>
  );
}
