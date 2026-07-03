"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Swords, TrendingUp, ArrowRight, Check, X, Minus } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT, type TranslationKey } from "@/lib/i18n";

type GapType = "strength" | "weakness" | "opportunity";
type GapIcon = typeof Check;

const COMPARISON: { pillarKey: TranslationKey; you: number; competitor: number; winner: "you" | "competitor" | "tie" }[] = [
  { pillarKey: "pillar.conversion", you: 78, competitor: 80, winner: "competitor" },
  { pillarKey: "pillar.seo", you: 85, competitor: 68, winner: "you" },
  { pillarKey: "pillar.geo", you: 71, competitor: 62, winner: "you" },
  { pillarKey: "pillar.trust", you: 88, competitor: 86, winner: "you" },
];

const GAPS: { type: GapType; titleKey: TranslationKey; descKey: TranslationKey; icon: GapIcon }[] = [
  { type: "strength", titleKey: "compare.gap1Title", descKey: "compare.gap1Desc", icon: Check },
  { type: "strength", titleKey: "compare.gap2Title", descKey: "compare.gap2Desc", icon: Check },
  { type: "weakness", titleKey: "compare.gap3Title", descKey: "compare.gap3Desc", icon: X },
  { type: "opportunity", titleKey: "compare.gap4Title", descKey: "compare.gap4Desc", icon: Minus },
];

export default function ComparePage() {
  const t = useT();

  return (
    <PageShell>
      <PageHeader title={t("compare.title")} subtitle={t("compare.subtitle")} icon={Swords} back="/audit/demo/report" />
      <PageContent className="space-y-6">
        {/* Score comparison */}
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-primary/40 bg-primary/5 p-6 text-center">
            <div className="font-display text-5xl font-extrabold text-primary">82</div>
            <div className="text-sm font-semibold mt-1">{t("report.you")}</div>
            <div className="text-xs text-muted-foreground mt-1">shop.example.com</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border/60 bg-card p-6 text-center">
            <div className="font-display text-5xl font-extrabold text-muted-foreground">74</div>
            <div className="text-sm font-semibold mt-1">{t("report.competitor")}</div>
            <div className="text-xs text-muted-foreground mt-1">competitor.com</div>
          </motion.div>
        </div>

        {/* Pillar comparison bars */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-display text-lg font-bold mb-5">{t("compare.pillarComparison")}</h2>
          <div className="space-y-4">
            {COMPARISON.map((c, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{t(c.pillarKey)}</span>
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

        {/* Gaps */}
        <div>
          <h2 className="font-display text-xl font-bold mb-4">{t("compare.gapAnalysis")}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {GAPS.map((g, i) => {
              const colors = { strength: "border-primary/30 bg-primary/5 text-primary", weakness: "border-rose-500/30 bg-rose-500/5 text-rose-500", opportunity: "border-brand/30 bg-brand/5 text-brand" };
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className={`rounded-2xl border p-5 ${colors[g.type]}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="size-8 rounded-lg bg-background/50 grid place-items-center"><g.icon className="size-4" /></span>
                    <h3 className="font-semibold text-sm text-foreground">{t(g.titleKey)}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{t(g.descKey)}</p>
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
            <Button asChild variant="secondary" className="mt-5 rounded-full font-semibold"><Link href="/audit/demo/generate">{t("compare.getFixes")} <ArrowRight className="size-4 ml-1" /></Link></Button>
          </div>
        </div>
      </PageContent>
    </PageShell>
  );
}
