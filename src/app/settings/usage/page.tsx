"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BarChart3, Zap, Bot, Swords, Activity, Loader2 } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { ApiLoadError } from "@/components/runtime/api-load-error";
import { ScoreRadial } from "@/components/common/score-viz";
import { useT } from "@/lib/i18n";
import { usageDescParams } from "@/lib/billing/plan-copy";

type UsageData = {
  plan: { planId: string; displayName: string; auditsPerMonth: number | null; aiGensPerMonth: number | null };
  periodStart: string;
  periodEnd: string;
  counts: {
    audit: number;
    ai_generation: number;
    competitor_compare: number;
    api_call: number;
  };
  endpoints: { metric: string; used: number; limit: number | null }[];
  usagePct: number;
};

const METRIC_META: Record<
  string,
  { icon: typeof Zap; labelKey: "usage.auditsThisMonth" | "usage.aiGenerations" | "usage.competitorComparisons" | "usage.apiCalls"; color: string }
> = {
  audit: { icon: Zap, labelKey: "usage.auditsThisMonth", color: "#FF6600" },
  ai_generation: { icon: Bot, labelKey: "usage.aiGenerations", color: "#ff983f" },
  competitor_compare: { icon: Swords, labelKey: "usage.competitorComparisons", color: "#929292" },
  api_call: { icon: Activity, labelKey: "usage.apiCalls", color: "#cc5200" },
};

function formatLimit(limit: number | null): string {
  return limit == null ? "∞" : String(limit);
}

export default function UsagePage() {
  const t = useT();
  const [usage, setUsage] = React.useState<UsageData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setError(null);
    setNeedsAuth(false);
    (async () => {
      try {
        const res = await fetch("/api/usage");
        if (!res.ok) {
          if (!cancelled) {
            setNeedsAuth(res.status === 401);
            setError(res.status === 401 ? t("usage.signInToView") : t("usage.loadError"));
          }
          return;
        }
        const json = (await res.json()) as { usage: UsageData };
        if (!cancelled) setUsage(json.usage);
      } catch {
        if (!cancelled) setError(t("usage.loadError"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [retryKey, t]);

  const renewLabel = usage
    ? new Date(usage.periodEnd).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <PageShell>
      <PageHeader title={t("usage.title")} subtitle={t("usage.subtitle")} icon={BarChart3} back="/settings" />
      <PageContent className="space-y-6 max-w-3xl">
        {!usage && !error && (
          <div className="py-16 text-center">
            <Loader2 className="size-8 animate-spin mx-auto text-primary" />
          </div>
        )}

        {error && (
          <ApiLoadError
            message={error}
            needsAuth={needsAuth}
            onRetry={() => {
              setUsage(null);
              setRetryKey((k) => k + 1);
            }}
          />
        )}

        {usage && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border/50 bg-card p-6 flex items-center gap-6"
            >
              <ScoreRadial score={usage.usagePct} size={100} stroke={8} label={t("settings.usage")} />
              <div>
                <h2 className="font-display text-xl font-bold">{t("usage.planUsage")}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("usage.usageDesc", usageDescParams(usage.usagePct, usage.plan.displayName))}
                </p>
                <p className="text-xs text-muted-foreground mt-2">{t("usage.periodEnds", { date: renewLabel })}</p>
              </div>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-4">
              {usage.endpoints
                .filter((e) => e.metric !== "api_call")
                .map((e, i) => {
                  const meta = METRIC_META[e.metric] ?? METRIC_META.audit!;
                  const pct =
                    e.limit != null && e.limit > 0
                      ? Math.min(100, Math.round((e.used / e.limit) * 100))
                      : e.used > 0
                        ? 5
                        : 0;
                  return (
                    <motion.div
                      key={e.metric}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="rounded-2xl border border-border/50 bg-card p-5"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="size-9 rounded-lg grid place-items-center"
                          style={{ background: `${meta.color}1a`, color: meta.color }}
                        >
                          <meta.icon className="size-5" />
                        </span>
                        <div className="flex-1">
                          <div className="text-sm font-semibold">{t(meta.labelKey)}</div>
                          <div className="text-xs text-muted-foreground">
                            {e.used} / {formatLimit(e.limit)}
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: meta.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                        />
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1.5">
                        {t("usage.used", { used: `${pct}%` })}
                      </div>
                    </motion.div>
                  );
                })}
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <h2 className="font-display text-lg font-bold mb-4">{t("usage.apiUsage")}</h2>
              <div className="space-y-3">
                {usage.endpoints.map((api) => (
                  <div
                    key={api.metric}
                    className="flex items-center gap-4 py-2 border-b border-border/50 last:border-0"
                  >
                    <code className="text-xs font-mono text-primary bg-primary/5 px-2 py-1 rounded">
                      {api.metric}
                    </code>
                    <div className="flex-1 text-xs text-muted-foreground">
                      {t("usage.calls", {
                        used: api.used,
                        limit: formatLimit(api.limit),
                      })}
                    </div>
                    <div className="text-xs font-semibold tabular-nums">
                      {api.limit != null && api.limit > 0
                        ? `${((api.used / api.limit) * 100).toFixed(1)}%`
                        : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </PageContent>
    </PageShell>
  );
}
