import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import type { AuditData } from "@/lib/types";
import type { Json } from "@/lib/db/database.types";
import type {
  WeeklyReportListItem,
  WeeklyReportPayload,
  WeeklyReportRecord,
} from "@/lib/weekly-report/types";

export type ActiveStoreCandidate = {
  storeId: string;
  workspaceId: string;
  storeName: string;
  storeUrl: string;
  lastReportAt: string | null;
};

export type StoreAuditPair = {
  latestAuditId: string;
  previousAuditId: string | null;
  latest: AuditData;
  previous: AuditData | null;
};

function asPayload(value: unknown): WeeklyReportPayload | null {
  if (!value || typeof value !== "object") return null;
  const p = value as WeeklyReportPayload;
  if (!p.storeId || !p.executiveSummary || !p.overallScoreChange) return null;
  return p;
}

function mapListItem(row: Record<string, unknown>): WeeklyReportListItem {
  const payload = asPayload(row.payload);
  return {
    id: row.id as string,
    storeId: row.store_id as string,
    storeName: payload?.storeName || "المتجر",
    storeUrl: payload?.storeUrl || "",
    periodStart: row.period_start as string,
    periodEnd: row.period_end as string,
    generatedAt: row.generated_at as string,
    status: row.status as WeeklyReportListItem["status"],
    overallScore: payload?.overallScoreChange.current ?? null,
    overallDelta: payload?.overallScoreChange.delta ?? null,
    meaningfulChangeCount: payload?.meaningfulChangeCount ?? 0,
  };
}

async function loadAuditData(auditId: string): Promise<AuditData | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data: report } = await sb
    .from("reports")
    .select("summary")
    .eq("audit_id", auditId)
    .eq("version", 1)
    .maybeSingle();

  if (report?.summary && typeof report.summary === "object") {
    return report.summary as AuditData;
  }
  return null;
}

/**
 * Active stores = stores with at least one completed audit.
 * Includes last weekly report timestamp for the 7-day cadence gate.
 */
export async function listActiveStoresForWeeklyReport(): Promise<
  ActiveStoreCandidate[]
> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data: audits, error } = await sb
    .from("audits")
    .select("store_id, workspace_id")
    .eq("status", "completed")
    .not("store_id", "is", null)
    .order("completed_at", { ascending: false })
    .limit(2000);

  if (error || !audits?.length) {
    if (error) console.error("[weekly_reports] list audits failed:", error.message);
    return [];
  }

  const byStore = new Map<string, string>();
  for (const row of audits) {
    const storeId = row.store_id as string | null;
    const workspaceId = row.workspace_id as string;
    if (!storeId || byStore.has(storeId)) continue;
    byStore.set(storeId, workspaceId);
  }

  const storeIds = [...byStore.keys()];
  if (!storeIds.length) return [];

  const [{ data: stores }, { data: recentReports }] = await Promise.all([
    sb
      .from("stores")
      .select("id, workspace_id, name, primary_url")
      .in("id", storeIds),
    sb
      .from("weekly_reports")
      .select("store_id, generated_at")
      .in("store_id", storeIds)
      .order("generated_at", { ascending: false }),
  ]);

  const lastByStore = new Map<string, string>();
  for (const row of recentReports ?? []) {
    const sid = row.store_id as string;
    if (!lastByStore.has(sid)) {
      lastByStore.set(sid, row.generated_at as string);
    }
  }

  return (stores ?? []).map((s) => ({
    storeId: s.id as string,
    workspaceId: (s.workspace_id as string) || byStore.get(s.id as string)!,
    storeName: (s.name as string) || "المتجر",
    storeUrl: (s.primary_url as string) || "",
    lastReportAt: lastByStore.get(s.id as string) ?? null,
  }));
}

