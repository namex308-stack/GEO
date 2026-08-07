import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import type { AnalyzerName, AnalyzerJsonResult, NormalizedPage, UsageMetric } from "@/lib/db/types";
import type { AuditData } from "@/lib/types";
import {
  AUDIT_ANALYSIS_VERSION,
  geoSignalsFromAnalysis,
  pillarScore,
} from "@/lib/db/denormalized-scores";
import { prioritizeRecommendations } from "@/lib/ai/recommendations";
import {
  FALLBACK_PRODUCT_NAME,
  FALLBACK_STORE_NAME,
  type AuditHistoryItem,
} from "@/lib/audits/types";
import { mapRecommendationRow, toJsonValue } from "@/lib/audits/parse";
import { displayHostFromUrl } from "@/lib/url-display";
import { decodeHtmlEntities } from "@/lib/text/decode-html";
import type { Json } from "@/lib/db/database.types";
import { recordGeoScoreHistory } from "@/lib/db/geo-history-repository";
import { emitAlertsForCompletedAudit } from "@/lib/alerts/emit";
import { syncGrowthTasksFromAudit } from "@/lib/growth-tasks/emit";

export type { AuditHistoryItem } from "@/lib/audits/types";

/** Upsert the workspace primary store from onboarding / audit context; return store id. */
export async function ensureWorkspaceStore(input: {
  workspaceId: string;
  storeUrl: string;
  name?: string;
  platform?: string | null;
  country?: string | null;
  language?: string | null;
  currency?: string | null;
  detectedTheme?: string | null;
  verifiedAt?: string | null;
  markCrawled?: boolean;
}): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const primaryUrl = input.storeUrl.trim();
  if (!primaryUrl) return null;

  const now = new Date().toISOString();
  const name =
    (input.name && input.name.trim()) ||
    displayHostFromUrl(primaryUrl) ||
    FALLBACK_STORE_NAME;

  const { data: existing } = await sb
    .from("stores")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .eq("primary_url", primaryUrl)
    .maybeSingle();

  if (existing?.id) {
    const patch: Record<string, unknown> = {
      updated_at: now,
      name,
    };
    if (input.platform) patch.platform = input.platform;
    if (input.country) patch.country = input.country;
    if (input.language) patch.language = input.language;
    if (input.currency) patch.currency = input.currency;
    if (input.detectedTheme) patch.detected_theme = input.detectedTheme;
    if (input.verifiedAt) patch.verified_at = input.verifiedAt;
    if (input.markCrawled) patch.last_crawled_at = now;

    await sb.from("stores").update(patch).eq("id", existing.id);
    return existing.id as string;
  }

  // Prefer a single primary store per workspace when creating the first one.
  const { count } = await sb
    .from("stores")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", input.workspaceId);

  const { data, error } = await sb
    .from("stores")
    .insert({
      workspace_id: input.workspaceId,
      name,
      primary_url: primaryUrl,
      platform: input.platform ?? null,
      country: input.country ?? null,
      language: input.language ?? null,
      currency: input.currency ?? null,
      detected_theme: input.detectedTheme ?? null,
      is_primary: !count || count === 0,
      verified_at: input.verifiedAt ?? null,
      last_crawled_at: input.markCrawled ? now : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[stores] upsert failed:", error?.message);
    return null;
  }
  return data.id as string;
}

/** Ensure the user has a personal workspace; return its id. */
export async function ensurePersonalWorkspace(userId: string): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data: membership } = await sb
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .eq("role", "owner")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membership?.workspace_id) return membership.workspace_id as string;

  const { data: ws, error: wsError } = await sb
    .from("workspaces")
    .insert({ name: "Personal", plan_id: "free" })
    .select("id")
    .single();

  if (wsError || !ws) {
    console.error("[workspace] create failed:", wsError?.message);
    return null;
  }

  const { error: memError } = await sb.from("workspace_members").insert({
    workspace_id: ws.id,
    user_id: userId,
    role: "owner",
  });

  if (memError) {
    console.error("[workspace] membership failed:", memError.message);
    return null;
  }

  return ws.id as string;
}

