import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import type { Json } from "@/lib/db/database.types";
import type { GeoFinding } from "@/lib/types";
import { buildGeoHistoryRow, type GeoHistoryInsertRow } from "@/lib/geo-tracking/record";
import type { GeoHistoryPoint } from "@/lib/geo-tracking/types";
import type { AuditData } from "@/lib/types";

function asFindings(value: unknown): GeoFinding[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (f): f is GeoFinding =>
      !!f &&
      typeof f === "object" &&
      typeof (f as GeoFinding).id === "string" &&
      typeof (f as GeoFinding).label === "string"
  );
}

function mapPoint(row: Record<string, unknown>): GeoHistoryPoint {
  return {
    id: row.id as string,
    auditId: row.audit_id as string,
    storeId: (row.store_id as string) ?? null,
    recordedAt: (row.recorded_at as string) ?? (row.created_at as string),
    overallGeoScore: Number(row.overall_geo_score),
    citationScore:
      row.citation_score != null ? Number(row.citation_score) : null,
    schemaScore: row.schema_score != null ? Number(row.schema_score) : null,
    entityScore: row.entity_score != null ? Number(row.entity_score) : null,
    faqScore: row.faq_score != null ? Number(row.faq_score) : null,
    aiReadability:
      row.ai_readability != null ? Number(row.ai_readability) : null,
    findings: asFindings(row.findings),
  };
}

export async function recordGeoScoreHistory(input: {
  workspaceId: string;
  storeId?: string | null;
  auditId: string;
  audit: AuditData;
}): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const row = buildGeoHistoryRow({
    workspaceId: input.workspaceId,
    storeId: input.storeId,
    auditId: input.auditId,
    geoAnalysis: input.audit.geoAnalysis,
    geoReadability: input.audit.geoReadability,
    overallGeoScore: input.audit.geoAnalysis?.score ?? null,
    recordedAt: input.audit.createdAt || new Date().toISOString(),
  });

  if (!row) return null;
  return insertGeoHistoryRow(row);
}

export async function insertGeoHistoryRow(
  row: GeoHistoryInsertRow
): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb
    .from("geo_score_history")
    .upsert(
      {
        workspace_id: row.workspaceId,
        store_id: row.storeId,
        audit_id: row.auditId,
        overall_geo_score: row.overallGeoScore,
        citation_score: row.citationScore,
        schema_score: row.schemaScore,
        entity_score: row.entityScore,
        faq_score: row.faqScore,
        ai_readability: row.aiReadability,
        findings: row.findings as unknown as Json,
        component_scores: row.componentScores as unknown as Json,
        recorded_at: row.recordedAt,
      },
      { onConflict: "audit_id" }
    )
    .select("id")
    .single();

  if (error || !data) {
    console.error("[geo_score_history] upsert failed:", error?.message);
    return null;
  }
  return data.id as string;
}

export async function listGeoHistoryForUser(
  userId: string,
  limit = 48
): Promise<GeoHistoryPoint[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data: memberships } = await sb
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId);
  const workspaceIds = (memberships ?? []).map((m) => m.workspace_id as string);
  if (!workspaceIds.length) return [];

  const { data, error } = await sb
    .from("geo_score_history")
    .select("*")
    .in("workspace_id", workspaceIds)
    .order("recorded_at", { ascending: true })
    .limit(limit);

  if (error || !data) {
    if (error) console.error("[geo_score_history] list failed:", error.message);
    return [];
  }

  return data.map((row) => mapPoint(row as Record<string, unknown>));
}

/**
 * Backfill history from existing geo_signals when the dedicated table is empty
 * (migration safety for workspaces that already have completed audits).
 */
export async function backfillGeoHistoryFromSignals(
  userId: string
): Promise<number> {
  const sb = getSupabaseAdmin();
  if (!sb) return 0;

  const { data: memberships } = await sb
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId);
  const workspaceIds = (memberships ?? []).map((m) => m.workspace_id as string);
  if (!workspaceIds.length) return 0;

  const { count } = await sb
    .from("geo_score_history")
    .select("id", { count: "exact", head: true })
    .in("workspace_id", workspaceIds);

  if ((count ?? 0) > 0) return 0;

  const { data: audits } = await sb
    .from("audits")
    .select("id, workspace_id, store_id, completed_at, created_at, geo_score")
    .in("workspace_id", workspaceIds)
    .eq("status", "completed")
    .order("completed_at", { ascending: true })
    .limit(48);

  if (!audits?.length) return 0;

  let written = 0;
  for (const audit of audits) {
    const auditId = audit.id as string;
    const { data: geo } = await sb
      .from("geo_signals")
      .select(
        "citation_score, schema_score, entity_score, faq_score, ai_readability_score"
      )
      .eq("audit_id", auditId)
      .maybeSingle();

    const overall =
      (audit.geo_score as number | null) ??
      (geo?.citation_score != null ? Number(geo.citation_score) : null);
    if (overall == null) continue;

    const { data: report } = await sb
      .from("reports")
      .select("summary")
      .eq("audit_id", auditId)
      .eq("version", 1)
      .maybeSingle();

    const summary = report?.summary as AuditData | null;
    const row = buildGeoHistoryRow({
      workspaceId: audit.workspace_id as string,
      storeId: (audit.store_id as string) ?? null,
      auditId,
      geoAnalysis: summary?.geoAnalysis,
      geoReadability: summary?.geoReadability,
      overallGeoScore: overall,
      recordedAt:
        (audit.completed_at as string) ||
        (audit.created_at as string) ||
        new Date().toISOString(),
    });

    if (!row) continue;

    // Prefer denormalized geo_signals columns when summary lacks components.
    if (geo) {
      row.citationScore =
        geo.citation_score != null ? Number(geo.citation_score) : row.citationScore;
      row.schemaScore =
        geo.schema_score != null ? Number(geo.schema_score) : row.schemaScore;
      row.entityScore =
        geo.entity_score != null ? Number(geo.entity_score) : row.entityScore;
      row.faqScore =
        geo.faq_score != null ? Number(geo.faq_score) : row.faqScore;
      row.aiReadability =
        geo.ai_readability_score != null
          ? Number(geo.ai_readability_score)
          : row.aiReadability;
    }

    const id = await insertGeoHistoryRow(row);
    if (id) written += 1;
  }

  return written;
}
