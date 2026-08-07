import "server-only";

import {
  insertAlertDrafts,
  loadPreviousAuditForAlerts,
} from "@/lib/db/alerts-repository";
import type { AuditData } from "@/lib/types";
import type { DetectedCompetitorChange } from "@/lib/competitor-monitor/types";
import { generateAuditAlerts, generateCompetitorAlerts } from "./generate";

/** Compare latest audit to previous and persist resulting alerts. */
export async function emitAlertsForCompletedAudit(input: {
  workspaceId: string;
  storeId: string | null;
  auditId: string;
  audit: AuditData;
}): Promise<number> {
  try {
    const previous = await loadPreviousAuditForAlerts({
      workspaceId: input.workspaceId,
      storeId: input.storeId,
      currentAuditId: input.auditId,
    });

    const drafts = generateAuditAlerts({
      latest: input.audit,
      previous,
      auditId: input.auditId,
    });

    if (!drafts.length) return 0;
    const inserted = await insertAlertDrafts({
      workspaceId: input.workspaceId,
      storeId: input.storeId,
      drafts,
    });
    return inserted.length;
  } catch (err) {
    console.error(
      "[alerts] emit audit failed:",
      err instanceof Error ? err.message : err
    );
    return 0;
  }
}

/** Persist alerts for competitor monitor diffs. */
export async function emitAlertsForCompetitorChanges(input: {
  workspaceId: string;
  storeId: string | null;
  targetId: string;
  snapshotId: string;
  targetLabel?: string | null;
  targetUrl?: string | null;
  changes: DetectedCompetitorChange[];
}): Promise<number> {
  try {
    const drafts = generateCompetitorAlerts({
      changes: input.changes,
      targetId: input.targetId,
      snapshotId: input.snapshotId,
      targetLabel: input.targetLabel,
      targetUrl: input.targetUrl,
    });
    if (!drafts.length) return 0;
    const inserted = await insertAlertDrafts({
      workspaceId: input.workspaceId,
      storeId: input.storeId,
      drafts,
    });
    return inserted.length;
  } catch (err) {
    console.error(
      "[alerts] emit competitor failed:",
      err instanceof Error ? err.message : err
    );
    return 0;
  }
}