export async function createAuditRecord(input: {
  workspaceId: string;
  userId: string;
  productUrl: string;
  storeUrl?: string;
  competitorUrl?: string;
  storeId?: string | null;
}): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb
    .from("audits")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      store_id: input.storeId ?? null,
      status: "queued",
      product_url: input.productUrl,
      store_url: input.storeUrl || null,
      competitor_url: input.competitorUrl || null,
      analysis_version: AUDIT_ANALYSIS_VERSION,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[audits] create failed:", error?.message);
    return null;
  }
  return data.id as string;
}

export async function updateAuditStatus(
  auditId: string,
  status: "queued" | "scraping" | "analyzing" | "completed" | "failed"
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  const { error } = await sb.from("audits").update({ status }).eq("id", auditId);
  if (error) console.error("[audits] status update failed:", error.message);
}

export async function saveAuditPage(
  auditId: string,
  role: "primary" | "competitor",
  page: NormalizedPage
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const { error } = await sb.from("audit_pages").upsert(
    {
      audit_id: auditId,
      role,
      url: page.url,
      page_type: page.pageType,
      title: page.title,
      description: page.description,
      image_count: page.imageCount,
      scrape_status: page.scrapeStatus,
      scrape_ms: page.scrapeMs ?? null,
      content_hash: page.contentHash,
      structured_data: page.structuredData,
      normalized_markdown: page.markdown.slice(0, 24_000),
    },
    { onConflict: "audit_id,role" }
  );

  if (error) console.error("[audit_pages] upsert failed:", error.message);
}

export async function startAnalysisRun(
  auditId: string,
  analyzer: AnalyzerName
): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb
    .from("analysis_runs")
    .insert({
      audit_id: auditId,
      analyzer,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[analysis_runs] start failed:", error?.message);
    return null;
  }
  return data.id as string;
}

export async function finishAnalysisRun(
  runId: string,
  result: AnalyzerJsonResult,
  errorMessage?: string
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const finishedAt = new Date().toISOString();
  const { data: existing } = await sb
    .from("analysis_runs")
    .select("started_at")
    .eq("id", runId)
    .maybeSingle();

  const started = existing?.started_at ? new Date(existing.started_at as string).getTime() : Date.now();
  const durationMs = Math.max(0, Date.now() - started);

  const { error } = await sb
    .from("analysis_runs")
    .update({
      status: errorMessage ? "failed" : "completed",
      finished_at: finishedAt,
      duration_ms: durationMs,
      tokens_used: result.tokensUsed ?? null,
      estimated_cost: result.estimatedCost ?? null,
      error_message: errorMessage ?? null,
    })
    .eq("id", runId);

  if (error) console.error("[analysis_runs] finish failed:", error.message);
}

