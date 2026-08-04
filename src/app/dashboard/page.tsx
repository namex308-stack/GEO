"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  FileText,
  Loader2,
  PieChart,
  Plus,
  Search,
  Sparkles,
  Swords,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageShell, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type PriorityIssue = {
  id: string;
  auditId: string;
  problem: string;
  solution: string;
  severity: "critical" | "warning" | "opportunity";
  impact: "high" | "medium" | "low";
  effort: string | null;
  pillar: string | null;
  projectedImpact: string | null;
};

type TopIssue = {
  problem: string;
  count: number;
  severity: "critical" | "warning" | "opportunity";
  auditId: string | null;
};

type DashboardData = {
  plan: {
    planId: string;
    displayName: string;
    auditsPerMonth: number | null;
    aiGensPerMonth: number | null;
    storesLimit: number | null;
    features: {
      aiGenerator: boolean;
      competitor: boolean;
      api: boolean;
    };
  };
  stats: {
    avgScore: number | null;
    totalAudits: number;
    auditsThisMonth: number;
    auditsLimit: number | null;
    geoScore: number | null;
    openRecommendations: number;
    totalRecommendations: number;
    latestStoreScore: number | null;
    pagesScanned: number;
  };
  latestAudit: {
    id: string;
    productName: string;
    storeName: string;
    overallScore: number | null;
    completedAt: string | null;
  } | null;
  topIssues: TopIssue[];
  nextFixes: PriorityIssue[];
  priorityIssue: PriorityIssue | null;
  trend: { label: string; score: number; date: string }[];
  recent: {
    id: string;
    productName: string;
    storeName: string;
    productUrl: string;
    overallScore: number | null;
    createdAt: string;
    completedAt: string | null;
    pageCount?: number;
    openIssues?: number;
  }[];
  notificationCount: number;
  usagePct: number;
};

function relativeDate(iso: string, t: (key: TranslationKey, params?: Record<string, string | number>) => string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - d.getTime());
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return t("dashboard.today");
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return t("dashboard.hoursAgo", { count: diffHours });
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startToday.getTime() - startThat.getTime()) / 86400000);
  if (diffDays <= 0) return t("dashboard.today");
  if (diffDays === 1) return t("dashboard.yesterday");
  if (diffDays < 7) return t("dashboard.daysAgo", { count: diffDays });
  return t("dashboard.weekAgo");
}

