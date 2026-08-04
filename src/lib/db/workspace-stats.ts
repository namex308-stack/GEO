/**
 * Workspace dashboard + usage aggregates from Supabase (admin client, membership-scoped).
 */

import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import { ensurePersonalWorkspace, listAuditsForUser, type AuditHistoryItem } from "@/lib/db/audit-repository";
import type { PlanId, UsageMetric } from "@/lib/db/types";

export type PlanLimits = {
  planId: PlanId;
  displayName: string;
  auditsPerMonth: number | null;
  aiGensPerMonth: number | null;
  storesLimit: number | null;
  features: {
    aiGenerator: boolean;
    competitor: boolean;
    api: boolean;
  };
};

export type UsageCounts = Record<UsageMetric, number>;

export type DashboardPriorityIssue = {
  id: string;
  auditId: string;
  problem: string;
  solution: string;
  severity: "critical" | "warning" | "opportunity";
  impact: "high" | "medium" | "low";
  effort: string | null;
  pillar: string | null;
  projectedImpact: string | null;
};

export type DashboardTopIssue = {
  problem: string;
  count: number;
  severity: "critical" | "warning" | "opportunity";
  auditId: string | null;
};

export type DashboardPayload = {
  plan: PlanLimits;
  stats: {
    avgScore: number | null;
    totalAudits: number;
    auditsThisMonth: number;
    auditsLimit: number | null;
    geoScore: number | null;
    openRecommendations: number;
    totalRecommendations: number;
    latestStoreScore: number | null;
    /** Approx. pages touched = completed audits (1 product page per audit in MVP). */
    pagesScanned: number;
  };
  /** Latest completed audit used for GEO + decision context. */
  latestAudit: {
    id: string;
    productName: string;
    storeName: string;
    overallScore: number | null;
    completedAt: string | null;
  } | null;
  geoSignals: {
    chatgpt: number | null;
    perplexity: number | null;
    googleAi: number | null;
  } | null;
  /** Highest-priority open recommendation from the latest audit. */
  priorityIssue: DashboardPriorityIssue | null;
  /** Next open fixes after the priority issue (same audit). */
  nextFixes: DashboardPriorityIssue[];
  /** Aggregated open issues across recent audits. */
  topIssues: DashboardTopIssue[];
  trend: { label: string; score: number; date: string }[];
  recent: AuditHistoryItem[];
  /** Open recommendation count — used as actionable notification badge. */
  notificationCount: number;
  usagePct: number;
};

export type UsagePayload = {
  plan: PlanLimits;
  periodStart: string;
  periodEnd: string;
  counts: UsageCounts;
  endpoints: { metric: UsageMetric; used: number; limit: number | null }[];
  usagePct: number;
  billingEvents: {
    id: string;
    eventType: string;
    provider: string;
    createdAt: string;
    externalId: string | null;
  }[];
  storeCount: number;
};

const EMPTY_COUNTS: UsageCounts = {
  audit: 0,
  ai_generation: 0,
  competitor_compare: 0,
  api_call: 0,
};

function startOfMonth(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0));
}

function endOfMonth(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59));
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