export async function persistAuditResults(auditId: string, workspaceId: string, audit: AuditData): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const { data: categories } = await sb
    .from("analysis_categories")
    .select("id, slug, display_name, description");
  const bySlug = new Map((categories ?? []).map((c) => [c.slug as string, c.id as string]));
  const displayBySlug = new Map(
    (categories ?? []).map((c) => [c.slug as string, c.display_name as string])
  );
  const descBySlug = new Map(
    (categories ?? []).map((c) => [
      c.slug as string,
      (c.description as string | null) ?? null,
    ])
  );

  const geoScore =
    audit.geoAnalysis?.score ??
    pillarScore(audit.breakdown, "geo") ??
    null;
  const conversionScore = pillarScore(audit.breakdown, "conversion");
  const seoScore = pillarScore(audit.breakdown, "seo");
  const trustScore = pillarScore(audit.breakdown, "trust");
  const geoDenorm = geoSignalsFromAnalysis(audit.geoAnalysis, audit.geoReadability);

  await sb
    .from("audits")
    .update({
      status: "completed",
      product_name: audit.productName,
      store_name: audit.storeName,
      overall_score: audit.overallScore,
      competitor_score: audit.competitorScore ?? null,
      geo_score: geoScore,
      crawl_provider: audit.crawlMetadata?.source ?? null,
      crawl_duration_ms: audit.crawlMetadata?.scrapeMs ?? null,
      analysis_version: AUDIT_ANALYSIS_VERSION,
      completed_at: new Date().toISOString(),
      model: process.env.GEMINI_API_KEY
        ? process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash"
        : "demo",
    })
    .eq("id", auditId);

  for (const b of audit.breakdown) {
    const categoryId = bySlug.get(b.pillar);
    if (!categoryId) continue;
    await sb.from("audit_scores").upsert(
      {
        audit_id: auditId,
        category_id: categoryId,
        subject: "self",
        score: b.score,
        max_score: b.max,
        label: b.label || displayBySlug.get(b.pillar) || b.pillar,
        summary: b.summary || descBySlug.get(b.pillar) || null,
      },
      { onConflict: "audit_id,category_id,subject" }
    );
  }

  if (audit.competitorBreakdown) {
    for (const b of audit.competitorBreakdown) {
      const categoryId = bySlug.get(b.pillar);
      if (!categoryId) continue;
      await sb.from("audit_scores").upsert(
        {
          audit_id: auditId,
          category_id: categoryId,
          subject: "competitor",
          score: b.score,
          max_score: b.max,
          label: b.label || displayBySlug.get(b.pillar) || b.pillar,
          summary: b.summary || descBySlug.get(b.pillar) || null,
        },
        { onConflict: "audit_id,category_id,subject" }
      );
    }
  }

  await sb.from("geo_signals").upsert({
    audit_id: auditId,
    chatgpt: audit.geoReadability.chatgpt,
    perplexity: audit.geoReadability.perplexity,
    google_ai: audit.geoReadability.googleAI,
    citation_score: geoDenorm?.citationScore ?? geoScore,
    faq_score: geoDenorm?.faqScore ?? null,
    schema_score: geoDenorm?.schemaScore ?? null,
    entity_score: geoDenorm?.entityScore ?? null,
    ai_readability_score: geoDenorm?.aiReadabilityScore ?? null,
    freshness_score: geoDenorm?.freshnessScore ?? null,
  });

  await sb.from("recommendations").delete().eq("audit_id", auditId);

  if (audit.recommendations.length) {
    await sb.from("recommendations").insert(
      audit.recommendations.map((r, i) => ({
        audit_id: auditId,
        category_id: bySlug.get(r.pillar) ?? null,
        external_key: r.id,
        pillar: r.pillar,
        severity: r.severity,
        impact: r.impact,
        effort: r.effort ?? null,
        problem: r.problem,
        solution: r.solution,
        confidence: r.confidence ?? null,
        affected_page: r.affectedPage ?? null,
        projected_impact: r.projectedImpact ?? null,
        before_preview: r.beforePreview ?? null,
        after_preview: r.afterPreview ?? null,
        estimated_lift: r.estimatedLift ?? null,
        source: r.source ?? "gemini",
        fix_type: r.fixType ?? "manual",
        sort_order: i,
      }))
    );
  }

  await sb.from("reports").upsert(
    {
      audit_id: auditId,
      workspace_id: workspaceId,
      version: 1,
      summary: toJsonValue(audit),
      overall_score: audit.overallScore,
      geo_score: geoScore,
      seo_score: seoScore,
      conversion_score: conversionScore,
      trust_score: trustScore,
      rendered_at: new Date().toISOString(),
    },
    { onConflict: "audit_id,version" }
  );

  // Historical GEO tracking only — does not re-run or modify the GEO engine.
  const { data: auditMeta } = await sb
    .from("audits")
    .select("store_id, completed_at")
    .eq("id", auditId)
    .maybeSingle();

  const storeId = (auditMeta?.store_id as string | null) ?? null;

  await recordGeoScoreHistory({
    workspaceId,
    storeId,
    auditId,
    audit: {
      ...audit,
      createdAt:
        (auditMeta?.completed_at as string) ||
        audit.createdAt ||
        new Date().toISOString(),
    },
  });

  const completedAudit: AuditData = {
    ...audit,
    id: auditId,
    createdAt:
      (auditMeta?.completed_at as string) ||
      audit.createdAt ||
      new Date().toISOString(),
  };

  // AI Alerts — compare with previous completed audit; never blocks persistence.
  await emitAlertsForCompletedAudit({
    workspaceId,
    storeId,
    auditId,
    audit: completedAudit,
  });

  // Growth Tasks — transform recommendations into durable actionable tasks.
  await syncGrowthTasksFromAudit({
    workspaceId,
    storeId,
    auditId,
    audit: completedAudit,
  });
}

