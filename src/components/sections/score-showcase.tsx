"use client";

import { motion } from "framer-motion";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import { Bot, Sparkles, TrendingUp } from "lucide-react";
import { ScoreRadial } from "@/components/common/score-viz";
import { useT } from "@/lib/i18n";

const RADAR = [
  { pillar: "Conversion", you: 78, competitor: 80 },
  { pillar: "SEO", you: 85, competitor: 68 },
  { pillar: "GEO / AI", you: 71, competitor: 62 },
  { pillar: "Trust", you: 88, competitor: 86 },
];

const GEO = [
  { name: "ChatGPT", score: 73, color: "#FF6600" },
  { name: "Perplexity", score: 69, color: "#ff983f" },
  { name: "Google AI", score: 71, color: "#ff983f" },
];

export function ScoreShowcase() {
  const t = useT();
  return (
    <section id="scores" className="py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute top-1/2 -translate-y-1/2 -left-32 w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full -z-10" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: radar */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">{t("scores.eyebrow")}</span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-balance">
              {t("scores.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              {t("scores.subtitle")}
            </p>

            <div className="mt-8 rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold">{t("scores.youVsCompetitor")}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" /> {t("scores.you")}</span>
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-muted-foreground/40" /> {t("scores.competitor")}</span>
                </div>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={RADAR} outerRadius="72%">
                    <PolarGrid stroke="oklch(0.5 0.02 170 / 0.2)" />
                    <PolarAngleAxis dataKey="pillar" tick={{ fill: "oklch(0.55 0.02 170)", fontSize: 12, fontWeight: 500 }} />
                    <Radar name="Competitor" dataKey="competitor" stroke="oklch(0.5 0.02 170 / 0.5)" fill="oklch(0.5 0.02 170 / 0.15)" strokeWidth={2} />
                    <Radar name="You" dataKey="you" stroke="#FF6600" fill="#FF660040" strokeWidth={2.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Right: GEO + verdict */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-5"
          >
            <div className="rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/5 to-transparent p-6">
              <div className="flex items-center gap-2 mb-1">
                <Bot className="size-5 text-brand" />
                <span className="text-xs font-semibold uppercase tracking-wider text-brand">{t("scores.geo.eyebrow")}</span>
              </div>
              <h3 className="font-display text-xl font-bold">{t("scores.geo.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("scores.geo.desc")}
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {GEO.map((g) => (
                  <div key={g.name} className="rounded-xl border border-border/50 bg-background/60 p-3 text-center">
                    <ScoreRadial score={g.score} size={72} stroke={6} animate={false} gold />
                    <div className="text-[11px] font-semibold mt-1">{g.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="flex items-start gap-4">
                <ScoreRadial score={82} size={92} stroke={8} label={t("scores.overall")} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <TrendingUp className="size-4" /> {t("scores.ahead")}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {t("scores.leadSeo")}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    <Sparkles className="size-3" /> {t("scores.projected")}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