export async function getPlanForUser(userId: string): Promise<PlanLimits> {
  const sb = getSupabaseAdmin();
  const fallback: PlanLimits = {
    planId: "free",
    displayName: "مجاني",
    auditsPerMonth: 3,
    aiGensPerMonth: 0,
    storesLimit: 1,
    features: { aiGenerator: false, competitor: false, api: false },
  };
  if (!sb) return fallback;

  const workspaceId = await ensurePersonalWorkspace(userId);
  if (!workspaceId) return fallback;

  const { data: ws } = await sb
    .from("workspaces")
    .select("plan_id")
    .eq("id", workspaceId)
    .maybeSingle();

  const planId = ((ws?.plan_id as string) || "free") as PlanId;

  const { data: catalog } = await sb
    .from("plan_catalog")
    .select("id, display_name, audits_per_month, ai_gens_per_month, stores_limit, features")
    .eq("id", planId)
    .maybeSingle();

  if (!catalog) {
    return { ...fallback, planId };
  }

  const featuresRaw =
    catalog.features && typeof catalog.features === "object"
      ? (catalog.features as Record<string, unknown>)
      : {};

  return {
    planId,
    displayName: (catalog.display_name as string) || planId,
    auditsPerMonth: (catalog.audits_per_month as number | null) ?? null,
    aiGensPerMonth: (catalog.ai_gens_per_month as number | null) ?? null,
    storesLimit: (catalog.stores_limit as number | null) ?? null,
    features: {
      aiGenerator: Boolean(featuresRaw.ai_generator),
      competitor: Boolean(featuresRaw.competitor),
      api: Boolean(featuresRaw.api),
    },
  };
}

export async function getUsageCountsForUser(
  userId: string,
  fromIso: string,
  toIso: string
): Promise<UsageCounts> {
  const sb = getSupabaseAdmin();
  const counts = { ...EMPTY_COUNTS };
  if (!sb) return counts;

  const ids = await workspaceIdsForUser(userId);
  if (!ids.length) return counts;

  const { data, error } = await sb
    .from("usage_events")
    .select("metric, quantity")
    .in("workspace_id", ids)
    .gte("created_at", fromIso)
    .lte("created_at", toIso);

  if (error) {
    console.error("[usage_events] aggregate failed:", error.message);
    return counts;
  }

  for (const row of data ?? []) {
    const metric = row.metric as UsageMetric;
    const qty = Number(row.quantity) || 0;
    if (metric in counts) counts[metric] += qty;
  }

  return counts;
}

function usagePct(used: number, limit: number | null): number {
  if (limit == null || limit <= 0) return used > 0 ? 5 : 0;
  return Math.max(0, Math.min(100, Math.round((used / limit) * 100)));
}

export async function getDashboardForUser(userId: string): Promise<DashboardPayload> {
  const plan = await getPlanForUser(userId);
  const audits = await listAuditsForUser(userId, 50);
  const completed = audits.filter((a) => a.status === "completed" && a.overallScore != null);
  const latest = completed[0] ?? null;

  const monthStart = startOfMonth().toISOString();
  const monthEnd = endOfMonth().toISOString();
  const counts = await getUsageCountsForUser(userId, monthStart, monthEnd);

  const scores = completed.map((a) => a.overallScore as number);
  const avgScore =
    scores.length > 0 ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length) : null;

  const auditsThisMonth = counts.audit;
  const recent = audits.slice(0, 5);

  // Trend: last up to 8 completed audits oldest→newest for chart
  const trendSource = [...completed].reverse().slice(-8);
  const trend = trendSource.map((a) => ({
    label: new Date(a.completedAt || a.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    score: a.overallScore as number,
    date: a.completedAt || a.createdAt,
  }));

  const [geoScore, geoSignals, decision, recStats, topIssues, pageStats] = await Promise.all([
    getLatestGeoScore(userId, latest?.id ?? null),
    getLatestGeoSignals(latest?.id ?? null),
    getDecisionRecommendations(latest?.id ?? null),
    getRecommendationStats(userId),
    getTopIssuesForUser(userId),
    getPageStatsForUser(userId),
  ]);

  const recentEnriched = recent.map((r) => ({
    ...r,
    pageCount: pageStats.byAudit[r.id] ?? 0,
    openIssues: pageStats.openIssuesByAudit[r.id] ?? 0,
  }));

  return {
    plan,
    stats: {
      avgScore,
      totalAudits: audits.length,
      auditsThisMonth,
      auditsLimit: plan.auditsPerMonth,
      geoScore,
      openRecommendations: recStats.open,
      totalRecommendations: recStats.total,
      latestStoreScore: latest?.overallScore ?? null,
      pagesScanned: pageStats.totalPages,
    },
    latestAudit: latest
      ? {
          id: latest.id,
          productName: latest.productName,
          storeName: latest.storeName,
          overallScore: latest.overallScore,
          completedAt: latest.completedAt,
        }
      : null,
    geoSignals,
    priorityIssue: decision.priority,
    nextFixes: decision.next,
    topIssues,
    trend,
    recent: recentEnriched,
    notificationCount: recStats.open,
    usagePct: usagePct(auditsThisMonth, plan.auditsPerMonth),
  };
}

