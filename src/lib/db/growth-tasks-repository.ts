import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import type { Json } from "@/lib/db/database.types";
import type { Recommendation, ScorePillar } from "@/lib/types";
import type {
  RoadmapDifficulty,
  RoadmapHorizon,
  RoadmapPriority,
} from "@/lib/report/growth-roadmap";
import type {
  GrowthTaskRecord,
  GrowthTaskStatus,
  GrowthTaskUpsert,
  GrowthTaskCompletionSource,
} from "@/lib/growth-tasks/types";
import { planGrowthTaskSync } from "@/lib/growth-tasks/sync";
import { emitCompletedTaskNotification } from "@/lib/notifications/emit";

function mapTask(row: Record<string, unknown>): GrowthTaskRecord {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    storeId: (row.store_id as string) ?? null,
    fingerprint: row.fingerprint as string,
    externalKey: (row.external_key as string) ?? null,
    title: row.title as string,
    category: row.category as ScorePillar,
    priority: row.priority as RoadmapPriority,
    difficulty: row.difficulty as RoadmapDifficulty,
    estimatedTime: row.estimated_time as string,
    expectedBusinessImpact: row.expected_business_impact as string,
    horizon: row.horizon as RoadmapHorizon,
    suggestedOrder: Number(row.suggested_order ?? 0),
    status: row.status as GrowthTaskStatus,
    completedAt: (row.completed_at as string) ?? null,
    completionSource:
      (row.completion_source as GrowthTaskCompletionSource | null) ?? null,
    sourceAuditId: (row.source_audit_id as string) ?? null,
    resolvedAuditId: (row.resolved_audit_id as string) ?? null,
    recommendationProblem: (row.recommendation_problem as string) ?? null,
    recommendationSolution: (row.recommendation_solution as string) ?? null,
    severity: (row.severity as Recommendation["severity"] | null) ?? null,
    impact: (row.impact as Recommendation["impact"] | null) ?? null,
    effort:
      (row.effort as NonNullable<Recommendation["effort"]> | null) ?? null,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

async function workspaceIdsForUser(userId: string): Promise<string[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];
  const { data } = await sb
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId);
  return (data ?? []).map((m) => m.workspace_id as string);
}

export async function listGrowthTasksForWorkspace(
  workspaceId: string
): Promise<GrowthTaskRecord[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data, error } = await sb
    .from("growth_tasks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("suggested_order", { ascending: true })
    .limit(200);

  if (error || !data) {
    if (error) console.error("[growth_tasks] list workspace failed:", error.message);
    return [];
  }
  return data.map((row) => mapTask(row as Record<string, unknown>));
}

export async function listGrowthTasksForUser(
  userId: string,
  limit = 120
): Promise<GrowthTaskRecord[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const workspaceIds = await workspaceIdsForUser(userId);
  if (!workspaceIds.length) return [];

  const { data, error } = await sb
    .from("growth_tasks")
    .select("*")
    .in("workspace_id", workspaceIds)
    .order("suggested_order", { ascending: true })
    .limit(limit);

  if (error || !data) {
    if (error) console.error("[growth_tasks] list user failed:", error.message);
    return [];
  }
  return data.map((row) => mapTask(row as Record<string, unknown>));
}

async function upsertGrowthTaskRows(input: {
  workspaceId: string;
  storeId: string | null;
  upserts: GrowthTaskUpsert[];
}): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb || !input.upserts.length) return 0;

  const now = new Date().toISOString();
  const rows = input.upserts.map((u) => ({
    workspace_id: input.workspaceId,
    store_id: input.storeId,
    fingerprint: u.fingerprint,
    external_key: u.externalKey,
    title: u.title,
    category: u.category,
    priority: u.priority,
    difficulty: u.difficulty,
    estimated_time: u.estimatedTime,
    expected_business_impact: u.expectedBusinessImpact,
    horizon: u.horizon,
    suggested_order: u.suggestedOrder,
    status: u.status,
    completed_at: u.completedAt,
    completion_source: u.completionSource,
    source_audit_id: u.sourceAuditId,
    resolved_audit_id: u.resolvedAuditId,
    recommendation_problem: u.recommendationProblem,
    recommendation_solution: u.recommendationSolution,
    severity: u.severity,
    impact: u.impact,
    effort: u.effort,
    payload: {} as Json,
    updated_at: now,
  }));

  const { data, error } = await sb
    .from("growth_tasks")
    .upsert(rows, { onConflict: "workspace_id,fingerprint" })
    .select("id");

  if (error) {
    console.error("[growth_tasks] upsert failed:", error.message);
    return 0;
  }
  return data?.length ?? 0;
}

/** Sync durable tasks from latest audit recommendations. */
export async function applyGrowthTaskSync(input: {
  workspaceId: string;
  storeId: string | null;
  auditId: string;
  recommendations: Recommendation[];
}): Promise<{ upserted: number; autoResolved: number }> {
  const existing = await listGrowthTasksForWorkspace(input.workspaceId);
  const plan = planGrowthTaskSync({
    recommendations: input.recommendations,
    existing,
    auditId: input.auditId,
  });

  const upserted = await upsertGrowthTaskRows({
    workspaceId: input.workspaceId,
    storeId: input.storeId,
    upserts: plan.upserts,
  });

  // Notify for tasks auto-resolved by re-analysis.
  for (const fingerprint of plan.autoResolvedFingerprints.slice(0, 8)) {
    const task = plan.upserts.find(
      (u) => u.fingerprint === fingerprint && u.status === "auto_resolved"
    );
    if (!task) continue;
    await emitCompletedTaskNotification({
      workspaceId: input.workspaceId,
      storeId: input.storeId,
      taskId: fingerprint,
      title: task.title,
      completionSource: "reanalysis",
    });
  }

  return {
    upserted,
    autoResolved: plan.autoResolvedFingerprints.length,
  };
}

export async function setGrowthTaskCompletionForUser(input: {
  taskId: string;
  userId: string;
  completed: boolean;
}): Promise<GrowthTaskRecord | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data: row, error } = await sb
    .from("growth_tasks")
    .select("*")
    .eq("id", input.taskId)
    .maybeSingle();

  if (error || !row) {
    if (error) console.error("[growth_tasks] get failed:", error.message);
    return null;
  }

  const workspaceId = row.workspace_id as string;
  const { data: membership } = await sb
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (!membership) return null;

  const now = new Date().toISOString();
  const patch = input.completed
    ? {
        status: "done" as const,
        completed_at: now,
        completion_source: "user" as const,
        updated_at: now,
      }
    : {
        status: "open" as const,
        completed_at: null,
        completion_source: null,
        resolved_audit_id: null,
        updated_at: now,
      };

  const { data: updated, error: updateError } = await sb
    .from("growth_tasks")
    .update(patch)
    .eq("id", input.taskId)
    .select("*")
    .single();

  if (updateError || !updated) {
    console.error("[growth_tasks] status update failed:", updateError?.message);
    return null;
  }

  const mapped = mapTask(updated as Record<string, unknown>);
  if (input.completed) {
    await emitCompletedTaskNotification({
      workspaceId,
      storeId: mapped.storeId,
      taskId: mapped.id,
      title: mapped.title,
      completionSource: "user",
    });
  }
  return mapped;
}
