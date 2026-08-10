/**
 * Workspace dashboard + usage aggregates from Supabase (admin client, membership-scoped).
 */

import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import { ensurePersonalWorkspace, listAuditsForUser } from "@/lib/db/audit-repository";
import { countUnreadNotificationsForUser } from "@/lib/db/notifications-repository";
import { emitSubscriptionWarningNotification } from "@/lib/notifications/emit";
import type { PlanId, UsageMetric } from "@/lib/db/types";
import { parseImpact, parseSeverity } from "@/lib/audits/parse";
import { buildScoreTrend } from "@/lib/dashboard/trend";
import { decodeHtmlEntities } from "@/lib/text/decode-html";
import type {
  DashboardPayload,
  DashboardPriorityIssue,
  DashboardTopIssue,
  PlanLimits,
  UsageCounts,
} from "@/lib/dashboard/types";

export type {
  DashboardPayload,
  DashboardPriorityIssue,
  DashboardTopIssue,
  PlanLimits,
  UsageCounts,
} from "@/lib/dashboard/types";

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

const PLAN_DISPLAY_NAMES_AR: Record<PlanId, string> = {
  free: "مجاني",
  pro: "احترافي",
  business: "أعمال",
};

function arabicPlanDisplayName(planId: PlanId, catalogName?: string | null): string {
  return PLAN_DISPLAY_NAMES_AR[planId] ?? catalogName?.trim() ?? planId;
}

function startOfMonth(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0));
}

function endOfMonth(d = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59));
}

