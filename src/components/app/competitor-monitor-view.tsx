"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  Lightbulb,
  ListTree,
  Swords,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type {
  CompetitorChangeRecord,
  CompetitorMonitorOverview,
  CompetitorTargetDetail,
} from "@/lib/competitor-monitor/types";

function severityClass(severity: CompetitorChangeRecord["severity"]): string {
  switch (severity) {
    case "critical":
      return "bg-rose-500/15 text-rose-700";
    case "warning":
      return "bg-amber-500/15 text-amber-800";
    case "info":
      return "bg-muted text-muted-foreground";
    default: {
      const _exhaustive: never = severity;
      return _exhaustive;
    }
  }
}

function ChangeList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: CompetitorChangeRecord[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ListTree className="size-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!items.length ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="border-b border-border/40 last:border-0 pb-3 last:pb-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium leading-relaxed">{item.summary}</p>
                  <Badge variant="secondary" className={cn("shrink-0", severityClass(item.severity))}>
                    {item.changeType}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.detectedAt.slice(0, 16).replace("T", " ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function BulletCard({
  icon: Icon,
  title,
  empty,
  items,
}: {
  icon: typeof Lightbulb;
  title: string;
  empty: string;
  items: string[];
}) {
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
          <ul className="list-disc pr-5 space-y-2 text-sm leading-relaxed">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function CompetitorMonitorOverviewView({
  monitor,
}: {
  monitor: CompetitorMonitorOverview;
}) {
  const t = useT();

  return (
    <div className="space-y-6">
      {!monitor.crawlEnabled && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-4 text-sm text-muted-foreground flex items-start gap-2">
            <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
            {t("monitor.crawlDisabledDev")}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Swords className="size-4 text-primary" />
            {t("monitor.targets")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!monitor.targets.length ? (
            <p className="text-sm text-muted-foreground">{t("monitor.noTargets")}</p>
          ) : (
            <ul className="space-y-2">
              {monitor.targets.map((target) => (
                <li key={target.id}>
                  <Link
                    href={`/monitor/${target.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/50 px-4 py-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {target.label || target.url}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{target.url}</p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground shrink-0 rotate-180" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChangeList
          title={t("monitor.latestChanges")}
          empty={t("monitor.noChanges")}
          items={monitor.latestChanges}
        />
        <ChangeList
          title={t("monitor.timeline")}
          empty={t("monitor.noChanges")}
          items={monitor.timeline.slice(0, 20)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BulletCard
          icon={Eye}
          title={t("monitor.businessImpact")}
          empty={t("monitor.noImpact")}
          items={monitor.businessImpact}
        />
        <BulletCard
          icon={Lightbulb}
          title={t("monitor.recommendedActions")}
          empty={t("monitor.noActions")}
          items={monitor.recommendedActions}
        />
      </div>
    </div>
  );
}

export function CompetitorTargetDetailView({
  detail,
}: {
  detail: CompetitorTargetDetail;
}) {
  const t = useT();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{detail.target.label || detail.target.url}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p className="break-all">{detail.target.url}</p>
          <p>
            {t("monitor.lastChecked")}:{" "}
            {detail.target.lastCheckedAt
              ? detail.target.lastCheckedAt.slice(0, 16).replace("T", " ")
              : "—"}
          </p>
          <p>
            {t("monitor.snapshotsCount", { count: detail.snapshots.length })}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChangeList
          title={t("monitor.latestChanges")}
          empty={t("monitor.noChanges")}
          items={detail.latestChanges}
        />
        <ChangeList
          title={t("monitor.timeline")}
          empty={t("monitor.noChanges")}
          items={detail.timeline}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BulletCard
          icon={Eye}
          title={t("monitor.businessImpact")}
          empty={t("monitor.noImpact")}
          items={detail.businessImpact}
        />
        <BulletCard
          icon={Lightbulb}
          title={t("monitor.recommendedActions")}
          empty={t("monitor.noActions")}
          items={detail.recommendedActions}
        />
      </div>
    </div>
  );
}