export async function recordUsageEvent(
  workspaceId: string,
  metric: UsageMetric,
  ref?: { type: string; id: string }
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const { error } = await sb.from("usage_events").insert({
    workspace_id: workspaceId,
    metric,
    quantity: 1,
    ref_type: ref?.type ?? null,
    ref_id: ref?.id ?? null,
  });

  if (error) console.error("[usage_events] insert failed:", error.message);
}

export type UsageQuotaResult = {
  allowed: boolean;
  /** Usage count for the metric/period *after* this call (including this unit, when allowed). */
  used: number;
  /** id of the usage_events row created when `allowed` is true; null otherwise. */
  usageEventId: string | null;
};

/**
 * Atomically checks the workspace's usage against `limit` for `metric` within
 * [periodStart, periodEnd] and — if under the limit — records one usage unit
 * in the same database transaction (see try_consume_usage_quota SQL
 * function). Concurrent requests for the same workspace+metric are
 * serialized by an advisory lock inside that function, so two in-flight
 * requests can never both pass the check when only one slot remains.
 *
 * `limit === null` means unlimited (e.g. Business plan) — always allowed.
 * Fails closed (denies) on unexpected database errors so a broken quota
 * check can never silently bypass a billing limit.
 */
export async function tryConsumeUsageQuota(input: {
  workspaceId: string;
  metric: UsageMetric;
  limit: number | null;
  periodStart: string;
  periodEnd: string;
  ref?: { type: string; id: string };
}): Promise<UsageQuotaResult> {
  const sb = getSupabaseAdmin();
  // Fail closed: never silently bypass billing limits when admin is unavailable.
  if (!sb) {
    console.error("[usage_events] quota check denied: Supabase admin unavailable");
    return { allowed: false, used: 0, usageEventId: null };
  }

  const { data, error } = await sb
    .rpc("try_consume_usage_quota", {
      p_workspace_id: input.workspaceId,
      p_metric: input.metric,
      p_limit: input.limit,
      p_period_start: input.periodStart,
      p_period_end: input.periodEnd,
      p_ref_type: input.ref?.type ?? null,
      p_ref_id: input.ref?.id ?? null,
    })
    .single();

  if (error || !data) {
    console.error("[usage_events] quota check failed:", error?.message);
    return { allowed: false, used: 0, usageEventId: null };
  }

  const row = data as { allowed: boolean; used_count: number; usage_event_id: string | null };
  return { allowed: row.allowed, used: row.used_count, usageEventId: row.usage_event_id };
}

/** Roll back a reservation made by `tryConsumeUsageQuota` when the audit it was held for ultimately fails. */
export async function releaseUsageQuota(usageEventId: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const { error } = await sb.from("usage_events").delete().eq("id", usageEventId);
  if (error) console.error("[usage_events] release failed:", error.message);
}

export async function markAuditFailed(auditId: string, message: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb
    .from("audits")
    .update({
      status: "failed",
      error_message: message,
      completed_at: new Date().toISOString(),
    })
    .eq("id", auditId);
}

