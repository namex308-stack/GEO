"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  HeartPulse,
  Lightbulb,
  Minus,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT, type TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type {
  HealthIssueItem,
  HealthPillar,
  StoreHealthPayload,
} from "@/lib/store-health/types";

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

const PILLAR_LABEL_KEYS: Record<HealthPillar["key"], TranslationKey> = {
  seo: "storeHealth.pillarSeo",
  geo: "storeHealth.pillarGeo",
  conversion: "storeHealth.pillarConversion",
  trust: "storeHealth.pillarTrust",
  performance: "storeHealth.pillarPerformance",
};

function bandLabelKey(band: NonNullable<StoreHealthPayload["healthBand"]>): TranslationKey {
  switch (band) {
    case "excellent":
      return "storeHealth.bandExcellent";
    case "good":
      return "storeHealth.bandGood";
    case "fair":
      return "storeHealth.bandFair";
    case "poor":
      return "storeHealth.bandPoor";
    default: {
      const _exhaustive: never = band;
      return _exhaustive;
    }
  }
}

function statusClass(status: HealthPillar["status"]): string {
  switch (status) {
    case "healthy":
      return "bg-emerald-500/15 text-emerald-700";
    case "warning":
      return "bg-amber-500/15 text-amber-800";
    case "critical":
      return "bg-rose-500/15 text-rose-700";
    case "unknown":
      return "bg-muted text-muted-foreground";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function TrendIcon({ trend }: { trend: StoreHealthPayload["trend"] }) {
  if (trend === "up") return <ArrowUpRight className="size-4 text-emerald-600" />;
  if (trend === "down") return <ArrowDownRight className="size-4 text-rose-600" />;
  return <Minus className="size-4 text-muted-foreground" />;
}

function IssueCard({
  title,
  empty,
  items,
  tone,
}: {
  title: string;
  empty: string;
  items: HealthIssueItem[];
  tone: "critical" | "warning" | "rec";
}) {
  const Icon =
    tone === "critical" ? ShieldAlert : tone === "warning" ? AlertTriangle : Lightbulb;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!items.length ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="border-b border-border/40 last:border-0 pb-3 last:pb-0">
                <p className="text-sm font-medium leading-relaxed">{item.problem}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.solution}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function StoreHealthView({ health }: { health: StoreHealthPayload }) {
  const t = useT();

  if (!health.auditId) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <p className="text-sm text-muted-foreground">{t("storeHealth.empty")}</p>
          <Button asChild className="rounded-full">
            <Link href="/audit/new">{t("storeHealth.runAudit")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="size-5 text-primary" />
              {t("storeHealth.currentHealth")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-5xl font-bold tabular-nums">
                {health.currentHealth ?? "—"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">{health.storeName}</p>
              {health.healthBand && (
                <Badge variant="secondary" className="mt-3">
                  {t(bandLabelKey(health.healthBand))}
                </Badge>
              )}
            </div>
            <div className="text-sm space-y-2">
              <p className="flex items-center gap-2">
                <TrendIcon trend={health.trend} />
                <span>
                  {health.trend === "up"
                    ? t("storeHealth.trendUp")
                    : health.trend === "down"
                      ? t("storeHealth.trendDown")
                      : t("storeHealth.trendFlat")}
                </span>
              </p>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link href={`/audit/${health.auditId}/report`}>{t("storeHealth.openReport")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              {t("storeHealth.scanTiming")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">{t("storeHealth.lastScan")}</p>
              <p className="font-medium mt-1">
                {health.lastScan
                  ? new Date(health.lastScan).toLocaleString("ar", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("storeHealth.nextScan")}</p>
              <p className="font-medium mt-1">
                {health.nextScan
                  ? new Date(health.nextScan).toLocaleString("ar", {
                      dateStyle: "medium",
                    })
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{health.nextScanLabel}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          {t("storeHealth.pillars")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {health.pillars.map((pillar) => (
            <Card key={pillar.key}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{t(PILLAR_LABEL_KEYS[pillar.key])}</p>
                  <Badge variant="secondary" className={cn(statusClass(pillar.status))}>
                    {pillar.score ?? "—"}
                  </Badge>
                </div>
                {pillar.summary && (
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-3">
                    {pillar.summary}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <IssueCard
          title={t("storeHealth.criticalProblems")}
          empty={t("storeHealth.noCritical")}
          items={health.criticalProblems}
          tone="critical"
        />
        <IssueCard
          title={t("storeHealth.warnings")}
          empty={t("storeHealth.noWarnings")}
          items={health.warnings}
          tone="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            {t("storeHealth.healthySignals")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!health.healthySignals.length ? (
            <p className="text-sm text-muted-foreground">{t("storeHealth.noHealthy")}</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {health.healthySignals.map((signal) => (
                <li key={signal.id} className="rounded-xl border border-border/40 px-4 py-3">
                  <p className="text-sm font-medium">{signal.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {signal.detail}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("storeHealth.historicalTrend")}</CardTitle>
        </CardHeader>
        <CardContent>
          {health.historicalTrend.length < 2 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {t("storeHealth.needMoreAudits")}
            </p>
          ) : (
            <div className="h-64 w-full">
              <ScoreTrendChart data={health.historicalTrend} />
            </div>
          )}
        </CardContent>
      </Card>

      <IssueCard
        title={t("storeHealth.recommendations")}
        empty={t("storeHealth.noRecommendations")}
        items={health.recommendations}
        tone="rec"
      />
    </div>
  );
}
