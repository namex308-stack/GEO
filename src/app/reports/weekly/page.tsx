"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, ChevronLeft } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { ApiLoadError } from "@/components/runtime/api-load-error";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useT } from "@/lib/i18n";
import type { WeeklyReportListItem } from "@/lib/weekly-report/types";
import { cn } from "@/lib/utils";
import { decodeHtmlEntities } from "@/lib/text/decode-html";

export default function WeeklyReportsPage() {
  const t = useT();
  const [reports, setReports] = React.useState<WeeklyReportListItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setError(null);
    setNeedsAuth(false);
    async function load() {
      try {
        const res = await fetch("/api/weekly-report");
        if (!res.ok) {
          if (!cancelled) {
            setNeedsAuth(res.status === 401);
            setError(
              res.status === 401
                ? t("weeklyReport.signInRequired")
                : t("weeklyReport.loadError")
            );
          }
          return;
        }
        const data = (await res.json()) as { reports: WeeklyReportListItem[] };
        if (!cancelled) setReports(data.reports ?? []);
      } catch {
        if (!cancelled) setError(t("weeklyReport.loadError"));
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
        title={t("weeklyReport.title")}
        subtitle={t("weeklyReport.subtitle")}
        icon={FileText}
        back="/dashboard"
      />
      <PageContent className="max-w-3xl space-y-4">
        {error ? (
          <ApiLoadError
            message={error}
            needsAuth={needsAuth}
            onRetry={() => setRetryKey((k) => k + 1)}
          />
        ) : reports == null ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {t("weeklyReport.empty")}
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {reports.map((report) => (
              <li key={report.id}>
                <Link
                  href={`/reports/weekly/${report.id}`}
                  className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Card className="transition-colors hover:border-primary/30">
                    <CardContent className="flex items-center justify-between gap-4 py-5">
                      <div className="min-w-0">
                        <p className="font-display font-bold truncate">{decodeHtmlEntities(report.storeName)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {report.periodStart.slice(0, 10)} → {report.periodEnd.slice(0, 10)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("weeklyReport.meaningfulCount", {
                            count: report.meaningfulChangeCount,
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "tabular-nums",
                            (report.overallDelta ?? 0) > 0 &&
                              "bg-emerald-500/15 text-emerald-700",
                            (report.overallDelta ?? 0) < 0 &&
                              "bg-rose-500/15 text-rose-700"
                          )}
                        >
                          {report.overallScore ?? "—"}
                          {report.overallDelta != null
                            ? ` (${report.overallDelta > 0 ? "+" : ""}${report.overallDelta})`
                            : ""}
                        </Badge>
                        <ChevronLeft className="size-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageContent>
    </PageShell>
  );
}