async function getLatestGeoScore(userId: string, auditId: string | null): Promise<number | null> {
  if (!auditId) return null;
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  // Confirm membership already implied by listAuditsForUser
  void userId;

  const { data: auditRow } = await sb
    .from("audits")
    .select("geo_score")
    .eq("id", auditId)
    .maybeSingle();
  if (auditRow?.geo_score != null && Number.isFinite(Number(auditRow.geo_score))) {
    return Math.round(Number(auditRow.geo_score));
  }

  const { data: categories } = await sb
    .from("analysis_categories")
    .select("id")
    .eq("slug", "geo")
    .maybeSingle();
  if (!categories?.id) {
    const signals = await getLatestGeoSignals(auditId);
    if (!signals) return null;
    const vals = [signals.perplexity, signals.chatgpt, signals.googleAi]
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n));
    if (!vals.length) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  const { data: score } = await sb
    .from("audit_scores")
    .select("score")
    .eq("audit_id", auditId)
    .eq("category_id", categories.id)
    .eq("subject", "self")
    .maybeSingle();

  return score?.score != null ? Number(score.score) : null;
}

async function getLatestGeoSignals(
  auditId: string | null
): Promise<DashboardPayload["geoSignals"]> {
  if (!auditId) return null;
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data: geo } = await sb
    .from("geo_signals")
    .select("perplexity, chatgpt, google_ai")
    .eq("audit_id", auditId)
    .maybeSingle();

  if (!geo) return null;
  return {
    chatgpt: geo.chatgpt != null ? Number(geo.chatgpt) : null,
    perplexity: geo.perplexity != null ? Number(geo.perplexity) : null,
    googleAi: geo.google_ai != null ? Number(geo.google_ai) : null,
  };
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  warning: 1,
  opportunity: 2,
};

const IMPACT_RANK: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function mapPriorityRow(
  row: {
    id: string;
    audit_id: string;
    problem: string;
    solution: string;
    severity: string;
    impact: string;
    effort: string | null;
    pillar: string | null;
    projected_impact: string | null;
  }
): DashboardPriorityIssue {
  const severity =
    row.severity === "critical" || row.severity === "warning" || row.severity === "opportunity"
      ? row.severity
      : "opportunity";
  const impact =
    row.impact === "high" || row.impact === "medium" || row.impact === "low"
      ? row.impact
      : "medium";

  return {
    id: row.id,
    auditId: row.audit_id,
    problem: row.problem,
    solution: row.solution,
    severity,
    impact,
    effort: row.effort,
    pillar: row.pillar,
    projectedImpact: row.projected_impact,
  };
}

