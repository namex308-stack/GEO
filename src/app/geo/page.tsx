"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { GeoTrackingView } from "@/components/app/geo-tracking-view";
import { ApiLoadError } from "@/components/runtime/api-load-error";
import { useT } from "@/lib/i18n";
import type { GeoTrackingSummary } from "@/lib/geo-tracking/types";

export default function GeoTrackingPage() {
  const t = useT();
  const [tracking, setTracking] = React.useState<GeoTrackingSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setError(null);
    setNeedsAuth(false);
    async function load() {
      try {
        const res = await fetch("/api/geo-tracking");
        if (!res.ok) {
          if (!cancelled) {
            setNeedsAuth(res.status === 401);
            setError(
              res.status === 401
                ? t("geoTracking.signInRequired")
                : t("geoTracking.loadError")
            );
          }
          return;
        }
        const data = (await res.json()) as { tracking: GeoTrackingSummary };
        if (!cancelled) setTracking(data.tracking);
      } catch {
        if (!cancelled) setError(t("geoTracking.loadError"));
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
        title={t("geoTracking.title")}
        subtitle={t("geoTracking.subtitle")}
        icon={Sparkles}
        back="/dashboard"
      />
      <PageContent className="max-w-5xl">
        {error ? (
          <ApiLoadError
            message={error}
            needsAuth={needsAuth}
            onRetry={() => setRetryKey((k) => k + 1)}
          />
        ) : tracking == null ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        ) : tracking.points.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card p-10 text-center text-sm text-muted-foreground">
            {t("geoTracking.empty")}
          </div>
        ) : (
          <GeoTrackingView tracking={tracking} />
        )}
      </PageContent>
    </PageShell>
  );
}
