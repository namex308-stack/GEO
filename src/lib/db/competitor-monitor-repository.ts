import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import type { NormalizedPage, PageType } from "@/lib/db/types";
import type { Json } from "@/lib/db/database.types";
import type {
  CompetitorChangeRecord,
  CompetitorChangeType,
  CompetitorScoresPayload,
  CompetitorSignals,
  CompetitorSnapshotSummary,
  CompetitorTargetSummary,
  DetectedCompetitorChange,
} from "@/lib/competitor-monitor/types";

export type DueCompetitorTarget = CompetitorTargetSummary & {
  lastSnapshotSignals: CompetitorSignals | null;
  lastSnapshotId: string | null;
};

function mapTarget(row: Record<string, unknown>): CompetitorTargetSummary {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    storeId: (row.store_id as string) ?? null,
    label: (row.label as string) ?? null,
    url: row.url as string,
    isActive: Boolean(row.is_active),
    cadenceHours: Number(row.cadence_hours ?? 24),
    lastCheckedAt: (row.last_checked_at as string) ?? null,
    lastChangedAt: (row.last_changed_at as string) ?? null,
  };
}

function mapChange(row: Record<string, unknown>): CompetitorChangeRecord {
  return {
    id: row.id as string,
    targetId: row.target_id as string,
    changeType: row.change_type as CompetitorChangeType,
    severity: row.severity as CompetitorChangeRecord["severity"],
    summary: row.summary as string,
    businessImpact: (row.business_impact as string) ?? null,
    recommendedAction: (row.recommended_action as string) ?? null,
    previousValue: row.previous_value,
    currentValue: row.current_value,
    detectedAt: (row.detected_at as string) ?? (row.created_at as string),
  };
}

function mapSnapshot(row: Record<string, unknown>): CompetitorSnapshotSummary {
  return {
    id: row.id as string,
    targetId: row.target_id as string,
    scrapedAt: row.scraped_at as string,
    scrapeSource: row.scrape_source as CompetitorSnapshotSummary["scrapeSource"],
    scrapeStatus: row.scrape_status as CompetitorSnapshotSummary["scrapeStatus"],
    title: (row.title as string) ?? null,
    price: (row.price as string) ?? null,
    rating: (row.rating as string) ?? null,
    reviewCount: (row.review_count as string) ?? null,
    faqCount: Number(row.faq_count ?? 0),
    overallScore: (row.overall_score as number) ?? null,
    geoScore: (row.geo_score as number) ?? null,
    seoScore: (row.seo_score as number) ?? null,
    trustScore: (row.trust_score as number) ?? null,
  };
}

