"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Loader2, Swords } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { CompetitorTargetDetailView } from "@/components/app/competitor-monitor-view";
import { ApiLoadError } from "@/components/runtime/api-load-error";
import { useT } from "@/lib/i18n";
import type { CompetitorTargetDetail } from "@/lib/competitor-monitor/types";

export default function CompetitorMonitorDetailPage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [detail, setDetail] = React.useState<CompetitorTargetDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [retryKey, setRetryKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      setNeedsAuth(false);
      try {
        const res = await fetch(`/api/competitor-monitor/${id}`);
        if (!res.ok) {
          if (!cancelled) {
            setDetail(null);
            setNeedsAuth(res.status === 401);
            setError(
              res.status === 404
                ? t("monitor.notFound")
                : res.status === 401
                  ? t("monitor.signInRequired")
                  : t("monitor.loadError")
            );
          }
          return;
        }
        const data = (await res.json()) as { detail: CompetitorTargetDetail };
        if (!cancelled) setDetail(data.detail);
      } catch {
        if (!cancelled) {
          setDetail(null);
          setError(t("monitor.loadError"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, retryKey, t]);

  return (
    <PageShell>
      <PageHeader
        title={detail?.target.label || detail?.target.url || t("monitor.title")}
        subtitle={t("monitor.subtitle")}
        icon={Swords}
        back="/monitor"
      />
      <PageContent className="max-w-4xl">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="size-8 animate-spin mx-auto text-primary" />
          </div>
        ) : error ? (
          <ApiLoadError
            message={error}
            needsAuth={needsAuth}
            onRetry={() => setRetryKey((k) => k + 1)}
          />
        ) : detail ? (
          <CompetitorTargetDetailView detail={detail} />
        ) : null}
      </PageContent>
    </PageShell>
  );
}
