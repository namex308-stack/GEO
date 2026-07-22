"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { GitCompare, ArrowDown, ArrowUp, Minus, Eye, Loader2 } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import type { ScoreBreakdown } from "@/lib/types";

type ChangeType = "improved" | "regressed" | "same" | "changed";

const CHANGE_META: Record<ChangeType, { icon: typeof ArrowUp; color: string; bg: string; label: string }> = {
  improved: { icon: ArrowUp, color: "#FF6600", bg: "bg-primary/10", label: "Improved" },
  regressed: { icon: ArrowDown, color: "#f43f5e", bg: "bg-rose-500/10", label: "Regressed" },
  same: { icon: Minus, color: "#929292", bg: "bg-muted", label: "Same" },
  changed: { icon: Eye, color: "#ff983f", bg: "bg-brand/10", label: "Changed" },
};

export default function DiffPage() {
  const params = useParams();
  const id = params.id as string;
  const t = useT();
  const [data, setData] = React.useState<{
    job: { label: string | null; site_url: string };
    comparison: {
      previousScore: number;
      currentScore: number;
      scoreDelta: number;
      newIssues: string[];
      regressedPillars: string[];
      improvedPillars: string[];
    } | null;
    currentBreakdown: ScoreBreakdown[];
    previousBreakdown: ScoreBreakdown[];
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/monitoring/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (!res) return;
        setData({
          job: res.job,
          comparison: res.comparison,
          currentBreakdown: (res.currentAudit?.breakdown as ScoreBreakdown[]) ?? [],
          previousBreakdown: (res.previousAudit?.breakdown as ScoreBreakdown[]) ?? [],
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !data) {
    return (
      <PageShell>
        <PageContent className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="size-8 animate-spin text-primary" />
        </PageContent>
      </PageShell>
    );
  }

  const comp = data.comparison;
  const before = comp?.previousScore ?? 0;
  const after = comp?.currentScore ?? 0;
  const delta = comp?.scoreDelta ?? 0;

  const diffs = data.currentBreakdown.map((curr) => {
    const prev = data.previousBreakdown.find((b) => b.pillar === curr.pillar);
    const prevScore = prev?.score ?? curr.score;
    let change: ChangeType = "same";
    if (curr.score > prevScore + 2) change = "improved";
    else if (curr.score < prevScore - 2) change = "regressed";
    else if (curr.summary !== prev?.summary) change = "changed";
    return { field: curr.label, before: String(prevScore), after: String(curr.score), change, impact: curr.summary };
  });

  const label = data.job.label || data.job.site_url;

  return (
    <PageShell>
      <PageHeader title={t("watch.diff.title")} subtitle={label} icon={GitCompare} back="/watch" />
      <PageContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border/60 bg-card p-5 text-center">
            <div className="text-xs text-muted-foreground mb-1">{t("watch.diff.before")}</div>
            <div className="font-display text-3xl font-bold text-muted-foreground">{before}</div>
          </div>
          <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 text-center">
            <div className="text-xs text-muted-foreground mb-1">{t("watch.diff.after")}</div>
            <div className="font-display text-3xl font-bold text-primary">{after}</div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5 text-center">
            <div className="text-xs text-muted-foreground mb-1">{t("watch.diff.change")}</div>
            <div className={`font-display text-3xl font-bold ${delta >= 0 ? "text-primary" : "text-rose-500"}`}>
              {delta > 0 ? `+${delta}` : delta}
            </div>
          </div>
        </div>

        {comp && comp.newIssues.length > 0 && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
            <h3 className="font-semibold text-sm mb-2">New issues</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              {comp.newIssues.map((issue, i) => <li key={i}>{issue}</li>)}
            </ul>
          </div>
        )}

        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60">
            <h2 className="font-display text-lg font-bold">{t("watch.diff.detected")}</h2>
          </div>
          {diffs.length === 0 ? (
            <p className="px-6 py-8 text-sm text-muted-foreground">No previous audit to compare. Check back after the next weekly run.</p>
          ) : (
            <div className="divide-y divide-border/50">
              {diffs.map((d, i) => {
                const m = CHANGE_META[d.change];
                return (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`size-7 rounded-lg grid place-items-center ${m.bg}`} style={{ color: m.color }}><m.icon className="size-4" /></span>
                      <span className="text-sm font-semibold">{d.field}</span>
                      <Badge variant="outline" className={`text-[10px] ${m.bg} border-0`} style={{ color: m.color }}>{m.label}</Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 mt-2">
                      <div className="rounded-lg bg-muted/30 p-3 border border-border/50">
                        <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">{t("watch.diff.before")}</div>
                        <p className="text-sm text-muted-foreground">{d.before}</p>
                      </div>
                      <div className="rounded-lg bg-primary/5 p-3 border border-primary/20">
                        <div className="text-[10px] font-bold uppercase text-primary mb-1">{t("watch.diff.after")}</div>
                        <p className="text-sm">{d.after}</p>
                      </div>
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
