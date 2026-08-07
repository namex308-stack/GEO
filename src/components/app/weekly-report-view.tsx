"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Minus,
  Sparkles,
  AlertTriangle,
  ListChecks,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ScoreChange, WeeklyReportPayload } from "@/lib/weekly-report/types";

function DeltaIcon({ direction }: { direction: ScoreChange["direction"] }) {
  if (direction === "up") return <ArrowUpRight className="size-4 text-emerald-600" />;
  if (direction === "down") return <ArrowDownRight className="size-4 text-rose-600" />;
  return <Minus className="size-4 text-muted-foreground" />;
}

function ScoreChangeCard({
  label,
  change,
}: {
  label: string;
  change: ScoreChange;
}) {
  const t = useT();
  return (
    <Card className={cn(!change.meaningful && "opacity-70")}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span>{label}</span>
          <DeltaIcon direction={change.direction} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="font-display text-3xl font-bold tabular-nums">
              {change.current ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {change.previous == null
                ? t("weeklyReport.noBaseline")
                : t("weeklyReport.previousScore", { score: change.previous })}
            </p>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              "tabular-nums",
              change.direction === "up" && "bg-emerald-500/15 text-emerald-700",
              change.direction === "down" && "bg-rose-500/15 text-rose-700"
            )}
          >
            {change.delta > 0 ? `+${change.delta}` : change.delta}
          </Badge>
        </div>
        {!change.meaningful && (
          <p className="text-xs text-muted-foreground mt-3">{t("weeklyReport.noMeaningfulChange")}</p>
        )}
      </CardContent>
    </Card>
  );
}

function IssueList({
  title,
  empty,
  items,
  tone,
}: {
  title: string;
  empty: string;
  items: { id: string; problem: string; solution: string }[];
  tone: "new" | "resolved" | "priority";
}) {
  const Icon =
    tone === "resolved" ? CheckCircle2 : tone === "priority" ? ListChecks : AlertTriangle;
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

export function WeeklyReportView({
  reportId,
  payload,
  latestAuditId,
}: {
  reportId: string;
  payload: WeeklyReportPayload;
  latestAuditId: string | null;
}) {
  const t = useT();

  return (
    <div className="space-y-6" data-report-id={reportId}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            {t("weeklyReport.executiveSummary")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-base leading-relaxed">{payload.executiveSummary.headline}</p>
          <ul className="list-disc pr-5 space-y-1.5 text-sm text-muted-foreground">
            {payload.executiveSummary.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          {latestAuditId && (
            <Link
              href={`/audit/${latestAuditId}/report`}
              className="inline-flex text-sm text-primary hover:underline"
            >
              {t("weeklyReport.openLatestAudit")}
            </Link>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="font-display text-lg font-bold mb-3">{t("weeklyReport.scoreChanges")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ScoreChangeCard label={t("weeklyReport.overall")} change={payload.overallScoreChange} />
          <ScoreChangeCard label={t("weeklyReport.geo")} change={payload.geoScoreChange} />
          <ScoreChangeCard label={t("weeklyReport.seo")} change={payload.seoScoreChange} />
          <ScoreChangeCard label={t("weeklyReport.trust")} change={payload.trustScoreChange} />
          <ScoreChangeCard
            label={t("weeklyReport.conversion")}
            change={payload.conversionScoreChange}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <IssueList
          title={t("weeklyReport.newIssues")}
          empty={t("weeklyReport.noNewIssues")}
          items={payload.newIssues}
          tone="new"
        />
        <IssueList
          title={t("weeklyReport.resolvedIssues")}
          empty={t("weeklyReport.noResolvedIssues")}
          items={payload.resolvedIssues}
          tone="resolved"
        />
      </div>

      <IssueList
        title={t("weeklyReport.priorityActions")}
        empty={t("weeklyReport.noPriorityActions")}
        items={payload.highestPriorityActions}
        tone="priority"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            {t("weeklyReport.aiExecutiveSummary")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {payload.aiExecutiveSummary}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
