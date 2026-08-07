"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Sparkles,
  TrendingUp,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { GeoTrackingSummary } from "@/lib/geo-tracking/types";

const ScoreTrendChart = dynamic(
  () =>
    import("@/components/app/score-trend-chart").then((m) => ({
      default: m.ScoreTrendChart,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse rounded-xl bg-muted/40" aria-hidden />
    ),
  }
);

function TrendIcon({ trend }: { trend: GeoTrackingSummary["trend"] }) {
  if (trend === "up") return <ArrowUpRight className="size-4 text-emerald-600" />;
  if (trend === "down") return <ArrowDownRight className="size-4 text-rose-600" />;
  return <Minus className="size-4 text-muted-foreground" />;
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn(
            "font-display text-2xl font-bold tabular-nums mt-1",
            tone === "up" && "text-emerald-700",
            tone === "down" && "text-rose-700"
          )}
        >
          {value}
        </p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function GeoTrackingView({ tracking }: { tracking: GeoTrackingSummary }) {
  const t = useT();
  const explanation = tracking.latestExplanation;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("geoTracking.latestScore")}
          value={tracking.latestScore != null ? String(tracking.latestScore) : "—"}
        />
        <StatCard
          label={t("geoTracking.bestScore")}
          value={tracking.bestScore != null ? String(tracking.bestScore) : "—"}
          tone="up"
        />
        <StatCard
          label={t("geoTracking.worstScore")}
          value={tracking.worstScore != null ? String(tracking.worstScore) : "—"}
          tone="down"
        />
        <Card>
          <CardContent className="py-5">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="size-3.5" />
              {t("geoTracking.scoreTrend")}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <TrendIcon trend={tracking.trend} />
              <span className="font-display text-2xl font-bold">
                {tracking.trend === "up"
                  ? t("geoTracking.trendUp")
                  : tracking.trend === "down"
                    ? t("geoTracking.trendDown")
                    : t("geoTracking.trendFlat")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {tracking.netDelta != null
                ? t("geoTracking.netDelta", {
                    delta:
                      tracking.netDelta > 0
                        ? `+${tracking.netDelta}`
                        : String(tracking.netDelta),
                  })
                : t("geoTracking.needMoreAudits")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label={t("geoTracking.improvementPct")}
          value={`${tracking.improvementPct}%`}
          tone="up"
          hint={t("geoTracking.improvementHint")}
        />
        <StatCard
          label={t("geoTracking.regressionPct")}
          value={`${tracking.regressionPct}%`}
          tone="down"
          hint={t("geoTracking.regressionHint")}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            {t("geoTracking.historicalGraph")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tracking.graph.length < 2 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">
              {t("geoTracking.needMoreAudits")}
            </p>
          ) : (
            <div className="h-64 w-full">
              <ScoreTrendChart data={tracking.graph} />
            </div>
          )}
        </CardContent>
      </Card>

      {tracking.graph.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("geoTracking.componentSeries")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-xs border-b border-border/50">
                    <th className="text-start py-2 pe-3 font-medium">{t("geoTracking.date")}</th>
                    <th className="text-center py-2 px-2 font-medium">GEO</th>
                    <th className="text-center py-2 px-2 font-medium">{t("geoTracking.citation")}</th>
                    <th className="text-center py-2 px-2 font-medium">{t("geoTracking.schema")}</th>
                    <th className="text-center py-2 px-2 font-medium">{t("geoTracking.entity")}</th>
                    <th className="text-center py-2 px-2 font-medium">{t("geoTracking.faq")}</th>
                    <th className="text-center py-2 px-2 font-medium">{t("geoTracking.readability")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...tracking.graph].reverse().slice(0, 12).map((row) => (
                    <tr key={row.auditId} className="border-b border-border/30 last:border-0">
                      <td className="py-2.5 pe-3">
                        <Link
                          href={`/audit/${row.auditId}/report`}
                          className="text-primary hover:underline"
                        >
                          {row.label}
                        </Link>
                      </td>
                      <td className="text-center tabular-nums py-2.5 px-2 font-medium">{row.score}</td>
                      <td className="text-center tabular-nums py-2.5 px-2">{row.citationScore ?? "—"}</td>
                      <td className="text-center tabular-nums py-2.5 px-2">{row.schemaScore ?? "—"}</td>
                      <td className="text-center tabular-nums py-2.5 px-2">{row.entityScore ?? "—"}</td>
                      <td className="text-center tabular-nums py-2.5 px-2">{row.faqScore ?? "—"}</td>
                      <td className="text-center tabular-nums py-2.5 px-2">{row.aiReadability ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("geoTracking.whyChanged")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!explanation ? (
            <p className="text-sm text-muted-foreground">{t("geoTracking.needMoreAudits")}</p>
          ) : (
            <>
              <p className="text-sm leading-relaxed">{explanation.whyChanged}</p>
              <Badge variant="secondary" className="tabular-nums">
                {explanation.delta > 0 ? `+${explanation.delta}` : explanation.delta}
              </Badge>
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5 mb-2">
                    <Wrench className="size-4 text-emerald-600" />
                    {t("geoTracking.fixesImproved")}
                  </p>
                  {!explanation.fixesImproved.length ? (
                    <p className="text-xs text-muted-foreground">{t("geoTracking.noFixes")}</p>
                  ) : (
                    <ul className="list-disc pr-5 space-y-1.5 text-sm text-muted-foreground">
                      {explanation.fixesImproved.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="size-4 text-rose-600" />
                    {t("geoTracking.issuesReduced")}
                  </p>
                  {!explanation.issuesReduced.length ? (
                    <p className="text-xs text-muted-foreground">{t("geoTracking.noIssues")}</p>
                  ) : (
                    <ul className="list-disc pr-5 space-y-1.5 text-sm text-muted-foreground">
                      {explanation.issuesReduced.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
