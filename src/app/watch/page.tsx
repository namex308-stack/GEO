"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, Bell, ArrowUpRight, Clock, TrendingUp, TrendingDown, Plus, Loader2 } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/app/empty-state";
import { ScoreRadial } from "@/components/common/score-viz";
import { useT } from "@/lib/i18n";
import { crumbsForPath } from "@/lib/nav-config";
import { PlanGate } from "@/components/ui/plan-gate";
import type { PlanId } from "@/lib/billing/plans";
import { formatDistanceToNow } from "date-fns";

interface MonitoringJob {
  id: string;
  site_url: string;
  label: string | null;
  enabled: boolean;
  last_run_at: string | null;
  lastScore: number | null;
  prevScore: number | null;
  alertCount: number;
}

export default function WatchPage() {
  const t = useT();
  const [jobs, setJobs] = React.useState<MonitoringJob[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [canMonitor, setCanMonitor] = React.useState(false);
  const [plan, setPlan] = React.useState<PlanId>("free");

  const load = React.useCallback(() => {
    Promise.all([
      fetch("/api/monitoring").then((r) => (r.ok ? r.json() : { jobs: [] })),
      fetch("/api/billing").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([monitoring, billing]) => {
        setJobs(monitoring.jobs ?? []);
        setCanMonitor(!!billing?.limits?.hasMonitoring);
        setPlan((billing?.plan as PlanId) ?? "free");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const toggleJob = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/monitoring/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) load();
    } catch {
      /* network error, ignore */
    }
  };

  const totalAlerts = jobs.reduce((sum, j) => sum + (j.alertCount ?? 0), 0);
  const lastCheck = jobs.find((j) => j.last_run_at)?.last_run_at;

  const stats = [
    { icon: Eye, label: t("watch.pagesWatched"), value: String(jobs.length), color: "#FF6600" },
    { icon: Bell, label: t("watch.activeAlerts"), value: String(totalAlerts), color: "#cc5200" },
    { icon: Clock, label: t("watch.lastCheck"), value: lastCheck ? formatDistanceToNow(new Date(lastCheck), { addSuffix: true }) : "—", color: "#929292" },
  ];

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
      <PageHeader
        title={t("watch.title")}
        subtitle={t("watch.subtitle")}
        icon={Eye}
        back="/dashboard"
        crumbs={crumbsForPath("/watch")}
        actions={<Button asChild className="rounded-full shadow-glow"><Link href="/audit/new"><Plus className="size-4 ml-1" /> {t("watch.addWatch")}</Link></Button>}
      />
      <PageContent className="space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-2xl border border-border/60 bg-card p-5 flex items-center gap-4">
              <span className="size-11 rounded-xl grid place-items-center" style={{ background: `${s.color}1a`, color: s.color }}><s.icon className="size-5" /></span>
              <div><div className="font-display text-xl font-bold">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
            </motion.div>
          ))}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
            <h2 className="font-display text-lg font-bold">{t("watch.pagesWatched")}</h2>
            <Button variant="ghost" size="sm" className="rounded-full text-xs" asChild><Link href="/watch/alerts">{t("watch.viewAlerts")}</Link></Button>
          </div>
          {jobs.length === 0 ? (
            canMonitor ? (
              <EmptyState
                title={t("empty.noMonitoring")}
                ctaLabel={t("empty.noMonitoring.cta")}
                ctaHref="/audit/new"
                className="py-12"
              />
            ) : (
              <div className="px-6 py-8">
                <PlanGate plan={plan} feature="watchdog">{null}</PlanGate>
              </div>
            )
          ) : (
            <div className="divide-y divide-border/50">
              {jobs.map((w, i) => {
                const score = w.lastScore ?? 0;
                const prev = w.prevScore ?? score;
                const delta = score - prev;
                const hostname = w.label || (() => { try { return new URL(w.site_url).hostname; } catch { return w.site_url; } })();
                return (
                  <motion.div key={w.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <div className="flex items-center gap-4 px-6 py-4 hover:bg-accent/40 transition-colors text-right">
                      <Link href={`/watch/${w.id}/diff`} className="flex items-center gap-4 flex-1 min-w-0">
                        <ScoreRadial score={score} size={48} stroke={5} animate={false} />
                        <div className="flex-1 min-w-0 text-right">
                          <div className="text-sm font-semibold truncate">{hostname}</div>
                          <div className="text-xs text-muted-foreground truncate">{w.site_url}</div>
                        </div>
                        {w.alertCount > 0 && <Badge className="rounded-full bg-brand/15 text-brand border-0">{t("watch.alertsCount", { count: w.alertCount })}</Badge>}
                        <div className="hidden sm:flex items-center gap-1 text-xs">
                          {delta > 0 ? <TrendingUp className="size-3.5 text-primary" /> : delta < 0 ? <TrendingDown className="size-3.5 text-rose-500" /> : null}
                          <span className={delta > 0 ? "text-primary font-semibold" : delta < 0 ? "text-rose-500 font-semibold" : "text-muted-foreground"}>{delta > 0 ? `+${delta}` : delta}</span>
                        </div>
                        <span className="text-xs text-muted-foreground hidden md:block">
                          {w.last_run_at ? formatDistanceToNow(new Date(w.last_run_at), { addSuffix: true }) : "Pending"}
                        </span>
                        <ArrowUpRight className="size-4 text-muted-foreground" />
                      </Link>
                      {canMonitor && (
                        <Switch checked={w.enabled} onCheckedChange={(v) => toggleJob(w.id, v)} />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </PageContent>
    </PageShell>
  );
}
