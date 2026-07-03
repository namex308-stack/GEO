"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Zap, Plus, Crown, TrendingUp, ArrowUpRight, Bot, Search, ShieldCheck, Clock, Target, FileSearch } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRadial } from "@/components/common/score-viz";
import { useT, type TranslationKey } from "@/lib/i18n";

const TREND_KEYS: { mKey: TranslationKey; score: number }[] = [
  { mKey: "month.may", score: 64 }, { mKey: "month.jun", score: 68 }, { mKey: "month.jul", score: 71 },
  { mKey: "month.aug", score: 75 }, { mKey: "month.sep", score: 79 }, { mKey: "month.oct", score: 82 },
];

type StatIcon = typeof TrendingUp;

const STATS: {
  icon: StatIcon;
  labelKey: TranslationKey;
  value: string;
  deltaKey: TranslationKey;
  deltaParams?: Record<string, string | number>;
  color: string;
}[] = [
  { icon: TrendingUp, labelKey: "dashboard.avgScore", value: "77", deltaKey: "dashboard.thisQuarter", color: "#FF6600" },
  { icon: Zap, labelKey: "dashboard.auditsMonth", value: "12", deltaKey: "dashboard.unlimited", color: "#ff983f" },
  { icon: Bot, labelKey: "dashboard.geoVisibility", value: "71", deltaKey: "dashboard.aboveAvg", color: "#cc5200" },
  { icon: ShieldCheck, labelKey: "dashboard.issuesFixed", value: "23", deltaKey: "dashboard.ofFound", deltaParams: { count: 41 }, color: "#929292" },
];

const RECENT: { name: string; store: string; score: number; dateKey: TranslationKey; dateParams?: Record<string, string | number>; delta: number }[] = [
  { name: "سيروم الأركان للوجه 30مل", store: "ArganBloom", score: 82, dateKey: "dashboard.today", delta: 8 },
  { name: "تونر ماء الورد 200مل", store: "ArganBloom", score: 76, dateKey: "dashboard.yesterday", delta: 3 },
  { name: "زيت الحبة السوداء للشعر", store: "ArganBloom", score: 71, dateKey: "dashboard.daysAgo", dateParams: { count: 2 }, delta: -2 },
  { name: "بخاخ الكركديه للوجه", store: "ArganBloom", score: 88, dateKey: "dashboard.daysAgo", dateParams: { count: 5 }, delta: 12 },
];

export default function DashboardPage() {
  const t = useT();
  const TREND = TREND_KEYS.map((x) => ({ m: t(x.mKey), score: x.score }));

  return (
    <PageShell>
      <PageHeader
        title={t("dashboard.title")}
        subtitle={t("dashboard.welcomeSubtitle")}
        icon={Zap}
        actions={
          <>
            <Button variant="outline" className="rounded-full" asChild>
              <Link href="/pricing"><Crown className="size-4 ml-1 text-brand" /> {t("dashboard.upgrade")}</Link>
            </Button>
            <Button asChild className="rounded-full shadow-glow">
              <Link href="/audit/new"><Plus className="size-4 ml-1" /> {t("dashboard.newAudit")}</Link>
            </Button>
          </>
        }
      />
      <PageContent className="space-y-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="size-9 rounded-lg grid place-items-center" style={{ background: `${s.color}1a`, color: s.color }}><s.icon className="size-5" /></span>
              </div>
              <div className="mt-4 font-display text-2xl font-bold tabular-nums">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t(s.labelKey)}</div>
              <div className="text-[11px] font-medium mt-2" style={{ color: s.color }}>{t(s.deltaKey, s.deltaParams)}</div>
            </motion.div>
          ))}
        </div>

        {/* Trend + Plan */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-lg font-bold">{t("dashboard.scoreTrend")}</h2>
              <Badge variant="outline" className="rounded-full text-primary border-primary/30 bg-primary/5">
                <TrendingUp className="size-3 ml-1" /> {t("dashboard.sinceMay")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{t("dashboard.trendSub")}</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TREND} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF6600" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#FF6600" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="score" stroke="#FF6600" strokeWidth={2.5} fill="url(#trend)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-lg font-bold">{t("dashboard.yourPlan")}</h2>
              <Badge className="rounded-full gradient-brand text-white">{t("dashboard.free")}</Badge>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <ScoreRadial score={33} size={80} stroke={7} label={t("dashboard.usage")} animate={false} />
              <div className="text-sm">
                <div className="font-semibold">{t("dashboard.auditsPerMonth")}</div>
                <div className="text-muted-foreground">{t("dashboard.remaining", { count: 2 })}</div>
              </div>
            </div>
            <div className="mt-5 rounded-xl bg-gradient-to-br from-primary/10 to-brand/5 border border-primary/20 p-4">
              <Crown className="size-5 text-brand mb-1.5" />
              <div className="font-semibold text-sm">{t("dashboard.unlockPro")}</div>
              <p className="text-xs text-muted-foreground mt-1 mb-3">{t("dashboard.unlockSub")}</p>
              <Button asChild size="sm" className="w-full rounded-full shadow-glow"><Link href="/pricing">{t("dashboard.upgradeMonth")}</Link></Button>
            </div>
          </div>
        </div>

        {/* Recent audits */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
            <h2 className="font-display text-lg font-bold">{t("dashboard.recentAudits")}</h2>
            <Button variant="ghost" size="sm" className="rounded-full text-xs" asChild><Link href="/history">{t("dashboard.viewAll")}</Link></Button>
          </div>
          <div className="divide-y divide-border/50">
            {RECENT.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                <Link href="/audit/demo/report" className="w-full flex items-center gap-4 px-6 py-4 hover:bg-accent/40 transition-colors text-right">
                  <ScoreRadial score={r.score} size={44} stroke={4.5} animate={false} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{r.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="size-3" /> {t(r.dateKey, r.dateParams)} · {r.store}</div>
                  </div>
                  <div className={`hidden sm:flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${r.delta > 0 ? "text-primary bg-primary/10" : "text-rose-500 bg-rose-500/10"}`}>
                    {r.delta > 0 ? <ArrowUpRight className="size-3" /> : null}{r.delta > 0 ? `+${r.delta}` : r.delta}
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </PageContent>
    </PageShell>
  );
}
