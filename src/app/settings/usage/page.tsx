"use client";

import { motion } from "framer-motion";
import { BarChart3, Zap, Bot, ShieldCheck, TrendingUp } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { ScoreRadial } from "@/components/common/score-viz";
import { useT } from "@/lib/i18n";

export default function UsagePage() {
  const t = useT();

  const USAGE = [
    { icon: Zap, label: t("usage.auditsThisMonth"), used: 12, limit: "غير محدود", pct: 33, color: "#FF6600" },
    { icon: Bot, label: t("usage.aiGenerations"), used: 45, limit: "غير محدود", pct: 22, color: "#ff983f" },
    { icon: ShieldCheck, label: t("usage.pagesWatched"), used: 3, limit: 10, pct: 30, color: "#cc5200" },
    { icon: TrendingUp, label: t("usage.competitorComparisons"), used: 8, limit: 25, pct: 32, color: "#929292" },
  ];

  const API_ENDPOINTS = [
    { endpoint: "POST /api/audit", calls: 12, limit: 1000 },
    { endpoint: "POST /api/generate", calls: 45, limit: 1000 },
    { endpoint: "GET /api/status", calls: 128, limit: 10000 },
  ];

  return (
    <PageShell>
      <PageHeader title={t("usage.title")} subtitle={t("usage.subtitle")} icon={BarChart3} back="/settings" />
      <PageContent className="space-y-6 max-w-3xl">
        {/* Overall */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border/60 bg-card p-6 flex items-center gap-6">
          <ScoreRadial score={33} size={100} stroke={8} label={t("settings.usage")} />
          <div>
            <h2 className="font-display text-xl font-bold">{t("usage.planUsage")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("usage.usageDesc", { pct: 33 })}</p>
            <p className="text-xs text-muted-foreground mt-2">يتجدد في 1 نوفمبر 2026</p>
          </div>
        </motion.div>

        {/* Breakdown */}
        <div className="grid sm:grid-cols-2 gap-4">
          {USAGE.map((u, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="size-9 rounded-lg grid place-items-center" style={{ background: `${u.color}1a`, color: u.color }}><u.icon className="size-5" /></span>
                <div className="flex-1"><div className="text-sm font-semibold">{u.label}</div><div className="text-xs text-muted-foreground">{u.used} / {u.limit}</div></div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: u.color }} initial={{ width: 0 }} animate={{ width: `${u.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
              </div>
              <div className="text-[11px] text-muted-foreground mt-1.5">{t("usage.used", { used: `${u.pct}%` })}</div>
            </motion.div>
          ))}
        </div>

        {/* API usage */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-display text-lg font-bold mb-4">{t("usage.apiUsage")}</h2>
          <div className="space-y-3">
            {API_ENDPOINTS.map((api, i) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b border-border/50 last:border-0">
                <code className="text-xs font-mono text-primary bg-primary/5 px-2 py-1 rounded">{api.endpoint}</code>
                <div className="flex-1 text-xs text-muted-foreground">{t("usage.calls", { used: api.calls, limit: api.limit })}</div>
                <div className="text-xs font-semibold">{((api.calls / api.limit) * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      </PageContent>
    </PageShell>
  );
}