/** List audits the user owns or can access via workspace membership. */
export async function listAuditsForUser(
  userId: string,
  limit = 50,
  query?: string
): Promise<AuditHistoryItem[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const { data: memberships } = await sb
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId);

  const workspaceIds = (memberships ?? []).map((m) => m.workspace_id as string);
  if (!workspaceIds.length) return [];

  let req = sb
    .from("audits")
    .select("id, product_name, store_name, product_url, overall_score, status, created_at, completed_at, created_by")
    .in("workspace_id", workspaceIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  const q = query?.trim();
  if (q) {
    // Strip PostgREST filter-syntax metacharacters (`,` separates or()
    // conditions, `()` groups them, `%`/`_` are ilike wildcards, `\` is the
    // LIKE escape char) so user input can never alter the filter structure.
    const safe = q.replace(/[%_,()\\]/g, " ").slice(0, 80);
    req = req.or(
      `product_name.ilike.%${safe}%,store_name.ilike.%${safe}%,product_url.ilike.%${safe}%`
    );
  }

  const { data, error } = await req;

  if (error || !data) {
    if (error) console.error("[audits] list failed:", error.message);
    return [];
  }

  return data.map((row) => {
    const productUrl = row.product_url as string;
    const host = displayHostFromUrl(productUrl);
    const rawProduct = ((row.product_name as string) || "").trim();
    const rawStore = ((row.store_name as string) || "").trim();
    return {
      id: row.id as string,
      productName: decodeHtmlEntities(
        rawProduct || host || FALLBACK_PRODUCT_NAME
      ),
      storeName: decodeHtmlEntities(rawStore || host || FALLBACK_STORE_NAME),
      productUrl,
      overallScore: (row.overall_score as number) ?? null,
      status: row.status as string,
      createdAt: row.created_at as string,
      completedAt: (row.completed_at as string) ?? null,
    };
  });
}

/** Persist AI generate payload and merge into reports.summary.generatedContent. */
export async function saveGeneratedContentForAudit(input: {
  workspaceId: string;
  userId: string;
  auditId: string | null;
  productUrl: string;
  content: Json;
  model: string;
  generationType?: string;
  status?: "completed" | "failed" | "running";
  tokensUsed?: number | null;
  durationMs?: number | null;
}): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data: gen, error } = await sb
    .from("ai_generations")
    .insert({
      workspace_id: input.workspaceId,
      audit_id: input.auditId,
      created_by: input.userId,
      product_url: input.productUrl,
      payload: input.content,
      model: input.model,
      generation_type: input.generationType ?? "product_content",
      status: input.status ?? "completed",
      tokens_used: input.tokensUsed ?? null,
      duration_ms: input.durationMs ?? null,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[ai_generations] insert failed:", error.message);
  }

  if (input.auditId) {
    const { data: report } = await sb
      .from("reports")
      .select("summary")
      .eq("audit_id", input.auditId)
      .eq("version", 1)
      .maybeSingle();

    const summary =
      report?.summary && typeof report.summary === "object"
        ? { ...(report.summary as Record<string, unknown>) }
        : {};
    summary.generatedContent = input.content;

    await sb.from("reports").upsert(
      {
        audit_id: input.auditId,
        workspace_id: input.workspaceId,
        version: 1,
        summary,
        rendered_at: new Date().toISOString(),
      },
      { onConflict: "audit_id,version" }
    );
  }

  return (gen?.id as string) ?? null;
}

export type StoredAuditReport = {
  audit: AuditData;
  demoMode: boolean;
  aiConfigured: boolean;
  analysisRuns: {
    id: string;
    analyzer: string;
    status: string;
    durationMs: number | null;
    tokensUsed: number | null;
    estimatedCost: number | null;
    errorMessage: string | null;
  }[];
};

export type AuditAccessMeta = {
  id: string;
  workspaceId: string;
  productUrl: string;
  storeUrl: string | null;
  competitorUrl: string | null;
  status: string;
};

