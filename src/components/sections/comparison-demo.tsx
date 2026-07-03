"use client";

import { motion } from "framer-motion";
import { X, Check, ArrowRight, AlertTriangle, Lightbulb, Zap } from "lucide-react";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";

const RECS = [
  {
    pillar: "Conversion",
    severity: "critical",
    problemKey: "compDemo.rec1.problem",
    solutionKey: "compDemo.rec1.solution",
  },
  {
    pillar: "GEO / AI",
    severity: "critical",
    problemKey: "compDemo.rec2.problem",
    solutionKey: "compDemo.rec2.solution",
  },
] as const;

const SEVERITY = {
  critical: { icon: Zap, color: "#f43f5e", label: "Critical", bg: "bg-rose-500/10" },
  warning: { icon: AlertTriangle, color: "#ff983f", label: "Warning", bg: "bg-brand/10" },
  opportunity: { icon: Lightbulb, color: "#FF6600", label: "Opportunity", bg: "bg-primary/10" },
};

export function ComparisonDemo() {
  const { startAuditAndNavigate } = useNavigateAfterAction();
  const t = useT();
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">{t("compDemo.eyebrow")}</span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-balance">
            {t("compDemo.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            {t("compDemo.subtitle")}
          </p>
        </div>

        <div className="mt-12 grid lg:grid-cols-2 gap-6">
          {RECS.map((r, i) => {
            const s = SEVERITY[r.severity as keyof typeof SEVERITY];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-2xl border border-border/60 bg-card overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-muted/40">
                  <div className="flex items-center gap-2">
                    <span className={`size-7 rounded-lg grid place-items-center ${s.bg}`} style={{ color: s.color }}>
                      <s.icon className="size-4" />
                    </span>
                    <span className="text-sm font-semibold">{r.pillar}</span>
                  </div>
                  <Badge variant="outline" className="rounded-full text-[10px] uppercase tracking-wider" style={{ color: s.color, borderColor: `${s.color}40` }}>
                    {s.label}
                  </Badge>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex gap-3">
                    <span className="size-6 rounded-full bg-rose-500/15 grid place-items-center shrink-0 mt-0.5">
                      <X className="size-3.5 text-rose-500" />
                    </span>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-rose-500 mb-1">{t("compDemo.problem")}</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{t(r.problemKey)}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="size-6 rounded-full bg-primary/15 grid place-items-center shrink-0 mt-0.5">
                      <Check className="size-3.5 text-primary" />
                    </span>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">{t("compDemo.solution")}</div>
                      <p className="text-sm text-foreground/90 leading-relaxed">{t(r.solutionKey)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">Projected impact</span>
                    <span className="text-sm font-bold text-primary">{t("compDemo.impact")}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Button size="lg" onClick={startAuditAndNavigate} className="rounded-full font-semibold h-12 px-8 shadow-glow group">
            {t("compDemo.cta")}
            <ArrowRight className="size-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}
