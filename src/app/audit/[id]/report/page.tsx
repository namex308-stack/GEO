"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Zap, Search, Bot, ShieldCheck, ArrowRight, X, Check, TrendingUp, RotateCcw, Sparkles, Copy, Crown, Target, Clock, Gauge, ListChecks } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRadial, ScoreBar } from "@/components/common/score-viz";
import { useT, type TranslationKey } from "@/lib/i18n";

type PillarIcon = typeof Zap;

const PILLARS: { icon: PillarIcon; color: string; labelKey: TranslationKey; score: number; summaryKey: TranslationKey }[] = [
  { icon: Zap, color: "#FF6600", labelKey: "pillar.conversion", score: 78, summaryKey: "report.conversionSummary" },
  { icon: Search, color: "#ff983f", labelKey: "pillar.seo", score: 85, summaryKey: "report.seoSummary" },
  { icon: Bot, color: "#cc5200", labelKey: "pillar.geo", score: 71, summaryKey: "report.geoSummary" },
  { icon: ShieldCheck, color: "#929292", labelKey: "pillar.trust", score: 88, summaryKey: "report.trustSummary" },
];

const RECS: { pillarKey: TranslationKey; severityKey: TranslationKey; problemKey: TranslationKey; solutionKey: TranslationKey }[] = [
  { pillarKey: "pillar.conversion", severityKey: "severity.critical", problemKey: "report.rec1.problem", solutionKey: "report.rec1.solution" },
  { pillarKey: "pillar.geo", severityKey: "severity.critical", problemKey: "report.rec2.problem", solutionKey: "report.rec2.solution" },
  { pillarKey: "pillar.seo", severityKey: "severity.critical", problemKey: "report.rec3.problem", solutionKey: "report.rec3.solution" },
];

const COMPARISON: { pillarKey: TranslationKey; you: number; competitor: number }[] = [
  { pillarKey: "pillar.conversion", you: 78, competitor: 80 },
  { pillarKey: "pillar.seo", you: 85, competitor: 68 },
  { pillarKey: "pillar.geo", you: 71, competitor: 62 },
  { pillarKey: "pillar.trust", you: 88, competitor: 86 },
];