/**
 * Membership/ownership check that works for any audit status (including failed).
 * Used by delete/retry — unlike getAuditByIdForUser, does not require a completed report.
 */
export async function getAuditAccessForUser(
  auditId: string,
  userId: string
): Promise<AuditAccessMeta | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data: row, error } = await sb
    .from("audits")
    .select("id, workspace_id, product_url, store_url, competitor_url, status, created_by")
    .eq("id", auditId)
    .maybeSingle();

  if (error || !row) {
    if (error) console.error("[audits] access lookup failed:", error.message);
    return null;
  }

  const workspaceId = row.workspace_id as string;
  const createdBy = row.created_by as string | null;

  if (createdBy !== userId) {
    const { data: membership } = await sb
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!membership) return null;
  }

  return {
    id: row.id as string,
    workspaceId,
    productUrl: row.product_url as string,
    storeUrl: (row.store_url as string) ?? null,
    competitorUrl: (row.competitor_url as string) ?? null,
    status: row.status as string,
  };
}

/** Soft-safe hard delete: cascades to child rows via FK. Returns false when not accessible. */
export async function deleteAuditForUser(
  auditId: string,
  userId: string
): Promise<boolean> {
  const meta = await getAuditAccessForUser(auditId, userId);
  if (!meta) return false;

  const sb = getSupabaseAdmin();
  if (!sb) return false;

  const { error } = await sb.from("audits").delete().eq("id", auditId);
  if (error) {
    console.error("[audits] delete failed:", error.message);
    return false;
  }
  return true;
}

/**
 * Load an audit report only if the user is a member of its workspace
 * (or created it). Prevents IDOR via service-role reads.
 */
export async function getAuditByIdForUser(
  auditId: string,
  userId: string
): Promise<StoredAuditReport | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data: row, error } = await sb.from("audits").select("*").eq("id", auditId).maybeSingle();
  if (error || !row) {
    if (error) console.error("[audits] get failed:", error.message);
    return null;
  }

  const workspaceId = row.workspace_id as string;
  const createdBy = row.created_by as string | null;

  if (createdBy === userId) {
    return hydrateStoredAudit(row);
  }

  const { data: membership } = await sb
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) return null;
  return hydrateStoredAudit(row);
}

