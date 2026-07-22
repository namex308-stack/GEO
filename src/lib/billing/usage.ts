import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import {
  canRunAudit,
  canRunGeneration,
  canCrawl,
  canUseMonitoring,
  canAddMonitoringSite,
  getCrawlMaxPages,
  getPlanLimits,
  type Plan,
} from "@/lib/billing/entitlements";
import { isDevUnlockAll, resolveEffectivePlan } from "@/lib/billing/dev-unlock";
import type { AuditData } from "@/lib/types";
import { enrichIssues } from "@/lib/engines/orchestrator";

/** Re-export for callers that import activation from the billing usage module. */
export { activateSubscription } from "@/lib/billing/activate-subscription";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export interface UserBillingContext {
  plan: Plan;
  auditsUsed: number;
  generationsUsed: number;
  billingPeriod?: "monthly" | "yearly" | null;
  currentPeriodEnd?: string | null;
  subscriptionStatus?: string | null;
}

/** Downgrade expired paid plans so profiles.plan stays in sync with subscriptions. */
export async function syncExpiredSubscriptions(userId: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const { data: sub } = await sb
    .from("subscriptions")
    .select("id, status, current_period_end, plan_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub?.current_period_end || sub.status !== "active") return;

  const end = new Date(sub.current_period_end);
  if (Number.isNaN(end.getTime()) || end.getTime() > Date.now()) return;

  await Promise.all([
    sb.from("subscriptions").update({ status: "cancelled" }).eq("id", sub.id),
    sb.from("profiles").update({ plan: "free", updated_at: new Date().toISOString() }).eq("id", userId),
  ]);
}

/** Batch expiry sync for cron — downgrades all past-due active subscriptions. */
export async function syncAllExpiredSubscriptions(): Promise<{ downgraded: number }> {
  const sb = getSupabaseAdmin();
  if (!sb) return { downgraded: 0 };

  const now = new Date().toISOString();
  const { data: expired } = await sb
    .from("subscriptions")
    .select("id, user_id")
    .eq("status", "active")
    .lt("current_period_end", now)
    .limit(200);

  if (!expired?.length) return { downgraded: 0 };

  let downgraded = 0;
  for (const row of expired) {
    await Promise.all([
      sb.from("subscriptions").update({ status: "cancelled" }).eq("id", row.id),
      sb.from("profiles").update({ plan: "free", updated_at: now }).eq("id", row.user_id),
    ]);
    downgraded += 1;
  }
  return { downgraded };
}

export async function getUserBillingContext(userId: string): Promise<UserBillingContext> {
  const sb = getSupabaseAdmin();
  const month = currentMonth();

  if (!sb) {
    return { plan: "free", auditsUsed: 0, generationsUsed: 0 };
  }

  await syncExpiredSubscriptions(userId);

  const [profileRes, usageRes, subRes] = await Promise.all([
    sb.from("profiles").select("plan").eq("id", userId).single(),
    sb
      .from("usage_counters")
      .select("audits_used, generations_used")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle(),
    sb
      .from("subscriptions")
      .select("status, current_period_end, billing_period")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // If billing_period column is missing, PostgREST returns an error — retry without it.
  let subscription = subRes.data;
  if (subRes.error?.message?.includes("billing_period")) {
    const fallback = await sb
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    subscription = fallback.data as typeof subscription;
  }

  const plan = resolveEffectivePlan((profileRes.data?.plan as Plan) ?? "free");
  const unlocked = isDevUnlockAll();
  return {
    plan,
    // Dev unlock: treat usage as unused so limits never block tryouts.
    auditsUsed: unlocked ? 0 : (usageRes.data?.audits_used ?? 0),
    generationsUsed: unlocked ? 0 : (usageRes.data?.generations_used ?? 0),
    billingPeriod: (subscription as { billing_period?: "monthly" | "yearly" } | null)?.billing_period ?? null,
    currentPeriodEnd: subscription?.current_period_end ?? null,
    subscriptionStatus: unlocked ? "active" : (subscription?.status ?? null),
  };
}

export async function assertCanRunAudit(userId: string): Promise<UserBillingContext | { error: string; status: number }> {
  const ctx = await getUserBillingContext(userId);
  if (!canRunAudit(ctx.plan, ctx.auditsUsed)) {
    const limit = getPlanLimits(ctx.plan).auditsPerMonth;
    return {
      error: `Monthly audit limit reached (${limit}/month). Upgrade your plan for more audits.`,
      status: 403,
    };
  }
  return ctx;
}

export async function assertCanRunCrawl(userId: string): Promise<UserBillingContext | { error: string; status: number }> {
  const auditCheck = await assertCanRunAudit(userId);
  if ("error" in auditCheck) return auditCheck;

  if (!canCrawl(auditCheck.plan)) {
    return {
      error: "Full website crawl requires a Pro or Business plan.",
      status: 403,
    };
  }

  return auditCheck;
}

export async function assertCanEnableMonitoring(userId: string): Promise<UserBillingContext | { error: string; status: number }> {
  const ctx = await getUserBillingContext(userId);

  if (!canUseMonitoring(ctx.plan)) {
    return {
      error: "Weekly monitoring requires a Pro or Business plan.",
      status: 403,
    };
  }

  const sb = getSupabaseAdmin();
  if (sb) {
    const { count } = await sb
      .from("monitoring_jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (!canAddMonitoringSite(ctx.plan, count ?? 0)) {
      const limit = getPlanLimits(ctx.plan).monitoringMaxSites;
      return {
        error: `Monitoring limit reached (${limit} site${limit === 1 ? "" : "s"}). Upgrade to Business for unlimited monitoring.`,
        status: 403,
      };
    }
  }

  return ctx;
}

export function getMaxCrawlPagesForPlan(plan: Plan): number {
  return getCrawlMaxPages(plan);
}

export async function incrementAuditUsage(userId: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const month = currentMonth();
  const { data } = await sb
    .from("usage_counters")
    .select("audits_used, generations_used")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  await sb.from("usage_counters").upsert(
    {
      user_id: userId,
      month,
      audits_used: (data?.audits_used ?? 0) + 1,
      generations_used: data?.generations_used ?? 0,
    },
    { onConflict: "user_id,month" }
  );
}

export async function incrementGenerationUsage(userId: string): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const month = currentMonth();
  const { data } = await sb
    .from("usage_counters")
    .select("audits_used, generations_used")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();

  await sb.from("usage_counters").upsert(
    {
      user_id: userId,
      month,
      audits_used: data?.audits_used ?? 0,
      generations_used: (data?.generations_used ?? 0) + 1,
    },
    { onConflict: "user_id,month" }
  );
}

export async function assertCanGenerate(userId: string): Promise<UserBillingContext | { error: string; status: number }> {
  const ctx = await getUserBillingContext(userId);
  if (!canRunGeneration(ctx.plan, ctx.generationsUsed)) {
    const limit = getPlanLimits(ctx.plan).generationsPerMonth;
    return {
      error: limit === null
        ? "Generation limit reached."
        : `Monthly generation limit reached (${limit}/month). Upgrade for unlimited AI content.`,
      status: 403,
    };
  }
  return ctx;
}

export function filterAuditForPlan(audit: AuditData, plan: Plan): AuditData {
  const limits = getPlanLimits(plan);

  let recommendations = limits.showRecommendations ? audit.recommendations : [];
  if (limits.recommendationsLimit !== null && recommendations.length > limits.recommendationsLimit) {
    const severityOrder = { critical: 0, warning: 1, opportunity: 2 };
    recommendations = [...recommendations]
      .sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9))
      .slice(0, limits.recommendationsLimit);
  }

  if (limits.showFullBreakdown && limits.showRecommendations && limits.showGeoReadability) {
    return { ...audit, recommendations: enrichIssues(recommendations, plan) };
  }

  const summary =
    audit.breakdown.length > 0
      ? audit.breakdown.map((b) => `${b.label}: ${b.score}/${b.max}`).join(" · ")
      : "Overall store health score based on your product page.";

  return {
    ...audit,
    competitorUrl: limits.canCompare ? audit.competitorUrl : undefined,
    competitorScore: limits.canCompare ? audit.competitorScore : undefined,
    competitorBreakdown: limits.canCompare ? audit.competitorBreakdown : undefined,
    breakdown: limits.showFullBreakdown
      ? audit.breakdown
      : [
          {
            pillar: "conversion" as const,
            score: audit.overallScore,
            max: 100,
            label: "Overall Score",
            summary,
          },
        ],
    geoReadability: limits.showGeoReadability
      ? audit.geoReadability
      : { chatgpt: 0, perplexity: 0, googleAI: 0 },
    recommendations: limits.showRecommendations ? enrichIssues(recommendations, plan) : [],
  };
}

