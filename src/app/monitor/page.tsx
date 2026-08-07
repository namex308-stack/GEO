"use client";

import * as React from "react";
import { Swords } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { CompetitorMonitorOverviewView } from "@/components/app/competitor-monitor-view";
import { ApiLoadError } from "@/components/runtime/api-load-error";
import { useT } from "@/lib/i18n";
import type { CompetitorMonitorOverview } from "@/lib/competitor-monitor/types";

export default function CompetitorMonitorPage() {
  const t = useT();
  const [monitor, setMonitor] = React.useState<CompetitorMonitorOverview | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setError(null);
    setNeedsAuth(false);
    async function load() {
      try {
        const res = await fetch("/api/competitor-monitor");
        if (!res.ok) {
          if (!cancelled) {
            setNeedsAuth(res.status === 401);
            setError(
              res.status === 401 ? t("monitor.signInRequired") : t("monitor.loadError")
            );
          }
          return;
        }
        const data = (await res.json()) as { monitor: CompetitorMonitorOverview };
        if (!cancelled) setMonitor(data.monitor);
      } catch {
        if (!cancelled) setError(t("monitor.loadError"));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [t, retryKey]);

  return (
    <PageShell>
      <PageHeader
        title={t("monitor.title")}
        subtitle={t("monitor.subtitle")}
        icon={Swords}
        back="/dashboard"
      />
      <PageContent className="max-w-4xl">
        {error ? (
          <ApiLoadError
            message={error}
            needsAuth={needsAuth}
            onRetry={() => setRetryKey((k) => k + 1)}
          />
        ) : monitor == null ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        ) : (
          <CompetitorMonitorOverviewView monitor={monitor} />
        )}
      </PageContent>
    </PageShell>
  );
}
