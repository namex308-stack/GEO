"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileSearch, Zap, Search, Bot, ShieldCheck, Cpu, Check, Loader2 } from "lucide-react";
import { PageShell, PageContent } from "@/components/app/page-shell";
import { cn } from "@/lib/utils";
import { useT, type TranslationKey } from "@/lib/i18n";

type PhaseIcon = typeof FileSearch;

const PHASES: { icon: PhaseIcon; labelKey: TranslationKey; detailKey: TranslationKey }[] = [
  { icon: FileSearch, labelKey: "scanning.reading", detailKey: "scanning.readingDetail" },
  { icon: Zap, labelKey: "scanning.conversion", detailKey: "scanning.conversionDetail" },
  { icon: Search, labelKey: "scanning.seo", detailKey: "scanning.seoDetail" },
  { icon: Bot, labelKey: "scanning.geo", detailKey: "scanning.geoDetail" },
  { icon: ShieldCheck, labelKey: "scanning.trust", detailKey: "scanning.trustDetail" },
  { icon: Cpu, labelKey: "scanning.recommendations", detailKey: "scanning.recommendationsDetail" },
];

export default function ScanningPage() {
  const t = useT();
  const [phase, setPhase] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setPhase((p) => {
        if (p >= PHASES.length - 1) {
          clearInterval(timer);
          setTimeout(() => { window.location.href = "/audit/demo/report"; }, 800);
          return p;
        }
        return p + 1;
      });
    }, 900);
    return () => clearInterval(timer);
  }, []);

  return (
    <PageShell>
      <PageContent className="max-w-xl">
        <div className="text-center mb-10">
          <div className="mx-auto size-16 rounded-2xl gradient-brand grid place-items-center text-white shadow-glow mb-5 relative">
            <Cpu className="size-8" />
            <span className="absolute inset-0 rounded-2xl border-2 border-primary/40 animate-pulse-ring" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold">{t("scanning.analyzing")}</h2>
          <p className="mt-2 text-muted-foreground text-sm">{t("scanning.takesTime")}</p>
        </div>

        <div className="space-y-2.5">
          {PHASES.map((p, i) => {
            const done = i < phase;
            const active = i === phase;
            return (
              <motion.div
                key={i}
                initial={false}
                animate={{ opacity: i <= phase ? 1 : 0.4, scale: active ? 1.01 : 1 }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3.5 transition-colors",
                  done && "border-primary/30 bg-primary/5",
                  active && "border-primary/50 bg-primary/10 shadow-glow",
                  !done && !active && "border-border/50 bg-card"
                )}
              >
                <span className={cn(
                  "size-9 rounded-lg grid place-items-center shrink-0",
                  done && "bg-primary/15 text-primary",
                  active && "gradient-brand text-white",
                  !done && !active && "bg-muted text-muted-foreground"
                )}>
                  {done ? <Check className="size-4" /> : active ? <Loader2 className="size-4 animate-spin" /> : <p.icon className="size-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{t(p.labelKey)}</div>
                  <div className="text-xs text-muted-foreground truncate">{t(p.detailKey)}</div>
                </div>
                {active && (
                  <div className="flex gap-1">
                    {[0, 1, 2].map((d) => (
                      <motion.span key={d} className="size-1.5 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }} />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </PageContent>
    </PageShell>
  );
}