/** Upsert watch targets from recent audits that include a competitor URL. */
export async function syncCompetitorTargetsFromAudits(options?: {
  /** When set, only sync targets for workspaces that pass (plan entitlement). */
  isWorkspaceAllowed?: (workspaceId: string) => Promise<boolean>;
}): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;

  const { data: audits, error } = await sb
    .from("audits")
    .select("workspace_id, store_id, competitor_url, created_by")
    .not("competitor_url", "is", null)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(500);

  if (error || !audits?.length) {
    if (error) console.error("[competitor_targets] sync failed:", error.message);
    return 0;
  }

  let upserted = 0;
  const seen = new Set<string>();
  const allowedCache = new Map<string, boolean>();

  for (const row of audits) {
    const url = ((row.competitor_url as string) || "").trim();
    const workspaceId = row.workspace_id as string;
    if (!url || !workspaceId) continue;
    const key = `${workspaceId}::${url}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (options?.isWorkspaceAllowed) {
      let allowed = allowedCache.get(workspaceId);
      if (allowed === undefined) {
        allowed = await options.isWorkspaceAllowed(workspaceId);
        allowedCache.set(workspaceId, allowed);
      }
      if (!allowed) continue;
    }

    const { error: upsertError } = await sb.from("competitor_targets").upsert(
      {
        workspace_id: workspaceId,
        store_id: (row.store_id as string) ?? null,
        url,
        label: null,
        is_active: true,
        created_by: (row.created_by as string) ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,url" }
    );

    if (upsertError) {
      console.error("[competitor_targets] upsert failed:", upsertError.message);
      continue;
    }
    upserted += 1;
  }

  return upserted;
}

export async function listDueCompetitorTargets(
  now = new Date()
): Promise<DueCompetitorTarget[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data: targets, error } = await sb
    .from("competitor_targets")
    .select("*")
    .eq("is_active", true)
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(200);

  if (error || !targets?.length) {
    if (error) console.error("[competitor_targets] list failed:", error.message);
    return [];
  }

  const due: DueCompetitorTarget[] = [];

  for (const row of targets) {
    const target = mapTarget(row as Record<string, unknown>);
    const lastChecked = target.lastCheckedAt
      ? new Date(target.lastCheckedAt).getTime()
      : 0;
    const cadenceMs = Math.max(1, target.cadenceHours) * 60 * 60 * 1000;
    const isDue = !lastChecked || now.getTime() - lastChecked >= cadenceMs;
    if (!isDue) continue;

    const { data: snap } = await sb
      .from("competitor_snapshots")
      .select("id, signals")
      .eq("target_id", target.id)
      .eq("scrape_status", "ok")
      .order("scraped_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    due.push({
      ...target,
      lastSnapshotId: (snap?.id as string) ?? null,
      lastSnapshotSignals: (snap?.signals as CompetitorSignals) ?? null,
    });
  }

  return due;
}

/** Prefer reusing the latest stored competitor audit page for a URL (no live crawl). */
export async function loadCompetitorPageFromAudits(
  workspaceId: string,
  url: string
): Promise<NormalizedPage | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data: audits } = await sb
    .from("audits")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("competitor_url", url)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(5);

  const auditIds = (audits ?? []).map((a) => a.id as string);
  if (!auditIds.length) return null;

  const { data: page } = await sb
    .from("audit_pages")
    .select(
      "url, page_type, title, description, image_count, content_hash, structured_data, normalized_markdown, scrape_status, scrape_ms"
    )
    .in("audit_id", auditIds)
    .eq("role", "competitor")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!page) return null;

  return {
    url: (page.url as string) || url,
    title: (page.title as string) || "",
    description: (page.description as string) || "",
    pageType: ((page.page_type as PageType) || "unknown") as PageType,
    markdown: (page.normalized_markdown as string) || "",
    imageCount: Number(page.image_count ?? 0),
    contentHash: (page.content_hash as string) || "",
    structuredData: (page.structured_data as Record<string, unknown>) || {},
    scrapeStatus: page.scrape_status === "ok" ? "ok" : "failed",
    scrapeMs: (page.scrape_ms as number) ?? undefined,
  };
}

export async function insertCompetitorSnapshot(input: {
  targetId: string;
  workspaceId: string;
  scrapeSource: "firecrawl" | "fallback" | "audit_reuse" | "none";
  scrapeStatus: "ok" | "failed";
  signals: CompetitorSignals | null;
  scores: CompetitorScoresPayload | null;
  page: NormalizedPage | null;
  errorMessage?: string | null;
}): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const signals = input.signals;
  const scores = input.scores;

  const { data, error } = await sb
    .from("competitor_snapshots")
    .insert({
      target_id: input.targetId,
      workspace_id: input.workspaceId,
      scrape_source: input.scrapeSource,
      scrape_status: input.scrapeStatus,
      content_hash: signals?.contentHash ?? input.page?.contentHash ?? null,
      title: signals?.title ?? input.page?.title ?? null,
      description: signals?.description ?? input.page?.description ?? null,
      price: signals?.priceRaw ?? null,
      rating: signals?.rating ?? null,
      review_count:
        signals?.reviewCount != null ? String(signals.reviewCount) : null,
      faq_count: signals?.faq.length ?? 0,
      schema_types: signals?.schemaTypes ?? [],
      overall_score: scores?.overall ?? null,
      conversion_score: scores?.conversion ?? null,
      seo_score: scores?.seo ?? null,
      geo_score: scores?.geo ?? null,
      trust_score: scores?.trust ?? null,
      signals: (signals ?? {}) as unknown as Json,
      page_payload: (input.page
        ? {
            url: input.page.url,
            title: input.page.title,
            description: input.page.description,
            pageType: input.page.pageType,
            contentHash: input.page.contentHash,
            structuredData: input.page.structuredData,
            imageCount: input.page.imageCount,
            scrapeStatus: input.page.scrapeStatus,
          }
        : {}) as unknown as Json,
      scores_payload: (scores ?? {}) as unknown as Json,
      error_message: input.errorMessage ?? null,
      scraped_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[competitor_snapshots] insert failed:", error?.message);
    return null;
  }
  return data.id as string;
}

export async function insertCompetitorChanges(input: {
  targetId: string;
  workspaceId: string;
  previousSnapshotId: string | null;
  currentSnapshotId: string;
  changes: DetectedCompetitorChange[];
}): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb || !input.changes.length) return 0;

  const rows = input.changes.map((c) => ({
    target_id: input.targetId,
    workspace_id: input.workspaceId,
    previous_snapshot_id: input.previousSnapshotId,
    current_snapshot_id: input.currentSnapshotId,
    change_type: c.changeType,
    severity: c.severity,
    field_path: c.fieldPath,
    previous_value: c.previousValue as Json,
    current_value: c.currentValue as Json,
    summary: c.summary,
    business_impact: c.businessImpact,
    recommended_action: c.recommendedAction,
    payload: {} as Json,
    detected_at: new Date().toISOString(),
  }));

  const { error, data } = await sb
    .from("competitor_changes")
    .insert(rows)
    .select("id");

  if (error) {
    console.error("[competitor_changes] insert failed:", error.message);
    return 0;
  }
  return data?.length ?? 0;
}

export async function touchCompetitorTarget(input: {
  targetId: string;
  changed: boolean;
}): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    last_checked_at: now,
    updated_at: now,
  };
  if (input.changed) patch.last_changed_at = now;

  const { error } = await sb
    .from("competitor_targets")
    .update(patch)
    .eq("id", input.targetId);
  if (error) console.error("[competitor_targets] touch failed:", error.message);
}

export async function listCompetitorTargetsForUser(
  userId: string
): Promise<CompetitorTargetSummary[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data: memberships } = await sb
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId);
  const workspaceIds = (memberships ?? []).map((m) => m.workspace_id as string);
  if (!workspaceIds.length) return [];

  const { data, error } = await sb
    .from("competitor_targets")
    .select("*")
    .in("workspace_id", workspaceIds)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    if (error) console.error("[competitor_targets] list user failed:", error.message);
    return [];
  }
  return data.map((row) => mapTarget(row as Record<string, unknown>));
}

export async function listCompetitorChangesForUser(
  userId: string,
  limit = 40
): Promise<CompetitorChangeRecord[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data: memberships } = await sb
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId);
  const workspaceIds = (memberships ?? []).map((m) => m.workspace_id as string);
  if (!workspaceIds.length) return [];

  const { data, error } = await sb
    .from("competitor_changes")
    .select("*")
    .in("workspace_id", workspaceIds)
    .order("detected_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error) console.error("[competitor_changes] list user failed:", error.message);
    return [];
  }
  return data.map((row) => mapChange(row as Record<string, unknown>));
}

export async function getCompetitorTargetForUser(
  targetId: string,
  userId: string
): Promise<CompetitorTargetSummary | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data: row, error } = await sb
    .from("competitor_targets")
    .select("*")
    .eq("id", targetId)
    .maybeSingle();
  if (error || !row) {
    if (error) console.error("[competitor_targets] get failed:", error.message);
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
  return mapTarget(row as Record<string, unknown>);
}

export async function listSnapshotsForTarget(
  targetId: string,
  limit = 30
): Promise<CompetitorSnapshotSummary[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data, error } = await sb
    .from("competitor_snapshots")
    .select(
      "id, target_id, scraped_at, scrape_source, scrape_status, title, price, rating, review_count, faq_count, overall_score, geo_score, seo_score, trust_score"
    )
    .eq("target_id", targetId)
    .order("scraped_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error) console.error("[competitor_snapshots] list failed:", error.message);
    return [];
  }
  return data.map((row) => mapSnapshot(row as Record<string, unknown>));
}

export async function listChangesForTarget(
  targetId: string,
  limit = 50
): Promise<CompetitorChangeRecord[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data, error } = await sb
    .from("competitor_changes")
    .select("*")
    .eq("target_id", targetId)
    .order("detected_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error) console.error("[competitor_changes] target list failed:", error.message);
    return [];
  }
  return data.map((row) => mapChange(row as Record<string, unknown>));
}