function scoreTone(score: number | null): string {
  if (score == null) return "bg-muted text-muted-foreground";
  if (score >= 80) return "bg-emerald-500/15 text-emerald-600";
  if (score >= 60) return "bg-amber-500/15 text-amber-600";
  return "bg-rose-500/15 text-rose-600";
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function PlanRing({ pct, pctLabel }: { pct: number; pctLabel: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = c - (clamped / 100) * c;
  return (
    <div className="relative size-[120px]">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" className="text-muted/60" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-primary"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-xl font-extrabold tabular-nums leading-none">{clamped}%</div>
          <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {pctLabel}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  positive,
  icon: Icon,
  iconClass,
  delay,
}: {
  label: string;
  value: string;
  hint: string;
  positive?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-border/50 bg-card p-4 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn("grid size-9 place-items-center rounded-xl", iconClass)}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 font-display text-2xl font-extrabold tracking-tight tabular-nums">{value}</div>
      <p
        className={cn(
          "mt-1.5 flex items-center gap-0.5 text-xs font-medium",
          positive === false ? "text-rose-600" : "text-emerald-600"
        )}
      >
        {positive === false ? (
          <ArrowDownRight className="size-3.5" />
        ) : (
          <ArrowUpRight className="size-3.5" />
        )}
        {hint}
      </p>
    </motion.div>
  );
}

export default function DashboardPage() {
  const t = useT();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [range, setRange] = React.useState<"3" | "6" | "12">("6");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) {
          if (!cancelled) {
            setError(
              res.status === 401 ? t("dashboard.signInToView") : t("dashboard.loadError")
            );
          }
          return;
        }
        const json = (await res.json()) as { dashboard: DashboardData };
        if (!cancelled) setData(json.dashboard);
      } catch {
        if (!cancelled) setError(t("dashboard.loadError"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const latestId = data?.latestAudit?.id ?? null;
  const generateHref = latestId ? `/audit/${latestId}/generate` : "/audit/new";
  const compareHref = latestId ? `/audit/${latestId}/compare` : "/audit/new";
  const reportHref = latestId ? `/audit/${latestId}/report` : "/audit/new";

  const chartData = React.useMemo(() => {
    if (!data?.trend.length) return [];
    const take = range === "3" ? 4 : range === "6" ? 8 : 12;
    return data.trend.slice(-take);
  }, [data, range]);

  const planFeatures = React.useMemo(() => {
    if (!data) return [];
    const auditsLabel =
      data.plan.auditsPerMonth == null
        ? t("dashboard.featureUnlimited")
        : `${data.stats.auditsThisMonth} / ${data.plan.auditsPerMonth}`;
    const aiLabel =
      data.plan.aiGensPerMonth == null
        ? t("dashboard.featureUnlimited")
        : data.plan.features.aiGenerator
          ? `${data.plan.aiGensPerMonth}/mo`
          : t("dashboard.featureLocked");
    const storesLabel =
      data.plan.storesLimit == null
        ? t("dashboard.featureUnlimited")
        : String(data.plan.storesLimit);
    return [
      { label: t("dashboard.auditsLabel"), value: auditsLabel },
      { label: t("nav.aiGenerator"), value: aiLabel },
      {
        label: t("nav.competitors"),
        value: data.plan.features.competitor
          ? t("dashboard.featureIncluded")
          : t("dashboard.featureLocked"),
      },
      { label: t("dashboard.storesLimit"), value: storesLabel },
    ];
  }, [data, t]);

  return (
    <PageShell>
      <PageContent className="space-y-6">
        {!data && !error && (
          <div className="py-20 text-center">
            <Loader2 className="size-8 animate-spin mx-auto text-primary" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-border/60 bg-card p-8 text-center shadow-[var(--shadow-card)]">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button asChild className="mt-4 rounded-xl">
              <Link href="/auth">{t("navbar.login")}</Link>
            </Button>
          </div>
        )}

        {data && (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
              <KpiCard
                label={t("dashboard.kpiScore")}
                value={data.stats.avgScore != null ? `${data.stats.avgScore} / 100` : "—"}
                hint={t("dashboard.kpiScoreHint")}
                icon={TrendingUp}
                iconClass="bg-primary/15 text-primary"
                delay={0}
              />
              <KpiCard
                label={t("dashboard.kpiAudits")}
                value={String(data.stats.totalAudits)}
                hint={t("dashboard.kpiAuditsHint", { count: data.stats.auditsThisMonth })}
                icon={Search}
                iconClass="bg-violet-500/15 text-violet-600"
                delay={0.04}
              />
              <KpiCard
                label={t("dashboard.kpiGeo")}
                value={data.stats.geoScore != null ? `${data.stats.geoScore}%` : "—"}
                hint={t("dashboard.kpiGeoHint")}
                icon={PieChart}
                iconClass="bg-emerald-500/15 text-emerald-600"
                delay={0.08}
              />
              <KpiCard
                label={t("dashboard.kpiIssues")}
                value={String(data.stats.openRecommendations)}
                hint={t("dashboard.kpiIssuesHint")}
                positive={false}
                icon={AlertTriangle}
                iconClass="bg-rose-500/15 text-rose-600"
                delay={0.12}
              />
              <KpiCard
                label={t("dashboard.kpiPages")}
                value={String(data.stats.pagesScanned)}
                hint={t("dashboard.kpiPagesHint", { count: data.stats.auditsThisMonth })}
                icon={FileText}
                iconClass="bg-sky-500/15 text-sky-600"
                delay={0.16}
              />
            </div>

            {/* Trend + Plan */}
            <div className="grid lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-8 rounded-2xl border border-border/50 bg-card p-5 sm:p-6 shadow-[var(--shadow-card)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-bold">{t("dashboard.scoreTrend")}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.trendSub")}</p>
                  </div>
                  <select
                    value={range}
                    onChange={(e) => setRange(e.target.value as "3" | "6" | "12")}
                    className="h-9 rounded-xl border border-border/60 bg-background px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                    aria-label={t("dashboard.trendRange")}
                  >
                    <option value="3">{t("dashboard.range3")}</option>
                    <option value="6">{t("dashboard.range6")}</option>
                    <option value="12">{t("dashboard.range12")}</option>
                  </select>
                </div>

                <div className="mt-4 h-[260px] w-full">
                  {chartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                        <defs>
                          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FF6600" stopOpacity={0.28} />
                            <stop offset="100%" stopColor="#FF6600" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.9 0 0)" />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "oklch(0.55 0 0)", fontSize: 12 }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "oklch(0.55 0 0)", fontSize: 12 }}
                          width={36}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid oklch(0.9 0 0)",
                            boxShadow: "0 8px 24px oklch(0.2 0 0 / 0.08)",
                          }}
                          formatter={(value: number) => [value, t("dashboard.storeScore")]}
                        />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="#FF6600"
                          strokeWidth={2.5}
                          fill="url(#scoreFill)"
                          activeDot={{ r: 5, fill: "#FF6600", stroke: "#fff", strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full grid place-items-center rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">{t("dashboard.trendEmpty")}</p>
                        <Button asChild className="mt-4 rounded-xl" size="sm">
                          <Link href="/audit/new">{t("dashboard.runFirstAudit")}</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
                className="lg:col-span-4 rounded-2xl border border-border/50 bg-card p-5 sm:p-6 shadow-[var(--shadow-card)] flex flex-col"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-bold">{t("dashboard.yourPlan")}</h2>
                  <Badge className="rounded-full bg-primary/15 text-primary border-0 font-semibold">
                    {data.plan.displayName}
                  </Badge>
                </div>

                <div className="mt-5 flex flex-col items-center">
                  <PlanRing pct={data.usagePct} pctLabel={t("dashboard.usagePct")} />
                  <div className="mt-3 text-center">
                    <div className="text-sm font-semibold tabular-nums">
                      {data.stats.auditsThisMonth}
                      {data.stats.auditsLimit != null ? ` / ${data.stats.auditsLimit}` : ""}{" "}
                      {t("dashboard.auditsLabel")}
                    </div>
                    <div className="mt-2 h-2 w-40 max-w-full rounded-full bg-muted overflow-hidden mx-auto">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, data.usagePct)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{t("dashboard.renewsHint")}</p>
                  </div>
                </div>

                <ul className="mt-5 space-y-2.5 flex-1">
                  {planFeatures.map((f) => (
                    <li key={f.label} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground min-w-0">
                        <Check className="size-3.5 text-primary shrink-0" />
                        <span className="truncate">{f.label}</span>
                      </span>
                      <span className="text-xs font-semibold text-foreground shrink-0">{f.value}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild className="mt-5 w-full rounded-xl font-semibold h-11 shadow-glow">
                  <Link href="/pricing">{t("dashboard.upgradePlanCta")}</Link>
                </Button>
              </motion.section>
            </div>

            {/* Recent + Issues/Actions */}
            <div className="grid lg:grid-cols-12 gap-4 sm:gap-5 items-start">
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="lg:col-span-8 rounded-2xl border border-border/50 bg-card overflow-hidden shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-border/50">
                  <h2 className="font-display text-lg font-bold">{t("dashboard.recentAudits")}</h2>
                  <Button variant="ghost" size="sm" className="rounded-full text-xs" asChild>
                    <Link href="/history">{t("dashboard.viewAll")}</Link>
                  </Button>
                </div>

                {data.recent.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-sm text-muted-foreground">{t("dashboard.emptyDecisionBody")}</p>
                    <Button asChild className="mt-4 rounded-xl">
                      <Link href="/audit/new">{t("dashboard.runFirstAudit")}</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm text-start">
                      <thead>
                        <tr className="text-start text-[11px] tracking-wider text-muted-foreground border-b border-border/40">
                          <th className="px-5 sm:px-6 py-3 font-semibold text-start">{t("dashboard.colAudit")}</th>
                          <th className="px-3 py-3 font-semibold text-start">{t("dashboard.colScore")}</th>
                          <th className="px-3 py-3 font-semibold text-start hidden sm:table-cell">{t("dashboard.colPages")}</th>
                          <th className="px-3 py-3 font-semibold text-start">{t("dashboard.colIssues")}</th>
                          <th className="px-3 py-3 font-semibold text-start">{t("dashboard.colDate")}</th>
                          <th className="px-4 py-3 w-10 text-end" />
                        </tr>
                      </thead>
                      <tbody>
                        {data.recent.slice(0, 4).map((r) => (
                          <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-accent/30 transition-colors">
                            <td className="px-5 sm:px-6 py-3.5 text-start">
                              <Link href={`/audit/${r.id}/report`} className="flex items-center gap-3 min-w-0">
                                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-display text-xs font-bold">
                                  {(r.storeName || r.productName).slice(0, 2).toUpperCase()}
                                </span>
                                <span className="min-w-0 text-start">
                                  <span className="block font-semibold truncate">{r.productName}</span>
                                  <span className="block text-xs text-muted-foreground truncate" dir="ltr">
                                    {hostFromUrl(r.productUrl) || r.storeName}
                                  </span>
                                </span>
                              </Link>
                            </td>
                            <td className="px-3 py-3.5 text-start">
                              <span
                                className={cn(
                                  "inline-grid size-9 place-items-center rounded-full text-xs font-bold tabular-nums",
                                  scoreTone(r.overallScore)
                                )}
                              >
                                {r.overallScore ?? "—"}
                              </span>
                            </td>
                            <td className="px-3 py-3.5 tabular-nums text-muted-foreground text-start hidden sm:table-cell">
                              {r.pageCount ?? 0}
                            </td>
                            <td className="px-3 py-3.5 tabular-nums font-medium text-primary text-start">
                              {r.openIssues ?? 0}
                            </td>
                            <td className="px-3 py-3.5 text-muted-foreground whitespace-nowrap text-start">
                              {relativeDate(r.completedAt || r.createdAt, t)}
                            </td>
                            <td className="px-4 py-3.5 text-end">
                              <Link
                                href={`/audit/${r.id}/report`}
                                className="inline-flex text-muted-foreground hover:text-foreground"
                                aria-label={t("dashboard.viewReport")}
                              >
                                <ChevronRight className="size-4 rtl:rotate-180" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.section>

              <div className="lg:col-span-4 space-y-4 sm:space-y-5">
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-2xl border border-border/50 bg-card p-5 shadow-[var(--shadow-card)]"
                >
                  <h2 className="font-display text-lg font-bold">{t("dashboard.topIssues")}</h2>
                  <ul className="mt-4 space-y-3">
                    {(data.topIssues.length
                      ? data.topIssues
                      : data.priorityIssue
                        ? [
                            {
                              problem: data.priorityIssue.problem,
                              count: 1,
                              severity: data.priorityIssue.severity,
                              auditId: data.priorityIssue.auditId,
                            },
                            ...data.nextFixes.map((f) => ({
                              problem: f.problem,
                              count: 1,
                              severity: f.severity,
                              auditId: f.auditId,
                            })),
                          ]
                        : []
                    )
                      .slice(0, 5)
                      .map((issue) => (
                        <li key={`${issue.problem}-${issue.auditId}`}>
                          <Link
                            href={issue.auditId ? `/audit/${issue.auditId}/report` : reportHref}
                            className="flex items-start gap-3 rounded-xl px-1 py-1 hover:bg-accent/40 transition-colors"
                          >
                            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-rose-500/10 text-rose-600">
                              <AlertTriangle className="size-3.5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium leading-snug line-clamp-2">
                                {issue.problem}
                              </span>
                              <span className="text-xs text-muted-foreground">({issue.count})</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    {!data.topIssues.length && !data.priorityIssue && (
                      <li className="text-sm text-muted-foreground py-2">{t("dashboard.noTopIssues")}</li>
                    )}
                  </ul>
                </motion.section>

                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 }}
                  className="rounded-2xl border border-border/50 bg-card p-5 shadow-[var(--shadow-card)]"
                >
                  <h2 className="font-display text-lg font-bold">{t("dashboard.quickActions")}</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      {
                        href: "/audit/new",
                        label: t("nav.newAudit"),
                        icon: Plus,
                        className: "bg-primary/10 text-primary",
                      },
                      {
                        href: generateHref,
                        label: t("nav.aiGenerator"),
                        icon: Sparkles,
                        className: "bg-violet-500/10 text-violet-600",
                      },
                      {
                        href: compareHref,
                        label: t("nav.competitors"),
                        icon: Swords,
                        className: "bg-sky-500/10 text-sky-600",
                      },
                      {
                        href: "/settings/usage",
                        label: t("nav.monitoring"),
                        icon: Activity,
                        className: "bg-emerald-500/10 text-emerald-600",
                      },
                    ].map((action) => (
                      <Link
                        key={action.label}
                        href={action.href}
                        className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/50 bg-background/60 px-3 py-5 text-center transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"
                      >
                        <span className={cn("grid size-10 place-items-center rounded-xl", action.className)}>
                          <action.icon className="size-5" />
                        </span>
                        <span className="text-xs font-semibold leading-tight">{action.label}</span>
                      </Link>
                    ))}
                  </div>
                </motion.section>
              </div>
            </div>
          </>
        )}
      </PageContent>
    </PageShell>
  );
}
