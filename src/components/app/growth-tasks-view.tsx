"use client";

import {
  CheckCircle2,
  Circle,
  Clock3,
  ListOrdered,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type {
  GrowthTaskRecord,
  GrowthTasksOverview,
} from "@/lib/growth-tasks/types";
import type { RoadmapHorizon } from "@/lib/report/growth-roadmap";

function priorityClass(priority: GrowthTaskRecord["priority"]): string {
  switch (priority) {
    case "p1":
      return "bg-rose-500/15 text-rose-700";
    case "p2":
      return "bg-amber-500/15 text-amber-800";
    case "p3":
      return "bg-sky-500/15 text-sky-800";
    default: {
      const _exhaustive: never = priority;
      return _exhaustive;
    }
  }
}

function statusLabelKey(
  status: GrowthTaskRecord["status"]
): "growthTasks.statusOpen" | "growthTasks.statusDone" | "growthTasks.statusAutoResolved" {
  switch (status) {
    case "open":
      return "growthTasks.statusOpen";
    case "done":
      return "growthTasks.statusDone";
    case "auto_resolved":
      return "growthTasks.statusAutoResolved";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function horizonTitleKey(
  horizon: RoadmapHorizon
):
  | "growthTasks.horizonToday"
  | "growthTasks.horizonWeek"
  | "growthTasks.horizonMonth"
  | "growthTasks.horizonLongterm" {
  switch (horizon) {
    case "today":
      return "growthTasks.horizonToday";
    case "week":
      return "growthTasks.horizonWeek";
    case "month":
      return "growthTasks.horizonMonth";
    case "longterm":
      return "growthTasks.horizonLongterm";
    default: {
      const _exhaustive: never = horizon;
      return _exhaustive;
    }
  }
}

function formatCompletedAt(iso: string | null): string | null {
  if (!iso) return null;
  return iso.slice(0, 16).replace("T", " ");
}

export function GrowthTasksView({
  overview,
  onToggleComplete,
}: {
  overview: GrowthTasksOverview;
  onToggleComplete: (taskId: string, completed: boolean) => void;
}) {
  const t = useT();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Circle className="size-3.5 text-primary" />
          {t("growthTasks.openCount", { count: overview.openCount })}
        </span>
        <span className="text-border">·</span>
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-emerald-600" />
          {t("growthTasks.doneCount", { count: overview.doneCount })}
        </span>
        <span className="text-border">·</span>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-sky-600" />
          {t("growthTasks.autoResolvedCount", {
            count: overview.autoResolvedCount,
          })}
        </span>
      </div>

      {!overview.totalCount ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("growthTasks.empty")}
          </CardContent>
        </Card>
      ) : (
        overview.groups.map((group) => (
          <section key={group.horizon} className="space-y-3">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {t(horizonTitleKey(group.horizon))}
            </h2>
            {!group.tasks.length ? (
              <p className="text-sm text-muted-foreground">
                {t("growthTasks.horizonEmpty")}
              </p>
            ) : (
              <ul className="space-y-3">
                {group.tasks.map((task) => (
                  <li key={task.id}>
                    <TaskCard task={task} onToggleComplete={onToggleComplete} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      )}
    </div>
  );
}

function TaskCard({
  task,
  onToggleComplete,
}: {
  task: GrowthTaskRecord;
  onToggleComplete: (taskId: string, completed: boolean) => void;
}) {
  const t = useT();
  const isComplete = task.status === "done" || task.status === "auto_resolved";
  const completedLabel = formatCompletedAt(task.completedAt);
  const checkboxDisabled = task.status === "auto_resolved";

  return (
    <Card
      className={cn(
        "transition-colors",
        isComplete && "border-emerald-500/20 bg-emerald-500/[0.03]"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isComplete}
            disabled={checkboxDisabled}
            onCheckedChange={(value) => {
              if (checkboxDisabled) return;
              onToggleComplete(task.id, value === true);
            }}
            className="mt-1"
            aria-label={t("growthTasks.completionCheckbox")}
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <CardTitle
                className={cn(
                  "text-base leading-relaxed",
                  isComplete && "text-muted-foreground line-through"
                )}
              >
                {task.title}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <Badge variant="secondary" className={priorityClass(task.priority)}>
                  {t(`growthTasks.priority.${task.priority}`)}
                </Badge>
                <Badge variant="outline">{t(statusLabelKey(task.status))}</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>
                {t("growthTasks.category")}: {t(`growthTasks.category.${task.category}`)}
              </span>
              <span>
                {t("growthTasks.difficulty")}:{" "}
                {t(`growthTasks.difficulty.${task.difficulty}`)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="size-3" />
                {task.estimatedTime}
              </span>
              <span className="inline-flex items-center gap-1">
                <ListOrdered className="size-3" />
                {t("growthTasks.suggestedOrder", { order: task.suggestedOrder })}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 ps-10 text-sm">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            {t("growthTasks.expectedImpact")}
          </p>
          <p className="leading-relaxed">{task.expectedBusinessImpact}</p>
        </div>
        {completedLabel && (
          <p className="text-xs text-muted-foreground">
            {t("growthTasks.completedAt", { date: completedLabel })}
            {task.completionSource === "reanalysis"
              ? ` — ${t("growthTasks.completedByReanalysis")}`
              : task.completionSource === "user"
                ? ` — ${t("growthTasks.completedByUser")}`
                : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
