"use client";

import * as React from "react";
import { ListChecks } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { GrowthTasksView } from "@/components/app/growth-tasks-view";
import { ApiLoadError } from "@/components/runtime/api-load-error";
import { useT } from "@/lib/i18n";
import type { GrowthTasksOverview } from "@/lib/growth-tasks/types";

export default function GrowthTasksPage() {
  const t = useT();
  const [overview, setOverview] = React.useState<GrowthTasksOverview | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setError(null);
    setNeedsAuth(false);
    async function load() {
      try {
        const res = await fetch("/api/growth-tasks");
        if (!res.ok) {
          if (!cancelled) {
            setNeedsAuth(res.status === 401);
            setError(
              res.status === 401
                ? t("growthTasks.signInRequired")
                : t("growthTasks.loadError")
            );
          }
          return;
        }
        const data = (await res.json()) as { tasks: GrowthTasksOverview };
        if (!cancelled) setOverview(data.tasks);
      } catch {
        if (!cancelled) setError(t("growthTasks.loadError"));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [t, retryKey]);

  const toggleComplete = async (taskId: string, completed: boolean) => {
    const res = await fetch(`/api/growth-tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      task: GrowthTasksOverview["groups"][number]["tasks"][number];
    };
    setOverview((prev) => {
      if (!prev) return prev;
      const groups = prev.groups.map((group) => ({
        ...group,
        tasks: group.tasks.map((task) =>
          task.id === taskId ? data.task : task
        ),
      }));
      const flat = groups.flatMap((g) => g.tasks);
      return {
        groups,
        openCount: flat.filter((t) => t.status === "open").length,
        doneCount: flat.filter((t) => t.status === "done").length,
        autoResolvedCount: flat.filter((t) => t.status === "auto_resolved").length,
        totalCount: flat.length,
      };
    });
  };

  return (
    <PageShell>
      <PageHeader
        title={t("growthTasks.title")}
        subtitle={t("growthTasks.subtitle")}
        icon={ListChecks}
        back="/dashboard"
      />
      <PageContent className="max-w-4xl">
        {error ? (
          <ApiLoadError
            message={error}
            needsAuth={needsAuth}
            onRetry={() => setRetryKey((k) => k + 1)}
          />
        ) : overview == null ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        ) : (
          <GrowthTasksView
            overview={overview}
            onToggleComplete={(id, completed) => void toggleComplete(id, completed)}
          />
        )}
      </PageContent>
    </PageShell>
  );
}
