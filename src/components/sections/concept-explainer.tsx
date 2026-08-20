"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2, Cpu, Zap, Search, Bot, ShieldCheck, FileSearch,
  ArrowRight, Check, Sparkles, TrendingUp, Play, Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StartAuditCta } from "@/components/common/start-audit-cta";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { FloatingOrbs } from "@/components/common/visual-effects";

const PHASES = [
  {
    id: "input",
    titleKey: "concept.step1.title",
    descKey: "concept.step1.desc",
    icon: Link2,
    visual: "input",
  },
  {
    id: "scan",
    titleKey: "concept.step2.title",
    descKey: "concept.step2.desc",
    icon: Cpu,
    visual: "scan",
  },
  {
    id: "score",
    titleKey: "concept.step3.title",
    descKey: "concept.step3.desc",
    icon: Zap,
    visual: "score",
  },
  {
    id: "fix",
    titleKey: "concept.step4.title",
    descKey: "concept.step4.desc",
    icon: Sparkles,
    visual: "fix",
  },
] as const;

export function ConceptExplainer() {
  const t = useT();
  const [phase, setPhase] = React.useState(0);
  const [playing, setPlaying] = React.useState(true);

  React.useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => setPhase((p) => (p + 1) % PHASES.length), 4200);
    return () => clearInterval(interval);
  }, [playing]);

  const current = PHASES[phase];

  return (
    <section id="how" className="py-20 sm:py-28 relative overflow-hidden">
      <FloatingOrbs count={2} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">{t("concept.eyebrow")}</span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-balance">
            {t("concept.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            {t("concept.subtitle")}
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-8 items-center">
          {/* Left: phase list */}
          <div className="space-y-2.5 order-2 lg:order-1">
            {PHASES.map((p, i) => {
              const active = i === phase;
              const done = i < phase;
              return (
                <button
                  key={p.id}
                  onClick={() => { setPhase(i); setPlaying(false); }}
                  className={cn(
                    "w-full flex items-start gap-3.5 rounded-2xl border p-4 text-start transition-all duration-300",
                    active ? "border-primary/50 bg-primary/5 shadow-glow" : "border-border/60 bg-card hover:border-primary/30"
                  )}
                >
                  <span className={cn(
                    "size-11 rounded-xl grid place-items-center shrink-0 transition-colors",
                    active ? "gradient-brand text-white" : done ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {done ? <Check className="size-5" /> : <p.icon className="size-5" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-sm sm:text-base">{t(p.titleKey)}</div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t(p.descKey)}</p>
                  </div>
                  {active && (
                    <motion.span
                      layoutId="explainer-active"
                      className="size-2 rounded-full bg-primary mt-2 shrink-0"
                    />
                  )}
                </button>
              );
            })}

            <div className="flex items-center gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setPlaying((p) => !p)} className="rounded-full">
                {playing ? <Pause className="size-3.5 me-1.5" /> : <Play className="size-3.5 me-1.5" />}
                {playing ? t("concept.pause") : t("concept.play")}
              </Button>
              <StartAuditCta size="sm" className="rounded-full shadow-glow">
                {t("concept.tryNow")} <ArrowRight className="size-3.5 ms-1 rtl:rotate-180" />
              </StartAuditCta>
            </div>
          </div>

          {/* Right: animated visual */}
          <div className="order-1 lg:order-2 relative">
            <div className="absolute -inset-4 gradient-brand opacity-10 blur-3xl rounded-3xl" />
            <div className="relative rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden min-h-[420px]">
              {/* browser chrome */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-muted/40">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                  <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                  <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                </div>
                <span className="text-xs font-mono text-muted-foreground">convaudit.com/audit</span>
                <span className="text-xs text-muted-foreground">{phase + 1} / {PHASES.length}</span>
              </div>

              <div className="p-6 sm:p-8 min-h-[380px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.98 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full"
                  >
                    {current.visual === "input" && <InputVisual />}
                    {current.visual === "scan" && <ScanVisual />}
                    {current.visual === "score" && <ScoreVisual />}
                    {current.visual === "fix" && <FixVisual />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Phase visuals ---------- */

function InputVisual() {
  const t = useT();
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="size-14 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto mb-5">
        <Link2 className="size-7" />
      </div>
      <h3 className="font-display text-xl font-bold">{t("concept.visual.pasteUrl")}</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-5">{t("concept.visual.anyPlatform")}</p>
      <motion.div
        className="flex items-center gap-2 rounded-xl border border-border/60 bg-background p-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.span
          dir="ltr"
          className="flex-1 text-left text-sm font-mono text-muted-foreground px-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: "auto" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="inline-block overflow-hidden whitespace-nowrap"
          >
            https://your-store.com/products/…
          </motion.span>
          <motion.span
            className="inline-block w-0.5 h-4 bg-primary ms-0.5 align-middle"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        </motion.span>
        <span className="gradient-brand text-white text-xs font-semibold px-3 py-1.5 rounded-lg">{t("concept.visual.auditButton")}</span>
      </motion.div>
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {["Shopify", "WooCommerce", "Salla", "Zid", "مخصص"].map((p) => (
          <span key={p} className="text-[10px] font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">{p}</span>
        ))}
      </div>
    </div>
  );
}

function ScanVisual() {
  const t = useT();
  const lines = [
    t("concept.visual.scan1"),
    t("concept.visual.scan2"),
    t("concept.visual.scan3"),
    t("concept.visual.scan4"),
    t("concept.visual.scan5"),
  ];
  const [done, setDone] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => setDone((d) => Math.min(d + 1, lines.length)), 700);
    return () => clearInterval(timer);
  }, [lines.length]);

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <motion.span
          className="size-9 rounded-xl gradient-brand grid place-items-center text-white"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Cpu className="size-5" />
        </motion.span>
        <div>
          <div className="font-display font-bold text-sm">{t("concept.visual.aiReading")}</div>
          <div className="text-xs text-muted-foreground">{t("concept.visual.firecrawlGemini")}</div>
        </div>
      </div>
      <div className="space-y-2">
        {lines.map((l, i) => {
          const isDone = i < done;
          const isActive = i === done;
          return (
            <motion.div
              key={i}
              animate={{ opacity: i <= done ? 1 : 0.4 }}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border p-2.5 text-xs",
                isDone && "border-primary/30 bg-primary/5",
                isActive && "border-primary/50 bg-primary/10",
                !isDone && !isActive && "border-border/50"
              )}
            >
              <span className={cn(
                "size-5 rounded-full grid place-items-center shrink-0",
                isDone ? "bg-primary/15 text-primary" : isActive ? "gradient-brand text-white" : "bg-muted"
              )}>
                {isDone ? <Check className="size-3" /> : isActive ? (
                  <motion.span className="size-2 rounded-full bg-white" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }} />
                ) : null}
              </span>
              <span className="font-mono">{l}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ScoreVisual() {
  const t = useT();
  const pillars = [
    { icon: Zap, label: t("concept.visual.pillarConversion"), color: "#FF6600" },
    { icon: Search, label: t("concept.visual.pillarSeo"), color: "#ff983f" },
    { icon: Bot, label: t("concept.visual.pillarGeo"), color: "#cc5200" },
    { icon: ShieldCheck, label: t("concept.visual.pillarTrust"), color: "#929292" },
  ];
  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
        {t("concept.visual.pillarNote")}
      </p>
      <div className="grid grid-cols-2 gap-2.5 max-w-sm mx-auto">
        {pillars.map((p, i) => (
          <motion.div
            key={p.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.15 }}
            className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 p-2.5"
          >
            <span className="size-7 rounded-lg grid place-items-center" style={{ background: `${p.color}1a`, color: p.color }}>
              <p.icon className="size-3.5" />
            </span>
            <span className="text-xs font-semibold">{p.label}</span>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
      >
        <TrendingUp className="size-3.5" /> {t("concept.visual.liveScores")}
      </motion.div>
    </div>
  );
}

function FixVisual() {
  const t = useT();
  const steps = [
    t("concept.visual.fixStep1"),
    t("concept.visual.fixStep2"),
    t("concept.visual.fixStep3"),
  ];
  return (
    <div className="max-w-md mx-auto space-y-2.5">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="size-5 text-primary" />
        <span className="font-display font-bold text-sm">{t("concept.visual.aiFixesTitle")}</span>
      </div>
      {steps.map((step, i) => (
        <motion.div
          key={step}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.2 }}
          className="rounded-xl border border-border/60 bg-background p-3 flex items-start gap-2"
        >
          <span className="text-primary text-xs font-bold mt-0.5">{i + 1}</span>
          <span className="text-xs font-medium">{step}</span>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center justify-center gap-2 mt-3 text-xs font-semibold text-primary"
      >
        <FileSearch className="size-3.5" /> {t("concept.visual.noFabricated")}
      </motion.div>
    </div>
  );
}
