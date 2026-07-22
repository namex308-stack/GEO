"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BarChart3, Zap, Bot, Loader2 } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { crumbsForPath } from "@/lib/nav-config";
import { ScoreRadial } from "@/components/common/score-viz";
import { useT } from "@/lib/i18n";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { getPlanLimits, isUnlimitedAudits, canGenerate } from "@/lib/billing/entitlements";
import { resolveEffectivePlan } from "@/lib/billing/dev-unlock";
import type { Profile, UsageCounter } from "@/lib/database.types";

export default function UsagePage() {
  const t = useT();
  const sb = React.useMemo(() => getSupabaseBrowser(), []);
  const [loading, setLoading] = React.useState(!!sb);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [usage, setUsage] = React.useState<UsageCounter | null>(null);

  React.useEffect(() => {
    if (!sb) return;

    sb.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (!user) { setLoading(false); return; }

        const [profileRes, usageRes] = await Promise.all([
          sb.from("profiles").select("*").eq("id", user.id).single(),
          sb.from("usage_counters").select("*").eq("user_id", user.id)
            .eq("month", new Date().toISOString().slice(0, 7))
            .maybeSingle(),
        ]);

        setProfile(profileRes.data as Profile | null);
        setUsage(usageRes.data as UsageCounter | null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sb]);

  const plan = resolveEffectivePlan(profile?.plan ?? "free");
  const limits = getPlanLimits(plan);
  const auditsUsed = usage?.audits_used ?? 0;
  const generationsUsed = usage?.generations_used ?? 0;

  const auditPct =
    limits.auditsPerMonth === null
      ? 0
      : Math.min(100, Math.round((auditsUsed / limits.auditsPerMonth) * 100));
  const genLimit = limits.generationsPerMonth;
  const genPct =
    genLimit === null || genLimit === 0
      ? 0
      : Math.min(100, Math.round((generationsUsed / genLimit) * 100));
  const overallPct = genLimit === null ? auditPct : Math.round((auditPct + genPct) / 2);

  const USAGE = [
    {
      icon: Zap,
      label: t("usage.auditsThisMonth"),
      used: auditsUsed,
      limit: isUnlimitedAudits(plan) ? "∞" : limits.auditsPerMonth ?? 0,
      pct: auditPct,
      color: "#FF6600",
    },
    ...(canGenerate(plan)
      ? [
          {
            icon: Bot,
            label: t("usage.aiGenerations"),
            used: generationsUsed,
            limit: genLimit === null ? "∞" : genLimit,
            pct: genPct,
            color: "#ff983f",
          },
        ]
      : []),
  ];

  if (loading) {
    return (
      <PageShell>
        <PageContent className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="size-8 animate-spin text-primary" />
        </PageContent>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader title={t("usage.title")} subtitle={t("usage.subtitle")} icon={BarChart3} back="/settings" crumbs={crumbsForPath("/settings/usage")} />
      <PageContent className="space-y-6 max-w-3xl">
        {/* Overall */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border/60 bg-card p-6 flex items-center gap-6">
          <ScoreRadial score={overallPct} size={100} stroke={8} label={t("settings.usage")} />
          <div>
            <h2 className="font-display text-xl font-bold">{t("usage.planUsage")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("usage.usageDesc", { pct: overallPct })}</p>
            <p className="text-xs text-muted-foreground mt-2">{plan === "free" ? "Free plan" : `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`}</p>
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
      </PageContent>
    </PageShell>
  );
}