/** The current calendar-month usage period, shared by dashboard display and quota enforcement. */
export function getCurrentUsagePeriod(): { start: string; end: string } {
  return { start: startOfMonth().toISOString(), end: endOfMonth().toISOString() };
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

function planLimitsFromCatalog(
  planId: PlanId,
  catalog: {
    display_name: string | null;
    audits_per_month: number | null;
    ai_gens_per_month: number | null;
    stores_limit: number | null;
    features: unknown;
  } | null,
  fallback: PlanLimits
): PlanLimits {
  if (!catalog) {
    return { ...fallback, planId: planId === "free" ? "free" : planId };
  }

  const featuresRaw =
    catalog.features && typeof catalog.features === "object"
      ? (catalog.features as Record<string, unknown>)
      : {};

  return {
    planId,
    displayName: arabicPlanDisplayName(planId, catalog.display_name),
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

/** Paid entitlement is active only while subscription status is active and period has not ended. */
function isPaidSubscriptionActive(sub: {
  status: string | null;
  current_period_end: string | null;
} | null): boolean {
  if (!sub || sub.status !== "active") return false;
  if (!sub.current_period_end) return false;
  return new Date(sub.current_period_end).getTime() > Date.now();
}

const FREE_PLAN_FALLBACK: PlanLimits = {
  planId: "free",
  displayName: "مجاني",
  auditsPerMonth: 3,
  aiGensPerMonth: 0,
  storesLimit: 1,
  features: { aiGenerator: false, competitor: false, api: false },
};

/** Resolve plan limits for a workspace (lazy expiry downgrade included). */
export async function getPlanForWorkspace(workspaceId: string): Promise<PlanLimits> {
  const sb = getSupabaseAdmin();
  const fallback = FREE_PLAN_FALLBACK;
  if (!sb) return fallback;

  const { data: ws } = await sb
    .from("workspaces")
    .select("plan_id")
    .eq("id", workspaceId)
    .maybeSingle();

  let planId = ((ws?.plan_id as string) || "free") as PlanId;

  if (planId !== "free") {
    const { data: sub } = await sb
      .from("subscriptions")
      .select("id, status, current_period_end")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!isPaidSubscriptionActive(sub)) {
      const nowIso = new Date().toISOString();
      const { error: downgradeError } = await sb
        .from("workspaces")
        .update({ plan_id: "free", updated_at: nowIso })
        .eq("id", workspaceId);
      if (downgradeError) {
        console.error("[billing] expired plan downgrade failed:", downgradeError.message, {
          workspaceId,
        });
      } else if (sub?.id && sub.status === "active") {
        await sb
          .from("subscriptions")
          .update({ status: "canceled", updated_at: nowIso })
          .eq("id", sub.id);
        await emitSubscriptionWarningNotification({
          workspaceId,
          kind: "expired",
          planLabel: planId,
        });
      }
      planId = "free";
    }
  }

  const { data: catalog } = await sb
    .from("plan_catalog")
    .select("id, display_name, audits_per_month, ai_gens_per_month, stores_limit, features")
    .eq("id", planId)
    .maybeSingle();

  return planLimitsFromCatalog(planId, catalog, fallback);
}

export async function getPlanForUser(userId: string): Promise<PlanLimits> {
  const workspaceId = await ensurePersonalWorkspace(userId);
  if (!workspaceId) return FREE_PLAN_FALLBACK;
  return getPlanForWorkspace(workspaceId);
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
  // Allow >100 so over-quota Free usage is visible in critical metrics.
  return Math.max(0, Math.round((used / limit) * 100));
}

/** Lightweight shell payload — topbar / nav only (not the full dashboard). */
export type ShellPayload = {
  planName: string;
  displayName: string | null;
  latestAuditId: string | null;
  notificationCount: number;
  features: { competitor: boolean; aiGenerator: boolean };
};

export async function getShellForUser(userId: string): Promise<ShellPayload> {
  const [plan, audits, profileName] = await Promise.all([
    getPlanForUser(userId),
    listAuditsForUser(userId, 8),
    getProfileDisplayName(userId),
  ]);

  const latestCompleted = audits.find((a) => a.status === "completed") ?? null;
  const latestAny = latestCompleted ?? audits[0] ?? null;
  const notificationCount = await countUnreadNotificationsForUser(userId);

  return {
    planName: plan.displayName,
    displayName: profileName,
    latestAuditId: latestAny?.id ?? null,
    notificationCount,
    features: {
      competitor: Boolean(plan.features.competitor),
      aiGenerator: Boolean(plan.features.aiGenerator),
    },
  };
}

export async function getDashboardForUser(userId: string): Promise<DashboardPayload> {
  const monthStart = startOfMonth().toISOString();
  const monthEnd = endOfMonth().toISOString();
  const [plan, audits, counts] = await Promise.all([
    getPlanForUser(userId),
    listAuditsForUser(userId, 50),
    getUsageCountsForUser(userId, monthStart, monthEnd),
  ]);
  const completed = audits.filter((a) => a.status === "completed" && a.overallScore != null);
  const latest = completed[0] ?? null;

  const scores = completed.map((a) => a.overallScore as number);
  const avgScore =
    scores.length > 0 ? Math.round(scores.reduce((s, n) => s + n, 0) / scores.length) : null;

  const auditsThisMonth = counts.audit;
  // Prefer completed audits with real scores for the recent table; fill with others.
  const recent = [
    ...audits.filter((a) => a.status === "completed" && a.overallScore != null),
    ...audits.filter((a) => !(a.status === "completed" && a.overallScore != null)),
  ].slice(0, 5);
  const trend = buildScoreTrend(completed, { locale: "ar", limit: 24 });

  const [geoScore, geoSignals, decision, recStats, topIssues, pageStats, profileName] =
    await Promise.all([
      getLatestGeoScore(userId, latest?.id ?? null),
      getLatestGeoSignals(latest?.id ?? null),
      getDecisionRecommendations(latest?.id ?? null),
      getRecommendationStats(userId),
      getTopIssuesForUser(userId),
      getPageStatsForUser(userId),
      getProfileDisplayName(userId),
    ]);

  const recentEnriched = recent.map((r) => ({
    ...r,
    productName: decodeHtmlEntities(r.productName),
    storeName: decodeHtmlEntities(r.storeName),
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
      pagesThisMonth: pageStats.pagesThisMonth,
    },
    latestAudit: latest
      ? {
          id: latest.id,
          productName: decodeHtmlEntities(latest.productName),
          storeName: decodeHtmlEntities(latest.storeName),
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
    displayName: profileName,
  };
}

async function getProfileDisplayName(userId: string): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data } = await sb
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();
  const name = typeof data?.full_name === "string" ? data.full_name.trim() : "";
  if (!name) return null;

  // Heal stale auth metadata (e.g. placeholder "NAME X") so shell + marketing nav match settings.
  void sb.auth.admin
    .updateUserById(userId, { user_metadata: { full_name: name.slice(0, 120) } })
    .then(({ error }) => {
      if (error) console.error("[profiles] auth metadata heal failed:", error.message);
    });

  return name;
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
  const severity = parseSeverity(row.severity);
  const impact = parseImpact(row.impact);

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
    .select("id, status, severity")
    .in("audit_id", ids);

  if (error || !data) return { open: 0, total: 0 };
  // Count real problems only — exclude filler "opportunity" success fluff.
  const actionable = data.filter((r) => {
    const severity = String(r.severity || "");
    return severity === "critical" || severity === "warning";
  });
  const total = actionable.length;
  const open = actionable.filter((r) => r.status === "open").length;
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
    .eq("status", "open")
    .in("severity", ["critical", "warning"]);

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
    .map((item) => ({
      problem: item.problem,
      count: item.count,
      severity: parseSeverity(item.severity),
      auditId: item.auditId,
    }));
}

async function getPageStatsForUser(userId: string): Promise<{
  totalPages: number;
  pagesThisMonth: number;
  byAudit: Record<string, number>;
  openIssuesByAudit: Record<string, number>;
}> {
  const empty = { totalPages: 0, pagesThisMonth: 0, byAudit: {}, openIssuesByAudit: {} };
  const sb = getSupabaseAdmin();
  if (!sb) return empty;

  const audits = await listAuditsForUser(userId, 50);
  const ids = audits.map((a) => a.id);
  if (!ids.length) return empty;

  const monthStartTs = startOfMonth().getTime();
  const auditsThisMonthIds = new Set(
    audits
      .filter((a) => {
        const ts = new Date(a.completedAt || a.createdAt).getTime();
        return Number.isFinite(ts) && ts >= monthStartTs;
      })
      .map((a) => a.id)
  );

  const [{ data: pages }, { data: recs }] = await Promise.all([
    sb.from("audit_pages").select("audit_id").in("audit_id", ids),
    sb
      .from("recommendations")
      .select("audit_id, status, severity")
      .in("audit_id", ids)
      .eq("status", "open")
      .in("severity", ["critical", "warning"]),
  ]);

  const byAudit: Record<string, number> = {};
  let pagesThisMonth = 0;
  for (const row of pages ?? []) {
    const id = String(row.audit_id);
    byAudit[id] = (byAudit[id] ?? 0) + 1;
    if (auditsThisMonthIds.has(id)) pagesThisMonth += 1;
  }

  const openIssuesByAudit: Record<string, number> = {};
  for (const row of recs ?? []) {
    const id = String(row.audit_id);
    openIssuesByAudit[id] = (openIssuesByAudit[id] ?? 0) + 1;
  }

  return {
    totalPages: (pages ?? []).length,
    pagesThisMonth,
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
    locale: "ar",
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
  // Product UI is Arabic-only — never persist English or other UI locales.
  if (patch.locale !== undefined) update.locale = "ar";
  if (patch.timezone !== undefined) update.timezone = patch.timezone.trim().slice(0, 64);
  if (patch.businessName !== undefined) update.business_name = patch.businessName.trim().slice(0, 120);
  if (patch.country !== undefined) update.country = patch.country.trim().slice(0, 40);

  const { error } = await sb.from("profiles").update(update).eq("id", userId);
  if (error) {
    console.error("[profiles] update account failed:", error.message);
    return null;
  }

  // Keep auth metadata in sync so shell greeting / avatar name match settings.
  if (patch.fullName !== undefined) {
    const { error: metaError } = await sb.auth.admin.updateUserById(userId, {
      user_metadata: { full_name: patch.fullName.trim().slice(0, 120) },
    });
    if (metaError) {
      console.error("[profiles] auth metadata sync failed:", metaError.message);
    }
  }

  return getAccountProfile(userId, email);
}
