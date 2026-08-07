import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import type { Json } from "@/lib/db/database.types";
import type { AuditData } from "@/lib/types";
import type { AlertDraft, AlertRecord, AlertType, AlertPriority, AlertSource } from "@/lib/alerts/types";
import { dispatchAlertNotifications } from "@/lib/alerts/notify";
import { emitNotificationsFromAlertDrafts } from "@/lib/notifications/emit";

function asPayload(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function mapAlert(row: Record<string, unknown>): AlertRecord {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    storeId: (row.store_id as string) ?? null,
    alertType: row.alert_type as AlertType,
    priority: row.priority as AlertPriority,
    title: row.title as string,
    reason: row.reason as string,
    businessImpact: row.business_impact as string,
    suggestedAction: row.suggested_action as string,
    source: row.source as AlertSource,
    sourceRefType: (row.source_ref_type as string) ?? null,
    sourceRefId: (row.source_ref_id as string) ?? null,
    payload: asPayload(row.payload),
    isRead: Boolean(row.is_read),
    readAt: (row.read_at as string) ?? null,
    notifyInApp: row.notify_in_app !== false,
    notifyEmail: Boolean(row.notify_email),
    inAppDeliveredAt: (row.in_app_delivered_at as string) ?? null,
    emailDeliveredAt: (row.email_delivered_at as string) ?? null,
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
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

/** Load previous completed audit payload for the same store (or workspace). */
export async function loadPreviousAuditForAlerts(input: {
  workspaceId: string;
  storeId: string | null;
  currentAuditId: string;
}): Promise<AuditData | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  let query = sb
    .from("audits")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .eq("status", "completed")
    .neq("id", input.currentAuditId)
    .order("completed_at", { ascending: false })
    .limit(1);

  if (input.storeId) {
    query = query.eq("store_id", input.storeId);
  }

  const { data, error } = await query;
  if (error || !data?.[0]?.id) {
    if (error) console.error("[alerts] previous audit lookup failed:", error.message);
    return null;
  }

  const previousId = data[0].id as string;
  const { data: report } = await sb
    .from("reports")
    .select("summary")
    .eq("audit_id", previousId)
    .eq("version", 1)
    .maybeSingle();

  if (report?.summary && typeof report.summary === "object") {
    return report.summary as AuditData;
  }
  return null;
}

/**
 * Upsert alert drafts. Sets in-app delivery timestamp; leaves email undelivered.
 * Returns persisted rows (including pre-existing on conflict).
 */
export async function insertAlertDrafts(input: {
  workspaceId: string;
  storeId?: string | null;
  drafts: AlertDraft[];
}): Promise<AlertRecord[]> {
  const sb = getSupabaseAdmin();
  if (!sb || !input.drafts.length) return [];

  const now = new Date().toISOString();
  const rows = input.drafts.map((d) => ({
    workspace_id: input.workspaceId,
    store_id: input.storeId ?? null,
    alert_type: d.alertType,
    priority: d.priority,
    title: d.title,
    reason: d.reason,
    business_impact: d.businessImpact,
    suggested_action: d.suggestedAction,
    source: d.source,
    source_ref_type: d.sourceRefType,
    source_ref_id: d.sourceRefId,
    dedupe_key: d.dedupeKey,
    payload: d.payload as unknown as Json,
    is_read: false,
    notify_in_app: true,
    notify_email: false,
    in_app_delivered_at: now,
    email_delivered_at: null,
    created_at: now,
  }));

  const { data, error } = await sb
    .from("alerts")
    .upsert(rows, { onConflict: "workspace_id,dedupe_key", ignoreDuplicates: true })
    .select("*");

  if (error) {
    console.error("[alerts] insert failed:", error.message);
    return [];
  }

  const inserted = (data ?? []).map((row) => mapAlert(row as Record<string, unknown>));
  // Future email/in-app fan-out — email intentionally not sent.
  await dispatchAlertNotifications(inserted);
  // Mirror into Notification Center (unified inbox) using draft dedupe keys.
  await emitNotificationsFromAlertDrafts({
    workspaceId: input.workspaceId,
    storeId: input.storeId,
    drafts: input.drafts,
  });
  return inserted;
}

export async function listAlertsForUser(
  userId: string,
  limit = 50
): Promise<AlertRecord[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const workspaceIds = await workspaceIdsForUser(userId);
  if (!workspaceIds.length) return [];

  const { data, error } = await sb
    .from("alerts")
    .select("*")
    .in("workspace_id", workspaceIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error) console.error("[alerts] list failed:", error.message);
    return [];
  }
  return data.map((row) => mapAlert(row as Record<string, unknown>));
}

export async function countUnreadAlertsForUser(userId: string): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;

  const workspaceIds = await workspaceIdsForUser(userId);
  if (!workspaceIds.length) return 0;

  const { count, error } = await sb
    .from("alerts")
    .select("id", { count: "exact", head: true })
    .in("workspace_id", workspaceIds)
    .eq("is_read", false);

  if (error) {
    console.error("[alerts] unread count failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function markAlertReadForUser(
  alertId: string,
  userId: string
): Promise<AlertRecord | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data: row, error } = await sb
    .from("alerts")
    .select("*")
    .eq("id", alertId)
    .maybeSingle();

  if (error || !row) {
    if (error) console.error("[alerts] get for read failed:", error.message);
    return null;
  }

  const workspaceId = row.workspace_id as string;
  const { data: membership } = await sb
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!membership) return null;

  if (row.is_read) return mapAlert(row as Record<string, unknown>);

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await sb
    .from("alerts")
    .update({ is_read: true, read_at: now })
    .eq("id", alertId)
    .select("*")
    .single();

  if (updateError || !updated) {
    console.error("[alerts] mark read failed:", updateError?.message);
    return null;
  }
  return mapAlert(updated as Record<string, unknown>);
}

export async function markAllAlertsReadForUser(userId: string): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;

  const workspaceIds = await workspaceIdsForUser(userId);
  if (!workspaceIds.length) return 0;

  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("alerts")
    .update({ is_read: true, read_at: now })
    .in("workspace_id", workspaceIds)
    .eq("is_read", false)
    .select("id");

  if (error) {
    console.error("[alerts] mark all read failed:", error.message);
    return 0;
  }
  return data?.length ?? 0;
}