export default function ReportPage() {
  const t = useT();
  const comparisonData = COMPARISON.map((c) => ({ pillar: t(c.pillarKey), you: c.you, competitor: c.competitor }));

  return (
    <PageShell>
      <PageHeader
        title={t("report.title")}
        subtitle="shop.example.com/products/argan-glow-serum"
        icon={Gauge}
        back="/dashboard"
        actions={
          <>
            <Button variant="ghost" size="sm" className="rounded-full hidden sm:inline-flex"><RotateCcw className="size-4 ml-1" /> {t("report.reaudit")}</Button>
            <Button asChild size="sm" className="rounded-full"><Link href="/audit/demo/generate"><Sparkles className="size-4 ml-1" /> {t("report.aiGenerator")}</Link></Button>
          </>
        }
      />
      <PageContent className="space-y-8">
        {/* Executive summary */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 blur-3xl rounded-full -z-0" />
          <div className="relative grid lg:grid-cols-[auto_1fr] gap-8 items-center">
            <div className="flex flex-col items-center text-center">
              <ScoreRadial score={82} size={180} stroke={12} label={t("report.storeScore")} />
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"><TrendingUp className="size-4" /> {t("report.vsCompetitor", { count: 8 })}</div>
            </div>
            <div>
              <Badge variant="outline" className="rounded-full mb-3 gap-1.5 border-primary/30 bg-primary/5 text-primary"><Sparkles className="size-3" /> {t("report.auditComplete")}</Badge>
              <h1 className="font-display text-2xl font-bold">سيروم الأركان للوجه 30مل</h1>
              <p className="mt-1 text-sm text-muted-foreground break-all">https://shop.example.com/products/argan-glow-serum</p>
              <div className="mt-5 grid sm:grid-cols-3 gap-3">
                {[{ icon: Zap, labelKey: "report.criticalIssues" as TranslationKey, value: "3", tone: "rose" as const }, { icon: TrendingUp, labelKey: "report.projectedLift" as TranslationKey, value: t("report.pointsValue", { count: 30 }), tone: "primary" as const }, { icon: ListChecks, labelKey: "report.recommendations" as TranslationKey, value: "8", tone: "brand" as const }].map((s, i) => {
                  const colors = { rose: "bg-rose-500/10 text-rose-500", primary: "bg-primary/10 text-primary", brand: "bg-brand/10 text-brand" };
                  return (
                    <div key={i} className="rounded-xl border border-border/50 bg-background/50 p-3.5 flex items-center gap-3">
                      <span className={`size-9 rounded-lg grid place-items-center shrink-0 ${colors[s.tone]}`}><s.icon className="size-5" /></span>
                      <div><div className="font-display text-lg font-bold tabular-nums">{s.value}</div><div className="text-[11px] text-muted-foreground mt-0.5">{t(s.labelKey)}</div></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pillars */}
        <div>
          <h2 className="font-display text-2xl font-bold mb-5">{t("report.scoreBreakdown")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PILLARS.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="size-10 rounded-xl grid place-items-center" style={{ background: `${p.color}1a`, color: p.color }}><p.icon className="size-5" /></span>
                  <span className="font-display text-2xl font-extrabold tabular-nums" style={{ color: p.color }}>{p.score}</span>
                </div>
                <div className="font-semibold text-sm">{t(p.labelKey)}</div>
                <div className="mt-2.5"><ScoreBar score={p.score} label="" /></div>
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{t(p.summaryKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Comparison */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="font-display text-lg font-bold flex items-center gap-2"><TrendingUp className="size-5 text-primary" /> {t("report.competitorComparison")}</h2>
            <div className="mt-5 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis type="category" dataKey="pillar" tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12, fontWeight: 600 }} width={70} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="competitor" radius={[0, 6, 6, 0]} fill="oklch(0.63 0 0 / 0.35)" barSize={14} />
                  <Bar dataKey="you" radius={[0, 6, 6, 0]} fill="#FF6600" barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-5 text-xs mt-2">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" /> {t("report.you")}</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-muted-foreground/40" /> {t("report.competitor")}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/5 to-transparent p-6">
            <div className="flex items-center gap-2 mb-1"><Bot className="size-5 text-brand" /><h2 className="font-display text-lg font-bold">{t("report.geoTitle")}</h2></div>
            <p className="text-sm text-muted-foreground">{t("report.geoSub")}</p>
            <div className="mt-5 grid grid-cols-3 gap-4">
              {[{ n: "ChatGPT", s: 73 }, { n: "Perplexity", s: 69 }, { n: "Google AI", s: 71 }].map((g) => (
                <div key={g.n} className="text-center rounded-xl border border-border/50 bg-background/40 p-4">
                  <ScoreRadial score={g.s} size={88} stroke={7} gold />
                  <div className="text-xs font-semibold mt-2">{g.n}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h2 className="font-display text-2xl font-bold mb-5">{t("report.aiRecommendations")}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {RECS.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30">
                  <span className="text-xs font-semibold">{t(r.pillarKey)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">{t(r.severityKey)}</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-2.5">
                    <span className="size-5 rounded-full bg-rose-500/15 grid place-items-center shrink-0 mt-0.5"><X className="size-3 text-rose-500" /></span>
                    <div><div className="text-[10px] font-bold uppercase text-rose-500 mb-0.5">{t("report.problem")}</div><p className="text-sm text-muted-foreground">{t(r.problemKey)}</p></div>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="size-5 rounded-full bg-primary/15 grid place-items-center shrink-0 mt-0.5"><Check className="size-3 text-primary" /></span>
                    <div><div className="text-[10px] font-bold uppercase text-primary mb-0.5">{t("report.solution")}</div><p className="text-sm text-foreground/90">{t(r.solutionKey)}</p></div>
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-border/50 bg-muted/20 flex items-center gap-2 text-[11px]">
                  <Target className="size-3" /> {t("report.highImpact")} · <Clock className="size-3" /> {t("report.quickFix")}
                  <Button size="sm" variant="ghost" className="mr-auto h-7 px-2 text-[11px] rounded-full"><Copy className="size-3 ml-1" /> {t("report.copyFix")}</Button>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-8 text-center">
            <Crown className="size-8 text-brand mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold">{t("report.moreOnPro", { count: 5 })}</h3>
            <Button asChild className="mt-4 rounded-full shadow-glow"><Link href="/pricing"><Crown className="size-4 ml-1" /> {t("report.upgradePro")}</Link></Button>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl gradient-brand p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-dots opacity-20" />
          <div className="relative">
            <h3 className="font-display text-2xl font-bold">{t("report.applyFixes")}</h3>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Button asChild variant="secondary" className="rounded-full font-semibold"><Link href="/audit/demo/generate">{t("report.aiGenerator")}</Link></Button>
              <Button asChild variant="outline" className="rounded-full font-semibold bg-white/10 border-white/30 text-white hover:bg-white/20"><Link href="/audit/demo/compare">{t("compare.title")} <ArrowRight className="size-4 ml-1" /></Link></Button>
            </div>
          </div>
        </div>
      </PageContent>
    </PageShell>
  );
}