async function getDecisionRecommendations(
  auditId: string | null
): Promise<{ priority: DashboardPriorityIssue | null; next: DashboardPriorityIssue[] }> {
  if (!auditId) return { priority: null, next: [] };
  const sb = getSupabaseAdmin();
  if (!sb) return { priority: null, next: [] };

  const { data, error } = await sb
    .from("recommendations")
    .select(
      "id, audit_id, problem, solution, severity, impact, effort, pillar, projected_impact, status, sort_order"
    )
    .eq("audit_id", auditId)
    .eq("status", "open");

  if (error || !data?.length) {
    if (error) console.error("[dashboard] recommendations failed:", error.message);
    return { priority: null, next: [] };
  }

  const sorted = [...data].sort((a, b) => {
    const s =
      (SEVERITY_RANK[a.severity as string] ?? 9) - (SEVERITY_RANK[b.severity as string] ?? 9);
    if (s !== 0) return s;
    const i =
      (IMPACT_RANK[a.impact as string] ?? 9) - (IMPACT_RANK[b.impact as string] ?? 9);
    if (i !== 0) return i;
    return (a.sort_order as number) - (b.sort_order as number);
  });

  const mapped = sorted.map((row) =>
    mapPriorityRow(
      row as {
        id: string;
        audit_id: string;
        problem: string;
        solution: string;
        severity: string;
        impact: string;
        effort: string | null;
        pillar: string | null;
        projected_impact: string | null;
      }
    )
  );

  return {
    priority: mapped[0] ?? null,
    next: mapped.slice(1, 4),
  };
}

async function getRecommendationStats(
  userId: string
): Promise<{ open: number; total: number }> {
  const sb = getSupabaseAdmin();
  if (!sb) return { open: 0, total: 0 };

  const audits = await listAuditsForUser(userId, 20);
  const ids = audits.map((a) => a.id);
  if (!ids.length) return { open: 0, total: 0 };

  const { data, error } = await sb
    .from("recommendations")
    .select("id, status")
    .in("audit_id", ids);

  if (error || !data) return { open: 0, total: 0 };
  const total = data.length;
  const open = data.filter((r) => r.status === "open").length;
  return { open, total };
}

async function getTopIssuesForUser(userId: string): Promise<DashboardTopIssue[]> {
  const sb = getSupabaseAdmin();
  if (!sb) return [];

  const audits = await listAuditsForUser(userId, 20);
  const ids = audits.map((a) => a.id);
  if (!ids.length) return [];

  const { data, error } = await sb
    .from("recommendations")
    .select("problem, severity, status, audit_id")
    .in("audit_id", ids)
    .eq("status", "open");

  if (error || !data?.length) {
    if (error) console.error("[dashboard] top issues failed:", error.message);
    return [];
  }

  const grouped = new Map<
    string,
    { problem: string; count: number; severity: string; auditId: string }
  >();

  for (const row of data) {
    const problem = String(row.problem || "").trim();
    if (!problem) continue;
    const key = problem.toLowerCase();
    const existing = grouped.get(key);
    if (existing) {
      existing.count += 1;
      const nextRank = SEVERITY_RANK[row.severity as string] ?? 9;
      const curRank = SEVERITY_RANK[existing.severity] ?? 9;
      if (nextRank < curRank) existing.severity = String(row.severity);
    } else {
      grouped.set(key, {
        problem,
        count: 1,
        severity: String(row.severity || "opportunity"),
        auditId: String(row.audit_id),
      });
    }
  }

  return [...grouped.values()]
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9);
    })
    .slice(0, 5)
    .map((item) => {
      const severity =
        item.severity === "critical" ||
        item.severity === "warning" ||
        item.severity === "opportunity"
          ? item.severity
          : "opportunity";
      return {
        problem: item.problem,
        count: item.count,
        severity,
        auditId: item.auditId,
      };
    });
}

async function getPageStatsForUser(userId: string): Promise<{
  totalPages: number;
  byAudit: Record<string, number>;
  openIssuesByAudit: Record<string, number>;
}> {
  const empty = { totalPages: 0, byAudit: {}, openIssuesByAudit: {} };
  const sb = getSupabaseAdmin();
  if (!sb) return empty;

  const audits = await listAuditsForUser(userId, 50);
  const ids = audits.map((a) => a.id);
  if (!ids.length) return empty;

  const [{ data: pages }, { data: recs }] = await Promise.all([
    sb.from("audit_pages").select("audit_id").in("audit_id", ids),
    sb.from("recommendations").select("audit_id, status").in("audit_id", ids).eq("status", "open"),
  ]);

  const byAudit: Record<string, number> = {};
  for (const row of pages ?? []) {
    const id = String(row.audit_id);
    byAudit[id] = (byAudit[id] ?? 0) + 1;
  }

  const openIssuesByAudit: Record<string, number> = {};
  for (const row of recs ?? []) {
    const id = String(row.audit_id);
    openIssuesByAudit[id] = (openIssuesByAudit[id] ?? 0) + 1;
  }

  return {
    totalPages: (pages ?? []).length,
    byAudit,
    openIssuesByAudit,
  };
}