async function hydrateStoredAudit(row: Record<string, unknown>): Promise<StoredAuditReport | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const auditId = row.id as string;

  const demoMode = row.model === "demo" || !process.env.GEMINI_API_KEY;
  const aiConfigured = !!process.env.GEMINI_API_KEY;

  const { data: runs } = await sb
    .from("analysis_runs")
    .select("id, analyzer, status, duration_ms, tokens_used, estimated_cost, error_message")
    .eq("audit_id", auditId)
    .order("created_at", { ascending: true });

  const analysisRuns = (runs ?? []).map((r) => ({
    id: r.id as string,
    analyzer: r.analyzer as string,
    status: r.status as string,
    durationMs: (r.duration_ms as number) ?? null,
    tokensUsed: (r.tokens_used as number) ?? null,
    estimatedCost: r.estimated_cost != null ? Number(r.estimated_cost) : null,
    errorMessage: (r.error_message as string) ?? null,
  }));

  const rowStatus = (row.status as string) || "queued";

  const { data: report } = await sb
    .from("reports")
    .select("summary")
    .eq("audit_id", auditId)
    .eq("version", 1)
    .maybeSingle();

  if (report?.summary && typeof report.summary === "object") {
    const summary = report.summary as AuditData;
    return {
      audit: {
        ...summary,
        id: auditId,
        productUrl: summary.productUrl || (row.product_url as string),
        productName: summary.productName || (row.product_name as string) || FALLBACK_PRODUCT_NAME,
        storeName: summary.storeName || (row.store_name as string) || FALLBACK_STORE_NAME,
        demoMode: summary.demoMode ?? demoMode,
        recommendations: prioritizeRecommendations(summary.recommendations ?? []),
        status: rowStatus,
      },
      demoMode: summary.demoMode ?? demoMode,
      aiConfigured,
      analysisRuns,
    };
  }

  // In-progress / failed audits must be readable for scanning polls and routing.
  if (rowStatus !== "completed") {
    return {
      audit: {
        id: auditId,
        productUrl: (row.product_url as string) || "",
        storeUrl: (row.store_url as string) || undefined,
        competitorUrl: (row.competitor_url as string) || undefined,
        productName: (row.product_name as string) || FALLBACK_PRODUCT_NAME,
        storeName: (row.store_name as string) || FALLBACK_STORE_NAME,
        overallScore: (row.overall_score as number) ?? 0,
        breakdown: [],
        recommendations: [],
        geoReadability: { chatgpt: 0, perplexity: 0, googleAI: 0 },
        createdAt: (row.created_at as string) || new Date().toISOString(),
        demoMode,
        status: rowStatus,
      },
      demoMode,
      aiConfigured,
      analysisRuns,
    };
  }

  const { data: scores } = await sb
    .from("audit_scores")
    .select("score, max_score, label, summary, subject, category_id")
    .eq("audit_id", auditId);

  const { data: categories } = await sb
    .from("analysis_categories")
    .select("id, slug, display_name, description");
  const slugById = new Map((categories ?? []).map((c) => [c.id as string, c.slug as string]));
  const displayById = new Map(
    (categories ?? []).map((c) => [c.id as string, c.display_name as string])
  );

  const { data: recs } = await sb
    .from("recommendations")
    .select("*")
    .eq("audit_id", auditId)
    .order("sort_order", { ascending: true });

  const { data: geo } = await sb.from("geo_signals").select("*").eq("audit_id", auditId).maybeSingle();

  type ScoreRow = {
    score: number;
    max_score: number;
    label: string | null;
    summary: string | null;
    subject: string;
    category_id: string;
  };

  const breakdown = ((scores as ScoreRow[] | null) ?? [])
    .filter((s) => s.subject === "self")
    .map((s) => {
      const slug = (slugById.get(s.category_id) ?? "conversion") as AuditData["breakdown"][number]["pillar"];
      return {
        pillar: slug,
        score: s.score,
        max: s.max_score,
        label: s.label ?? displayById.get(s.category_id) ?? slug,
        summary: s.summary ?? "",
      };
    });

  const competitorBreakdown = ((scores as ScoreRow[] | null) ?? [])
    .filter((s) => s.subject === "competitor")
    .map((s) => {
      const slug = (slugById.get(s.category_id) ?? "conversion") as AuditData["breakdown"][number]["pillar"];
      return {
        pillar: slug,
        score: s.score,
        max: s.max_score,
        label: s.label ?? displayById.get(s.category_id) ?? slug,
        summary: s.summary ?? "",
      };
    });

  const audit: AuditData = {
    id: auditId,
    productUrl: row.product_url as string,
    storeUrl: (row.store_url as string) || undefined,
    competitorUrl: (row.competitor_url as string) || undefined,
    productName: (row.product_name as string) || FALLBACK_PRODUCT_NAME,
    storeName: (row.store_name as string) || FALLBACK_STORE_NAME,
    overallScore: (row.overall_score as number) ?? 0,
    competitorScore: (row.competitor_score as number) ?? undefined,
    breakdown,
    competitorBreakdown: competitorBreakdown.length ? competitorBreakdown : undefined,
    geoReadability: {
      chatgpt: (geo?.chatgpt as number) ?? 0,
      perplexity: (geo?.perplexity as number) ?? 0,
      googleAI: (geo?.google_ai as number) ?? 0,
    },
    recommendations: prioritizeRecommendations(
      (recs ?? []).map((r) => mapRecommendationRow(r))
    ),
    createdAt: (row.completed_at as string) || (row.created_at as string),
    demoMode,
    status: rowStatus,
  };

  return { audit, demoMode, aiConfigured, analysisRuns };
}
