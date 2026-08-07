import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import type { Json } from "@/lib/db/database.types";
import type {
  NotificationCategory,
  NotificationDraft,
  NotificationPriority,
  NotificationRecord,
  NotificationSource,
} from "@/lib/notifications/types";
import { emptyCategoryCounts } from "@/lib/notifications/build";

function asPayload(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function mapNotification(row: Record<string, unknown>): NotificationRecord {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    storeId: (row.store_id as string) ?? null,
    category: row.category as NotificationCategory,
    priority: row.priority as NotificationPriority,
    title: row.title as string,
    body: row.body as string,
    actionLabel: (row.action_label as string) ?? null,
    actionHref: (row.action_href as string) ?? null,
    source: row.source as NotificationSource,
    sourceRefType: (row.source_ref_type as string) ?? null,
    sourceRefId: (row.source_ref_id as string) ?? null,
    payload: asPayload(row.payload),
    isRead: Boolean(row.is_read),
    readAt: (row.read_at as string) ?? null,
    isArchived: Boolean(row.is_archived),
    archivedAt: (row.archived_at as string) ?? null,
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

export async function insertNotificationDrafts(input: {
  workspaceId: string;
  storeId?: string | null;
  drafts: NotificationDraft[];
}): Promise<NotificationRecord[]> {
  const sb = getSupabaseAdmin();
  if (!sb || !input.drafts.length) return [];

  const now = new Date().toISOString();
  const rows = input.drafts.map((d) => ({
    workspace_id: input.workspaceId,
    store_id: input.storeId ?? null,
    category: d.category,
    priority: d.priority,
    title: d.title,
    body: d.body,
    action_label: d.actionLabel ?? null,
    action_href: d.actionHref ?? null,
    source: d.source,
    source_ref_type: d.sourceRefType ?? null,
    source_ref_id: d.sourceRefId ?? null,
    dedupe_key: d.dedupeKey,
    payload: (d.payload ?? {}) as unknown as Json,
    is_read: false,
    is_archived: false,
    created_at: now,
  }));

  const { data, error } = await sb
    .from("notifications")
    .upsert(rows, { onConflict: "workspace_id,dedupe_key", ignoreDuplicates: true })
    .select("*");

  if (error) {
    console.error("[notifications] insert failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapNotification(row as Record<string, unknown>));
}

export async function listNotificationsForUser(
  userId: string,
  options?: {
    category?: NotificationCategory | "all" | "archived";
    limit?: number;
  }
): Promise<{
  notifications: NotificationRecord[];
  unreadCount: number;
  archivedCount: number;
  categoryCounts: Record<NotificationCategory, number>;
}> {
  const sb = getSupabaseAdmin();
  const empty = {
    notifications: [] as NotificationRecord[],
    unreadCount: 0,
    archivedCount: 0,
    categoryCounts: emptyCategoryCounts(),
  };
  if (!sb) return empty;

  const workspaceIds = await workspaceIdsForUser(userId);
  if (!workspaceIds.length) return empty;

  const limit = options?.limit ?? 80;
  const filter = options?.category ?? "all";

  let query = sb
    .from("notifications")
    .select("*")
    .in("workspace_id", workspaceIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filter === "archived") {
    query = query.eq("is_archived", true);
  } else {
    query = query.eq("is_archived", false);
    if (filter !== "all") query = query.eq("category", filter);
  }

  const { data, error } = await query;
  if (error || !data) {
    if (error) console.error("[notifications] list failed:", error.message);
    return empty;
  }

  const notifications = data.map((row) => mapNotification(row as Record<string, unknown>));

  const { count: unreadCount } = await sb
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .in("workspace_id", workspaceIds)
    .eq("is_read", false)
    .eq("is_archived", false);

  const { count: archivedCount } = await sb
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .in("workspace_id", workspaceIds)
    .eq("is_archived", true);

  const { data: catRows } = await sb
    .from("notifications")
    .select("category")
    .in("workspace_id", workspaceIds)
    .eq("is_archived", false)
    .limit(500);

  const categoryCounts = emptyCategoryCounts();
  for (const row of catRows ?? []) {
    const cat = row.category as NotificationCategory;
    if (cat in categoryCounts) categoryCounts[cat] += 1;
  }

  return {
    notifications,
    unreadCount: unreadCount ?? 0,
    archivedCount: archivedCount ?? 0,
    categoryCounts,
  };
}

export async function countUnreadNotificationsForUser(userId: string): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;
  const workspaceIds = await workspaceIdsForUser(userId);
  if (!workspaceIds.length) return 0;

  const { count, error } = await sb
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .in("workspace_id", workspaceIds)
    .eq("is_read", false)
    .eq("is_archived", false);

  if (error) {
    console.error("[notifications] unread count failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

async function assertMembership(
  notificationId: string,
  userId: string
): Promise<Record<string, unknown> | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data: row, error } = await sb
    .from("notifications")
    .select("*")
    .eq("id", notificationId)
    .maybeSingle();
  if (error || !row) {
    if (error) console.error("[notifications] get failed:", error.message);
    return null;
  }

  const { data: membership } = await sb
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", row.workspace_id as string)
    .eq("user_id", userId)
    .maybeSingle();
  if (!membership) return null;
  return row as Record<string, unknown>;
}

export async function markNotificationReadForUser(
  notificationId: string,
  userId: string
): Promise<NotificationRecord | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const row = await assertMembership(notificationId, userId);
  if (!row) return null;
  if (row.is_read) return mapNotification(row);

  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("notifications")
    .update({ is_read: true, read_at: now })
    .eq("id", notificationId)
    .select("*")
    .single();
  if (error || !data) {
    console.error("[notifications] mark read failed:", error?.message);
    return null;
  }
  return mapNotification(data as Record<string, unknown>);
}

export async function archiveNotificationForUser(
  notificationId: string,
  userId: string
): Promise<NotificationRecord | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const row = await assertMembership(notificationId, userId);
  if (!row) return null;

  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("notifications")
    .update({
      is_archived: true,
      archived_at: now,
      is_read: true,
      read_at: (row.read_at as string) || now,
    })
    .eq("id", notificationId)
    .select("*")
    .single();
  if (error || !data) {
    console.error("[notifications] archive failed:", error?.message);
    return null;
  }
  return mapNotification(data as Record<string, unknown>);
}

export async function markAllNotificationsReadForUser(userId: string): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;
  const workspaceIds = await workspaceIdsForUser(userId);
  if (!workspaceIds.length) return 0;

  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("notifications")
    .update({ is_read: true, read_at: now })
    .in("workspace_id", workspaceIds)
    .eq("is_read", false)
    .eq("is_archived", false)
    .select("id");

  if (error) {
    console.error("[notifications] mark all read failed:", error.message);
    return 0;
  }
  return data?.length ?? 0;
}
