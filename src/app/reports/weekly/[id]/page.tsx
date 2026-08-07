"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { WeeklyReportView } from "@/components/app/weekly-report-view";
import { ApiLoadError } from "@/components/runtime/api-load-error";
import { useT } from "@/lib/i18n";
import type { WeeklyReportPayload } from "@/lib/weekly-report/types";

type ReportResponse = {
  id: string;
  latestAuditId: string | null;
  periodStart: string;
  periodEnd: string;
  payload: WeeklyReportPayload;
};

export default function WeeklyReportDetailPage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [report, setReport] = React.useState<ReportResponse | null>(null);
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
        const res = await fetch(`/api/weekly-report/${id}`);
        if (!res.ok) {
          if (!cancelled) {
            setReport(null);
            setNeedsAuth(res.status === 401);
            setError(
              res.status === 404
                ? t("weeklyReport.notFound")
                : res.status === 401
                  ? t("weeklyReport.signInRequired")
                  : t("weeklyReport.loadError")
            );
          }
          return;
        }
        const data = (await res.json()) as { report: ReportResponse };
        if (!cancelled) setReport(data.report);
      } catch {
        if (!cancelled) {
          setReport(null);
          setError(t("weeklyReport.loadError"));
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
        title={report?.payload.storeName || t("weeklyReport.title")}
        subtitle={
          report
            ? `${report.periodStart.slice(0, 10)} → ${report.periodEnd.slice(0, 10)}`
            : t("weeklyReport.subtitle")
        }
        icon={FileText}
        back="/reports/weekly"
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
        ) : report ? (
          <WeeklyReportView
            reportId={report.id}
            payload={report.payload}
            latestAuditId={report.latestAuditId}
          />
        ) : null}
      </PageContent>
    </PageShell>
  );
}