export async function getLatestAuditPairForStore(
  storeId: string
): Promise<StoreAuditPair | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb
    .from("audits")
    .select("id")
    .eq("store_id", storeId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(2);

  if (error || !data?.length) {
    if (error) console.error("[weekly_reports] audit pair failed:", error.message);
    return null;
  }

  const latestAuditId = data[0].id as string;
  const previousAuditId = (data[1]?.id as string | undefined) ?? null;
  const latest = await loadAuditData(latestAuditId);
  if (!latest) return null;
  const previous = previousAuditId ? await loadAuditData(previousAuditId) : null;

  return {
    latestAuditId,
    previousAuditId,
    latest,
    previous,
  };
}

export async function upsertWeeklyReport(input: {
  workspaceId: string;
  storeId: string;
  periodStart: string;
  periodEnd: string;
  latestAuditId: string | null;
  previousAuditId: string | null;
  status: WeeklyReportListItem["status"];
  payload: WeeklyReportPayload;
  emailHtml: string | null;
  errorMessage?: string | null;
}): Promise<WeeklyReportRecord | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const row = {
    workspace_id: input.workspaceId,
    store_id: input.storeId,
    period_start: input.periodStart,
    period_end: input.periodEnd,
    latest_audit_id: input.latestAuditId,
    previous_audit_id: input.previousAuditId,
    status: input.status,
    payload: input.payload as unknown as Json,
    email_html: input.emailHtml,
    error_message: input.errorMessage ?? null,
    generated_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from("weekly_reports")
    .upsert(row, { onConflict: "store_id,period_start" })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[weekly_reports] upsert failed:", error?.message);
    return null;
  }

  return mapRecord(data as Record<string, unknown>);
}

function mapRecord(row: Record<string, unknown>): WeeklyReportRecord {
  const payload = asPayload(row.payload);
  if (!payload) {
    throw new Error("weekly_reports.payload missing required fields");
  }
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    storeId: row.store_id as string,
    periodStart: row.period_start as string,
    periodEnd: row.period_end as string,
    latestAuditId: (row.latest_audit_id as string) ?? null,
    previousAuditId: (row.previous_audit_id as string) ?? null,
    status: row.status as WeeklyReportRecord["status"],
    payload,
    emailHtml: (row.email_html as string) ?? null,
    emailSentAt: (row.email_sent_at as string) ?? null,
    generatedAt: row.generated_at as string,
    errorMessage: (row.error_message as string) ?? null,
  };
}

export async function markWeeklyReportEmailSent(
  reportId: string
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const { error } = await sb
    .from("weekly_reports")
    .update({ email_sent_at: new Date().toISOString() })
    .eq("id", reportId);
  if (error) console.error("[weekly_reports] email mark failed:", error.message);
}

export async function listWeeklyReportsForUser(
  userId: string,
  limit = 20
): Promise<WeeklyReportListItem[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data: memberships } = await sb
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId);

  const workspaceIds = (memberships ?? []).map((m) => m.workspace_id as string);
  if (!workspaceIds.length) return [];

  const { data, error } = await sb
    .from("weekly_reports")
    .select("id, store_id, period_start, period_end, generated_at, status, payload")
    .in("workspace_id", workspaceIds)
    .eq("status", "ready")
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error) console.error("[weekly_reports] list failed:", error.message);
    return [];
  }

  return data.map((row) => mapListItem(row as Record<string, unknown>));
}

export async function getWeeklyReportForUser(
  reportId: string,
  userId: string
): Promise<WeeklyReportRecord | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data: row, error } = await sb
    .from("weekly_reports")
    .select("*")
    .eq("id", reportId)
    .maybeSingle();

  if (error || !row) {
    if (error) console.error("[weekly_reports] get failed:", error.message);
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
  return mapRecord(row as Record<string, unknown>);
}

export async function getWorkspaceOwnerEmail(
  workspaceId: string
): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data: owner } = await sb
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId)
    .eq("role", "owner")
    .maybeSingle();

  const userId = (owner?.user_id as string | undefined) ?? null;
  if (!userId) return null;

  const { data, error } = await sb.auth.admin.getUserById(userId);
  if (error || !data.user?.email) {
    if (error) console.error("[weekly_reports] owner email failed:", error.message);
    return null;
  }
  return data.user.email;
}
