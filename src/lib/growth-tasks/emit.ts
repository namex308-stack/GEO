import "server-only";

import { applyGrowthTaskSync } from "@/lib/db/growth-tasks-repository";
import type { AuditData } from "@/lib/types";

/** Persist growth tasks from a completed audit — never blocks the audit pipeline. */
export async function syncGrowthTasksFromAudit(input: {
  workspaceId: string;
  storeId: string | null;
  auditId: string;
  audit: AuditData;
}): Promise<{ upserted: number; autoResolved: number }> {
  try {
    return await applyGrowthTaskSync({
      workspaceId: input.workspaceId,
      storeId: input.storeId,
      auditId: input.auditId,
      recommendations: input.audit.recommendations ?? [],
    });
  } catch (err) {
    console.error(
      "[growth-tasks] sync failed:",
      err instanceof Error ? err.message : err
    );
    return { upserted: 0, autoResolved: 0 };
  }
}
