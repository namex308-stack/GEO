"use client";

import { motion } from "framer-motion";
import {
  ArrowRight, Sparkles, Star, Zap, Search, Bot, ShieldCheck,
  TrendingUp, FileSearch, Globe2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FloatingOrbs, ParticleField } from "@/components/common/visual-effects";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { ScoreRadial, ScoreBar } from "@/components/common/score-viz";
import { useT } from "@/lib/i18n";

const PILLARS = [
  { icon: Zap, label: "Conversion", score: 78, color: "#FF6600" },
  { icon: Search, label: "SEO", score: 85, color: "#ff983f" },
  { icon: Bot, label: "GEO / AI", score: 71, color: "#ff983f" },
  { icon: ShieldCheck, label: "Trust", score: 88, color: "#cc5200" },
];

const AVATAR_COLORS = ["#FF6600", "#ff983f", "#cc5200", "#ff983f"];

export function Hero() {
  const t = useT();
  const { startAuditAndNavigate, openLoginAndNavigate } = useNavigateAfterAction();
  const badgeParts = t("hero.badge").split(" · ");

  return (
    <section className="relative overflow-hidden pt-28 pb-12 sm:pt-36 sm:pb-20">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_70%)]" />
      <FloatingOrbs count={3} />
      <ParticleField count={20} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/15 blur-[140px] rounded-full -z-10" />
      <div className="absolute top-32 right-0 w-[400px] h-[400px] bg-brand/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute top-40 left-0 w-[300px] h-[300px] bg-chart-4/10 blur-[100px] rounded-full -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Eyebrow announcement */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <button
            onClick={() => openLoginAndNavigate("onboarding")}
            className="group inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 backdrop-blur px-3.5 py-1.5 text-xs font-medium hover:border-primary/40 transition-colors"
          >
            <span className="flex items-center gap-1.5 text-primary font-semibold">
              <Sparkles className="size-3.5" /> {badgeParts[0]}
            </span>
            <span className="text-muted-foreground">{badgeParts.slice(1).join(" · ")}</span>
            <ArrowRight className="size-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mt-7 text-center font-display text-[2.5rem] sm:text-6xl lg:text-7xl font-extrabold leading-[1.02] tracking-tight text-balance"
        >
          {t("hero.headline1")}<br className="hidden sm:block" /> {t("hero.headline2")}{" "}
          <span className="relative inline-block">
            <span className="gradient-text">{t("hero.headline3")}</span>
            <motion.svg
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              viewBox="0 0 300 12" className="absolute -bottom-1 left-0 w-full" fill="none"
            >
              <motion.path d="M2 8 Q 150 2, 298 8" stroke="#ff983f" strokeWidth="2.5" strokeLinecap="round" />
            </motion.svg>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mt-6 text-center text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty"
        >
          {t("hero.subheadline")}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-9 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button size="lg" onClick={startAuditAndNavigate} className="rounded-full text-base font-semibold h-12 px-8 shadow-glow group">
            {t("hero.startFreeAudit")}
            <ArrowRight className="size-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => openLoginAndNavigate("audit")} className="rounded-full text-base font-semibold h-12 px-8 bg-card/80 backdrop-blur">
            {t("hero.viewDemo")}
          </Button>
        </motion.div>

        {/* Trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {AVATAR_COLORS.map((c, i) => (
                <span key={i} className="size-7 rounded-full border-2 border-background grid place-items-center text-[10px] font-bold text-white" style={{ background: c }}>
                  {["S", "W", "Z", "A"][i]}
                </span>
              ))}
            </div>
            <span>{t("hero.platforms")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="size-4 fill-brand text-brand" />
              ))}
            </div>
            <span><strong className="text-foreground">4.9</strong>{t("hero.rating", { rating: "", count: "1,200" })}</span>
          </div>
        </motion.div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 relative"
        >
          {/* glow underlay */}
          <div className="absolute -inset-6 gradient-brand opacity-15 blur-3xl rounded-3xl" />

          <div className="relative rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden">
            {/* browser chrome */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-muted/40">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-rose-400" />
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="size-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-background/60 rounded-full px-3 py-1 max-w-md">
                <Globe2 className="size-3 shrink-0" />
                <span className="truncate">shop.example.com/products/argan-glow-serum</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                <span className="hidden sm:inline">{t("hero.auditComplete")}</span>
              </div>
            </div>

            {/* dashboard body */}
            <div className="p-5 sm:p-7">
              <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
                {/* left: score + pillars */}
                <div>
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("hero.storeScore")}
                      </div>
                      <div className="font-display text-xl font-bold mt-0.5">ArganBloom · Pure Argan Glow Serum</div>
                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                        <TrendingUp className="size-3.5" /> +8 pts vs competitor · 58s audit
                      </div>
                    </div>
                    <ScoreRadial score={82} size={104} stroke={9} label={t("hero.overall")} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {PILLARS.map((p, i) => (
                      <div key={p.label} className="rounded-xl border border-border/50 bg-background/50 p-3.5">
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className="size-7 rounded-lg grid place-items-center" style={{ background: `${p.color}1a`, color: p.color }}>
                            <p.icon className="size-3.5" />
                          </span>
                          <span className="text-xs font-semibold">{p.label}</span>
                          <span className="ml-auto text-sm font-bold tabular-nums" style={{ color: p.color }}>{p.score}</span>
                        </div>
                        <ScoreBar score={p.score} label="" delay={0.5 + i * 0.1} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* right: GEO + competitor */}
                <div className="space-y-3">
                  <div className="rounded-xl border border-brand/30 bg-gradient-to-br from-brand/5 to-transparent p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Bot className="size-4 text-brand" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-brand">GEO / AI Visibility</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { n: "ChatGPT", s: 73 },
                        { n: "Perplexity", s: 69 },
                        { n: "Google AI", s: 71 },
                      ].map((g) => (
                        <div key={g.n} className="text-center">
                          <ScoreRadial score={g.s} size={56} stroke={5} animate={false} gold />
                          <div className="text-[10px] font-medium mt-1 text-muted-foreground">{g.n}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
                    <div className="flex items-center justify-between text-xs mb-2.5">
                      <span className="font-semibold">{t("hero.vsCompetitor")}</span>
                      <span className="text-primary font-bold">{t("hero.ahead")}</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { l: t("hero.you"), v: 82, c: "bg-primary" },
                        { l: t("hero.competitor"), v: 74, c: "bg-muted-foreground/50" },
                      ].map((b) => (
                        <div key={b.l}>
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>{b.l}</span><span className="font-semibold">{b.v}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${b.c}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${b.v}%` }}
                              transition={{ duration: 1, delay: 0.7 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* recommendation strip */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5"
              >
                <span className="size-9 rounded-lg gradient-brand grid place-items-center text-white shrink-0">
                  <FileSearch className="size-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">{t("hero.criticalFixes")}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{t("hero.fixesDesc")}</div>
                </div>
                <div className="text-xs font-bold text-primary whitespace-nowrap">{t("hero.projectedPts")}</div>
              </motion.div>
            </div>
          </div>

          {/* Floating chip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="absolute -left-2 sm:-left-6 top-1/3 rounded-xl border border-border/60 bg-card shadow-xl px-3.5 py-2.5 flex items-center gap-2.5"
          >
            <span className="size-8 rounded-lg bg-primary/15 grid place-items-center text-primary">
              <Zap className="size-4" />
            </span>
            <div>
              <div className="text-xs font-semibold">{t("hero.aiFixReady")}</div>
              <div className="text-[10px] text-muted-foreground">after fixes applied</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
