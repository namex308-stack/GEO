"use client";

import * as React from "react";
import { HeartPulse } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { StoreHealthView } from "@/components/app/store-health-view";
import { ApiLoadError } from "@/components/runtime/api-load-error";
import { useT } from "@/lib/i18n";
import type { StoreHealthPayload } from "@/lib/store-health/types";

export default function StoreHealthPage() {
  const t = useT();
  const [health, setHealth] = React.useState<StoreHealthPayload | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setError(null);
    setNeedsAuth(false);
    async function load() {
      try {
        const res = await fetch("/api/store-health");
        if (!res.ok) {
          if (!cancelled) {
            setNeedsAuth(res.status === 401);
            setError(
              res.status === 401
                ? t("storeHealth.signInRequired")
                : t("storeHealth.loadError")
            );
          }
          return;
        }
        const data = (await res.json()) as { health: StoreHealthPayload };
        if (!cancelled) setHealth(data.health);
      } catch {
        if (!cancelled) setError(t("storeHealth.loadError"));
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
        title={t("storeHealth.title")}
        subtitle={t("storeHealth.subtitle")}
        icon={HeartPulse}
        back="/dashboard"
      />
      <PageContent className="max-w-5xl">
        {error ? (
          <ApiLoadError
            message={error}
            needsAuth={needsAuth}
            onRetry={() => setRetryKey((k) => k + 1)}
          />
        ) : health == null ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        ) : (
          <StoreHealthView health={health} />
        )}
      </PageContent>
    </PageShell>
  );
}
