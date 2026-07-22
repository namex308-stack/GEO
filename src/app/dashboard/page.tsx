"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Zap, Crown, TrendingUp, ArrowUpRight, Bot, ShieldCheck, Clock, Loader2 } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { EmptyState } from "@/components/app/empty-state";
import { QuickActions } from "@/components/app/quick-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRadial } from "@/components/common/score-viz";
import { useT } from "@/lib/i18n";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { getPlanLimits, isUnlimitedAudits } from "@/lib/billing/entitlements";
import { resolveEffectivePlan } from "@/lib/billing/dev-unlock";
import type { PlanId } from "@/lib/billing/plans";
import { crumbsForPath } from "@/lib/nav-config";
import {
  SS_MONITOR_PROMPT,
  readLastAuditIdFromLocalStorage,
  syncFlowToLocalStorage,
} from "@/lib/workflow/flow-state";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface AuditRow {
  id: string;
  product_name: string | null;
  store_name: string | null;
  overall_score: number | null;
  created_at: string;
  product_url: string;
  competitor_url?: string | null;
  status?: string;
}

export default function DashboardPage() {
  const t = useT();
  const searchParams = useSearchParams();
  const sb = React.useMemo(() => getSupabaseBrowser(), []);
  const [audits, setAudits] = React.useState<AuditRow[]>([]);
  const [loading, setLoading] = React.useState(!!sb);
  const [plan, setPlan] = React.useState<PlanId>("free");
  const [auditsUsed, setAuditsUsed] = React.useState(0);
  const [gensUsed, setGensUsed] = React.useState(0);
  const [monitorCount, setMonitorCount] = React.useState(0);
  const [renewDate, setRenewDate] = React.useState("—");
  const [lastAuditId, setLastAuditId] = React.useState<string | null>(null);
  const [lastAuditStatus, setLastAuditStatus] = React.useState<string | null>(null);
  const [hasCompetitor, setHasCompetitor] = React.useState(false);

  React.useEffect(() => {
    const upgraded = searchParams.get("upgraded");
    if (!upgraded) return;
    toast.success(t("billing.upgradeSuccess", { plan: upgraded.toUpperCase() }));
  }, [searchParams, t]);

  React.useEffect(() => {
    if (!sb) return;

    (async () => {
      try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const month = new Date().toISOString().slice(0, 7);
      const [auditsRes, profileRes, usageRes, subRes, monRes] = await Promise.all([
        sb.from("audits")
          .select("id, product_name, store_name, overall_score, created_at, product_url, competitor_url, status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        sb.from("profiles").select("plan, onboarding").eq("id", user.id).single(),
        sb.from("usage_counters")
          .select("audits_used, generations_used")
          .eq("user_id", user.id)
          .eq("month", month)
          .maybeSingle(),
        sb.from("subscriptions")
          .select("current_period_end")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        sb.from("monitoring_jobs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      const allAudits = auditsRes.data ?? [];
      const complete = allAudits.filter((a) => a.status === "complete");
      setAudits(complete.slice(0, 5));
      setPlan(resolveEffectivePlan((profileRes.data?.plan as PlanId) ?? "free"));
      setAuditsUsed(usageRes.data?.audits_used ?? 0);
      setGensUsed(usageRes.data?.generations_used ?? 0);
      setMonitorCount(monRes.count ?? 0);

      const onboarding = (profileRes.data?.onboarding as Record<string, string> | null) ?? {};
      const fromProfile = onboarding.lastAuditId;
      const fromLs = readLastAuditIdFromLocalStorage();
      const latest = fromProfile || fromLs || allAudits[0]?.id || null;
      if (latest) syncFlowToLocalStorage({ lastAuditId: latest });
      setLastAuditId(latest);

      const latestRow = allAudits.find((a) => a.id === latest) ?? allAudits[0];
      setLastAuditStatus(latestRow?.status ?? null);
      setHasCompetitor(Boolean(latestRow?.competitor_url));

      if (subRes.data?.current_period_end) {
        setRenewDate(
          new Date(subRes.data.current_period_end).toLocaleDateString("en", {
            month: "short",
            day: "numeric",
          })
        );
      }
      setLoading(false);

      // Monitoring setup prompt after 3s if no monitors
      if ((monRes.count ?? 0) === 0) {
        try {
          if (sessionStorage.getItem(SS_MONITOR_PROMPT)) return;
        } catch {
          /* ignore */
        }
        setTimeout(() => {
          try {
            if (sessionStorage.getItem(SS_MONITOR_PROMPT)) return;
            sessionStorage.setItem(SS_MONITOR_PROMPT, "1");
          } catch {
            /* ignore */
          }
          toast(t("monitor.prompt"), {
            action: {
              label: t("monitor.prompt.cta"),
              onClick: () => {
                window.location.href = "/watch";
              },
            },
          });
        }, 3000);
      }
      } catch {
        setLoading(false);
      }
    })();
  }, [sb, t]);

  const limits = getPlanLimits(plan);
  const auditLimit = limits.auditsPerMonth;
  const auditLimitDisplay = isUnlimitedAudits(plan) ? "∞" : String(auditLimit ?? 3);
  const remaining = auditLimit == null ? "∞" : Math.max(0, auditLimit - auditsUsed);
  const genLimit = limits.generationsPerMonth;

  const avgScore =
    audits.length > 0
      ? Math.round(audits.reduce((s, a) => s + (a.overall_score ?? 0), 0) / audits.length)
      : 0;

  const trendData = audits
    .slice(0, 6)
    .reverse()
    .map((a) => ({
      m: new Date(a.created_at).toLocaleDateString("en", { month: "short", day: "numeric" }),
      score: a.overall_score ?? 0,
    }));

  return (
    <PageShell>
      <PageHeader
        title={t("dashboard.title")}
        subtitle={t("dashboard.welcomeSubtitle")}
        icon={Zap}
        crumbs={crumbsForPath("/dashboard")}
        actions={
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/pricing">
              <Crown className="size-4 ml-1 text-brand" /> {t("dashboard.upgrade")}
            </Link>
          </Button>
        }
      />
      <PageContent className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Quick access to all tools */}
            <QuickActions
              lastAuditId={lastAuditId}
              lastAuditStatus={lastAuditStatus}
              hasCompetitor={hasCompetitor}
            />

            {/* Usage widget */}
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h2 className="font-display text-lg font-bold mb-4">{t("dashboard.usageWidget")}</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">{t("usage.audits")}</div>
                  <div className="font-display text-xl font-bold tabular-nums">
                    {auditsUsed}
                    {auditLimit != null ? ` / ${auditLimit}` : ""}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("usage.ai")}</div>
                  <div className="font-display text-xl font-bold tabular-nums">
                    {gensUsed}
                    {genLimit != null ? ` / ${genLimit}` : ""}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("usage.monitoring")}</div>
                  <div className="font-display text-xl font-bold tabular-nums">{monitorCount}</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: TrendingUp, label: t("dashboard.avgScore"), value: String(avgScore || "—"), delta: t("dashboard.thisQuarter"), color: "#FF6600" },
                { icon: Zap, label: t("dashboard.auditsMonth"), value: String(auditsUsed), delta: `${remaining} ${t("dashboard.remainingShort")}`, color: "#ff983f" },
                { icon: Bot, label: t("dashboard.geoVisibility"), value: String(avgScore > 0 ? Math.round(avgScore * 0.87) : "—"), delta: t("dashboard.aboveAvg"), color: "#cc5200" },
                { icon: ShieldCheck, label: t("dashboard.issuesFixed"), value: "—", delta: "Track after first audit", color: "#929292" },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-2xl border border-border/60 bg-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="size-9 rounded-lg grid place-items-center" style={{ background: `${s.color}1a`, color: s.color }}><s.icon className="size-5" /></span>
                  </div>
                  <div className="mt-4 font-display text-2xl font-bold tabular-nums">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                  <div className="text-[11px] font-medium mt-2" style={{ color: s.color }}>{s.delta}</div>
                </motion.div>
              ))}
            </div>

            {/* Trend + Plan */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-display text-lg font-bold">{t("dashboard.scoreTrend")}</h2>
                  {trendData.length > 1 && (
                    <Badge variant="outline" className="rounded-full text-primary border-primary/30 bg-primary/5">
                      <TrendingUp className="size-3 ml-1" /> {trendData.length} audits
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">{t("dashboard.trendSub")}</p>
                {trendData.length > 1 ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FF6600" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#FF6600" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="m" tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                        <Area type="monotone" dataKey="score" stroke="#FF6600" strokeWidth={2.5} fill="url(#trend)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">
                    Run 2+ audits to see your score trend
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-display text-lg font-bold">{t("dashboard.yourPlan")}</h2>
                  <Badge className="rounded-full gradient-brand text-white capitalize">{plan}</Badge>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <ScoreRadial score={auditLimit == null ? 100 : Math.min(100, Math.round((auditsUsed / (auditLimit || 1)) * 100))} size={80} stroke={7} label={t("dashboard.usage")} animate={false} />
                  <div className="text-sm">
                    <div className="font-semibold">{auditLimitDisplay} {t("dashboard.auditsPerMonthShort")}</div>
                    <div className="text-muted-foreground">{t("dashboard.remaining", { count: String(remaining) })}</div>
                    {renewDate !== "—" && (
                      <div className="text-xs text-muted-foreground mt-1">{t("billing.renewsOn")}: {renewDate}</div>
                    )}
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
              {audits.length === 0 ? (
                <EmptyState
                  title={t("empty.noAudits")}
                  ctaLabel={t("empty.noAudits.cta")}
                  ctaHref="/audit/new"
                  className="py-12"
                />
              ) : (
                <div className="divide-y divide-border/50">
                  {audits.map((a, i) => (
                    <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                      <Link href={`/audit/${a.id}/report`} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-accent/40 transition-colors text-right">
                        <ScoreRadial score={a.overall_score ?? 0} size={44} stroke={4.5} animate={false} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{a.product_name || extractName(a.product_url)}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="size-3" /> {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })} · {a.store_name || "—"}
                          </div>
                        </div>
                        <ArrowUpRight className="size-4 text-muted-foreground" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </PageContent>
    </PageShell>
  );
}

function extractName(url: string): string {
  try {
    const seg = new URL(url).pathname.split("/").filter(Boolean).pop() || "";
    return seg.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Product";
  } catch { return "Product"; }
}