export async function getUsageSummaryForUser(userId: string): Promise<UsagePayload> {
  const plan = await getPlanForUser(userId);
  const from = startOfMonth();
  const to = endOfMonth();
  const counts = await getUsageCountsForUser(userId, from.toISOString(), to.toISOString());
  const workspaceId = await ensurePersonalWorkspace(userId);
  const sb = getSupabaseAdmin();

  const endpoints: UsagePayload["endpoints"] = [
    { metric: "audit", used: counts.audit, limit: plan.auditsPerMonth },
    { metric: "ai_generation", used: counts.ai_generation, limit: plan.aiGensPerMonth },
    { metric: "competitor_compare", used: counts.competitor_compare, limit: plan.auditsPerMonth },
    { metric: "api_call", used: counts.api_call, limit: null },
  ];

  let billingEvents: UsagePayload["billingEvents"] = [];
  let storeCount = 0;

  if (sb && workspaceId) {
    const [{ data: events }, { count }] = await Promise.all([
      sb
        .from("billing_events")
        .select("id, event_type, provider, created_at, external_id")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(10),
      sb
        .from("stores")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
    ]);

    billingEvents = (events ?? []).map((e) => ({
      id: e.id as string,
      eventType: e.event_type as string,
      provider: e.provider as string,
      createdAt: e.created_at as string,
      externalId: (e.external_id as string) ?? null,
    }));
    storeCount = count ?? 0;
  }

  return {
    plan,
    periodStart: from.toISOString(),
    periodEnd: to.toISOString(),
    counts,
    endpoints,
    usagePct: usagePct(counts.audit, plan.auditsPerMonth),
    billingEvents,
    storeCount,
  };
}

export type AccountProfile = {
  fullName: string;
  email: string;
  locale: string;
  timezone: string;
  avatarUrl: string;
  businessName: string;
  country: string;
};

export async function getAccountProfile(
  userId: string,
  email: string
): Promise<AccountProfile | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data, error } = await sb
    .from("profiles")
    .select("full_name, locale, timezone, avatar_url, business_name, country")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[profiles] get account failed:", error.message);
  }

  return {
    fullName: (data?.full_name as string) || "",
    email,
    locale: (data?.locale as string) || "ar",
    timezone: (data?.timezone as string) || "",
    avatarUrl: (data?.avatar_url as string) || "",
    businessName: (data?.business_name as string) || "",
    country: (data?.country as string) || "",
  };
}

export async function updateAccountProfile(
  userId: string,
  patch: { fullName?: string; locale?: string; timezone?: string; businessName?: string; country?: string },
  email = ""
): Promise<AccountProfile | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.fullName !== undefined) update.full_name = patch.fullName.trim().slice(0, 120);
  if (patch.locale !== undefined) update.locale = patch.locale.trim().slice(0, 16);
  if (patch.timezone !== undefined) update.timezone = patch.timezone.trim().slice(0, 64);
  if (patch.businessName !== undefined) update.business_name = patch.businessName.trim().slice(0, 120);
  if (patch.country !== undefined) update.country = patch.country.trim().slice(0, 40);

  const { error } = await sb.from("profiles").update(update).eq("id", userId);
  if (error) {
    console.error("[profiles] update account failed:", error.message);
    return null;
  }

  return getAccountProfile(userId, email);
}
