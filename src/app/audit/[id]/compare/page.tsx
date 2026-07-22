"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Swords, TrendingUp, ArrowRight, Check, X, Minus, Loader2 } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { crumbsForPath } from "@/lib/nav-config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { useAuditOrRedirect } from "@/hooks/use-audit-loader";
import { useUserPlan } from "@/hooks/use-user-plan";
import { canAccessFeature } from "@/lib/plan-gates";
import { PlanGate } from "@/components/ui/plan-gate";
import type { ScoreBreakdown } from "@/lib/types";

export default function ComparePage() {
  const t = useT();
  const params = useParams();
  const auditId = params.id as string;
  const { audit, loading } = useAuditOrRedirect(auditId);
  const { plan: userPlan } = useUserPlan();

  if (loading || !audit) {
    return <PageShell><PageContent className="flex items-center justify-center min-h-[50vh]"><Loader2 className="size-8 animate-spin text-primary" /></PageContent></PageShell>;
  }

  if (!canAccessFeature(userPlan, "competitor")) {
    return (
      <PageShell>
        <PageHeader title={t("compare.title")} subtitle={t("compare.subtitle")} icon={Swords} back={`/audit/${auditId}/report`} crumbs={crumbsForPath(`/audit/${auditId}/compare`)} />
        <PageContent>
          <PlanGate plan={userPlan} feature="competitor">{null}</PlanGate>
        </PageContent>
      </PageShell>
    );
  }

  const breakdown = audit.breakdown ?? [];
  const competitorBreakdown = audit.competitorBreakdown ?? [];
  const hasCompetitor = competitorBreakdown.length > 0;

  const comparison = breakdown.map((b: ScoreBreakdown) => {
    const comp = competitorBreakdown.find((c: ScoreBreakdown) => c.pillar === b.pillar);
    const compScore = comp?.score ?? 0;
    const winner = b.score > compScore ? "you" as const : b.score < compScore ? "competitor" as const : "tie" as const;
    return { pillar: b.label, you: b.score, competitor: compScore, winner };
  });

  const gaps = breakdown.map((b: ScoreBreakdown) => {
    const comp = competitorBreakdown.find((c: ScoreBreakdown) => c.pillar === b.pillar);
    const compScore = comp?.score ?? 0;
    const delta = b.score - compScore;
    if (delta >= 10) return { type: "strength" as const, title: `Strong ${b.label}`, desc: `You lead by ${delta} points in ${b.label.toLowerCase()}.`, icon: Check };
    if (delta <= -5) return { type: "weakness" as const, title: `${b.label} gap`, desc: `Competitor leads by ${Math.abs(delta)} points. Focus on improving this pillar.`, icon: X };
    return { type: "opportunity" as const, title: `${b.label} close`, desc: `Only ${Math.abs(delta)} points apart — small improvements can flip this.`, icon: Minus };
  });

  const productHost = (() => { try { return new URL(audit.productUrl).hostname; } catch { return audit.productUrl; } })();
  const competitorHost = (() => { try { return new URL(audit.competitorUrl ?? "").hostname; } catch { return "competitor"; } })();

  return (
    <PageShell>
      <PageHeader title={t("compare.title")} subtitle={t("compare.subtitle")} icon={Swords} back={`/audit/${auditId}/report`} crumbs={crumbsForPath(`/audit/${auditId}/compare`)} />
      <PageContent className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-primary/40 bg-primary/5 p-6 text-center">
            <div className="font-display text-5xl font-extrabold text-primary">{audit.overallScore}</div>
            <div className="text-sm font-semibold mt-1">{t("report.you")}</div>
            <div className="text-xs text-muted-foreground mt-1">{productHost}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border/60 bg-card p-6 text-center">
            <div className="font-display text-5xl font-extrabold text-muted-foreground">{audit.competitorScore ?? "—"}</div>
            <div className="text-sm font-semibold mt-1">{t("report.competitor")}</div>
            <div className="text-xs text-muted-foreground mt-1">{competitorHost}</div>
          </motion.div>
        </div>

        {hasCompetitor && (
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="font-display text-lg font-bold mb-5">{t("compare.pillarComparison")}</h2>
            <div className="space-y-4">
              {comparison.map((c, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{c.pillar}</span>
                    <Badge variant="outline" className={c.winner === "you" ? "text-primary border-primary/30" : c.winner === "competitor" ? "text-rose-500 border-rose-500/30" : ""}>
                      {c.winner === "you" ? t("compare.win") : c.winner === "competitor" ? t("compare.lose") : t("compare.tie")}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span>{t("report.you")}</span><span className="font-bold text-primary">{c.you}</span></div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden"><motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} whileInView={{ width: `${c.you}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.1 }} /></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span>{t("report.competitor")}</span><span className="font-bold">{c.competitor}</span></div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden"><motion.div className="h-full rounded-full bg-muted-foreground/50" initial={{ width: 0 }} whileInView={{ width: `${c.competitor}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: i * 0.1 + 0.1 }} /></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="font-display text-xl font-bold mb-4">{t("compare.gapAnalysis")}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {gaps.map((g, i) => {
              const colors = { strength: "border-primary/30 bg-primary/5 text-primary", weakness: "border-rose-500/30 bg-rose-500/5 text-rose-500", opportunity: "border-brand/30 bg-brand/5 text-brand" };
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className={`rounded-2xl border p-5 ${colors[g.type]}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="size-8 rounded-lg bg-background/50 grid place-items-center"><g.icon className="size-4" /></span>
                    <h3 className="font-semibold text-sm text-foreground">{g.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{g.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl gradient-brand p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-dots opacity-20" />
          <div className="relative">
            <TrendingUp className="size-8 mx-auto mb-3" />
            <h3 className="font-display text-xl font-bold">{t("compare.projectedAfter")}</h3>
            <p className="mt-2 text-white/85">{t("compare.applyConversion")}</p>
            <Button asChild variant="secondary" className="mt-5 rounded-full font-semibold"><Link href={`/audit/${auditId}/generate`}>{t("compare.getFixes")} <ArrowRight className="size-4 ml-1" /></Link></Button>
          </div>
        </div>
      </PageContent>
    </PageShell>
  );
}
