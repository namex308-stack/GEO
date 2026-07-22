"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, AlertTriangle, TrendingDown, Eye, ArrowUpRight, Loader2 } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { crumbsForPath } from "@/lib/nav-config";
import { formatDistanceToNow } from "date-fns";

type Severity = "critical" | "warning" | "info";

const TYPE_SEVERITY: Record<string, Severity> = {
  alert: "critical",
  issue: "warning",
  report: "info",
};

const SEVERITY: Record<Severity, { color: string; bg: string; label: string }> = {
  critical: { color: "#f43f5e", bg: "bg-rose-500/10", label: "Critical" },
  warning: { color: "#ff983f", bg: "bg-brand/10", label: "Warning" },
  info: { color: "#929292", bg: "bg-muted", label: "Info" },
};

const ICONS = {
  alert: TrendingDown,
  issue: AlertTriangle,
  report: Eye,
};

export default function AlertsPage() {
  const t = useT();
  const [alerts, setAlerts] = React.useState<Array<{
    id: string;
    type: string;
    subject: string;
    monitoring_job_id: string | null;
    created_at: string;
  }>>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/monitoring")
      .then((r) => (r.ok ? r.json() : { jobs: [] }))
      .then(async (data) => {
        const all: typeof alerts = [];
        for (const job of data.jobs ?? []) {
          const res = await fetch(`/api/monitoring/${job.id}`);
          if (!res.ok) continue;
          const detail = await res.json();
          for (const n of detail.notifications ?? []) {
            all.push({ ...n, monitoring_job_id: job.id });
          }
        }
        all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setAlerts(all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageShell>
        <PageContent className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="size-8 animate-spin text-primary" />
        </PageContent>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader title={t("watch.alerts.title")} subtitle={t("watch.alerts.subtitle")} icon={Bell} back="/watch" crumbs={crumbsForPath("/watch/alerts")} />
      <PageContent className="max-w-3xl space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No alerts yet. Notifications appear after weekly monitoring runs.</p>
        ) : (
          alerts.map((a, i) => {
            const severity = TYPE_SEVERITY[a.type] ?? "info";
            const s = SEVERITY[severity];
            const Icon = ICONS[a.type as keyof typeof ICONS] ?? Eye;
            return (
              <motion.div key={a.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                <Link href={a.monitoring_job_id ? `/watch/${a.monitoring_job_id}/diff` : "/watch"} className="block rounded-2xl border border-border/60 bg-card p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <span className={`size-10 rounded-xl grid place-items-center shrink-0 ${s.bg}`} style={{ color: s.color }}>
                      <Icon className="size-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{a.subject}</h3>
                        <Badge variant="outline" className={`text-[10px] ${s.bg} border-0`} style={{ color: s.color }}>{s.label}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <ArrowUpRight className="size-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
      </PageContent>
    </PageShell>
  );
}
