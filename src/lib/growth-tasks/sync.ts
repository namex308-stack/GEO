import { buildTasksFromRecommendations } from "@/lib/report/growth-roadmap";
import type { Recommendation } from "@/lib/types";
import type {
  GrowthTaskRecord,
  GrowthTaskStatus,
  GrowthTaskUpsert,
} from "./types";

export type GrowthTaskSyncPlan = {
  upserts: GrowthTaskUpsert[];
  /** Fingerprints that transitioned open → auto_resolved this sync. */
  autoResolvedFingerprints: string[];
  /** Fingerprints reopened after auto_resolve when the issue returned. */
  reopenedFingerprints: string[];
};

/**
 * Plan workspace task upserts from the latest recommendations.
 * Reuses `buildTasksFromRecommendations` (which uses prioritizeRecommendations).
 * Auto-completes open tasks whose fingerprint disappeared after re-analysis.
 */
export function planGrowthTaskSync(input: {
  recommendations: Recommendation[];
  existing: GrowthTaskRecord[];
  auditId: string;
  now?: string;
}): GrowthTaskSyncPlan {
  const now = input.now ?? new Date().toISOString();
  const drafts = buildTasksFromRecommendations(input.recommendations);
  const existingByFp = new Map(input.existing.map((t) => [t.fingerprint, t]));
  const latestFingerprints = new Set(drafts.map((d) => d.fingerprint));

  const upserts: GrowthTaskUpsert[] = [];
  const autoResolvedFingerprints: string[] = [];
  const reopenedFingerprints: string[] = [];

  for (const draft of drafts) {
    const prev = existingByFp.get(draft.fingerprint);
    let status: GrowthTaskStatus = "open";
    let completedAt: string | null = null;
    let completionSource: GrowthTaskUpsert["completionSource"] = null;
    let resolvedAuditId: string | null = null;

    if (prev?.status === "done" && prev.completionSource === "user") {
      // Preserve manual completion even if the finding still appears.
      status = "done";
      completedAt = prev.completedAt ?? now;
      completionSource = "user";
      resolvedAuditId = prev.resolvedAuditId;
    } else if (prev?.status === "auto_resolved") {
      // Issue returned — reopen for action.
      status = "open";
      completedAt = null;
      completionSource = null;
      resolvedAuditId = null;
      reopenedFingerprints.push(draft.fingerprint);
    }

    upserts.push({
      fingerprint: draft.fingerprint,
      externalKey: draft.externalKey,
      title: draft.title,
      category: draft.category,
      priority: draft.priority,
      difficulty: draft.difficulty,
      estimatedTime: draft.estimatedTime,
      expectedBusinessImpact: draft.expectedBusinessImpact,
      horizon: draft.horizon,
      suggestedOrder: draft.suggestedOrder,
      status,
      completedAt,
      completionSource,
      sourceAuditId: input.auditId,
      resolvedAuditId,
      recommendationProblem: draft.problem,
      recommendationSolution: draft.solution,
      severity: draft.severity,
      impact: draft.impact,
      effort: draft.effort,
    });
  }

  // Open tasks whose issue disappeared → auto-resolved by re-analysis.
  for (const prev of input.existing) {
    if (latestFingerprints.has(prev.fingerprint)) continue;
    if (prev.status === "done" && prev.completionSource === "user") {
      // Keep user-done rows as done; optionally stamp resolved audit.
      upserts.push({
        fingerprint: prev.fingerprint,
        externalKey: prev.externalKey || prev.fingerprint,
        title: prev.title,
        category: prev.category,
        priority: prev.priority,
        difficulty: prev.difficulty,
        estimatedTime: prev.estimatedTime,
        expectedBusinessImpact: prev.expectedBusinessImpact,
        horizon: prev.horizon,
        suggestedOrder: prev.suggestedOrder,
        status: "done",
        completedAt: prev.completedAt ?? now,
        completionSource: "user",
        sourceAuditId: prev.sourceAuditId || input.auditId,
        resolvedAuditId: input.auditId,
        recommendationProblem: prev.recommendationProblem || "",
        recommendationSolution: prev.recommendationSolution || "",
        severity: prev.severity || "opportunity",
        impact: prev.impact || "low",
        effort: prev.effort || "medium",
      });
      continue;
    }

    if (prev.status === "auto_resolved") {
      // Already resolved — refresh resolved audit pointer only.
      upserts.push({
        fingerprint: prev.fingerprint,
        externalKey: prev.externalKey || prev.fingerprint,
        title: prev.title,
        category: prev.category,
        priority: prev.priority,
        difficulty: prev.difficulty,
        estimatedTime: prev.estimatedTime,
        expectedBusinessImpact: prev.expectedBusinessImpact,
        horizon: prev.horizon,
        suggestedOrder: prev.suggestedOrder,
        status: "auto_resolved",
        completedAt: prev.completedAt ?? now,
        completionSource: "reanalysis",
        sourceAuditId: prev.sourceAuditId || input.auditId,
        resolvedAuditId: input.auditId,
        recommendationProblem: prev.recommendationProblem || "",
        recommendationSolution: prev.recommendationSolution || "",
        severity: prev.severity || "opportunity",
        impact: prev.impact || "low",
        effort: prev.effort || "medium",
      });
      continue;
    }

    autoResolvedFingerprints.push(prev.fingerprint);
    upserts.push({
      fingerprint: prev.fingerprint,
      externalKey: prev.externalKey || prev.fingerprint,
      title: prev.title,
      category: prev.category,
      priority: prev.priority,
      difficulty: prev.difficulty,
      estimatedTime: prev.estimatedTime,
      expectedBusinessImpact: prev.expectedBusinessImpact,
      horizon: prev.horizon,
      suggestedOrder: prev.suggestedOrder,
      status: "auto_resolved",
      completedAt: now,
      completionSource: "reanalysis",
      sourceAuditId: prev.sourceAuditId || input.auditId,
      resolvedAuditId: input.auditId,
      recommendationProblem: prev.recommendationProblem || "",
      recommendationSolution: prev.recommendationSolution || "",
      severity: prev.severity || "opportunity",
      impact: prev.impact || "low",
      effort: prev.effort || "medium",
    });
  }

  return { upserts, autoResolvedFingerprints, reopenedFingerprints };
}

/** Group tasks into Today / This Week / This Month / Long Term. */
export function groupTasksByHorizon(
  tasks: GrowthTaskRecord[]
): Array<{ horizon: GrowthTaskRecord["horizon"]; tasks: GrowthTaskRecord[] }> {
  const order: GrowthTaskRecord["horizon"][] = [
    "today",
    "week",
    "month",
    "longterm",
  ];
  const buckets: Record<GrowthTaskRecord["horizon"], GrowthTaskRecord[]> = {
    today: [],
    week: [],
    month: [],
    longterm: [],
  };

  const sorted = [...tasks].sort((a, b) => {
    if (a.status !== b.status) {
      // open first, then done, then auto_resolved
      const rank = (s: GrowthTaskStatus) =>
        s === "open" ? 0 : s === "done" ? 1 : 2;
      return rank(a.status) - rank(b.status);
    }
    return a.suggestedOrder - b.suggestedOrder;
  });

  for (const task of sorted) {
    buckets[task.horizon].push(task);
  }

  return order.map((horizon) => ({ horizon, tasks: buckets[horizon] }));
}
