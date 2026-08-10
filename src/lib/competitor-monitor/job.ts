import "server-only";

import { crawlWithFallback } from "@/lib/firecrawl";
import {
  insertCompetitorChanges,
  insertCompetitorSnapshot,
  listDueCompetitorTargets,
  loadCompetitorPageFromAudits,
  syncCompetitorTargetsFromAudits,
  touchCompetitorTarget,
  type DueCompetitorTarget,
} from "@/lib/db/competitor-monitor-repository";
import { emitAlertsForCompetitorChanges } from "@/lib/alerts/emit";
import { getPlanForWorkspace } from "@/lib/db/workspace-stats";
import { isPlanFeatureEnabled } from "@/lib/billing/entitlements";
import { isCompetitorCrawlAllowed } from "./crawl-policy";
import { detectCompetitorChanges } from "./diff";
import { extractCompetitorSignals } from "./signals";

export type CompetitorMonitorJobResult = {
  targetsSynced: number;
  considered: number;
  checked: number;
  changed: number;
  skipped: number;
  failed: number;
  crawlEnabled: boolean;
  changeIds: number;
};

async function resolvePage(target: DueCompetitorTarget): Promise<{
  page: Awaited<ReturnType<typeof loadCompetitorPageFromAudits>>;
  source: "firecrawl" | "fallback" | "audit_reuse" | "none";
  errorMessage?: string;
}> {
  // Prefer audit reuse in all environments to avoid unnecessary crawls.
  const reused = await loadCompetitorPageFromAudits(target.workspaceId, target.url);
  if (reused && reused.scrapeStatus === "ok" && reused.markdown) {
    // If we already have a snapshot with the same content hash, still allow
    // cadence checks — caller decides whether to persist.
    if (!isCompetitorCrawlAllowed()) {
      return { page: reused, source: "audit_reuse" };
    }
    // In production, refresh via live crawl when due; fall back to reuse on failure.
  }

  if (!isCompetitorCrawlAllowed()) {
    if (reused) return { page: reused, source: "audit_reuse" };
    return {
      page: null,
      source: "none",
      errorMessage:
        "تم تخطي الزحف المباشر في بيئة التطوير. فعّل COMPETITOR_MONITOR_ALLOW_CRAWL=true للتجربة اليدوية.",
    };
  }

  const crawled = await crawlWithFallback(target.url);
  if (crawled.page && crawled.page.scrapeStatus === "ok") {
    return {
      page: crawled.page,
      source: crawled.source === "firecrawl" ? "firecrawl" : "fallback",
    };
  }

  if (reused) {
    return { page: reused, source: "audit_reuse" };
  }

  return {
    page: null,
    source: crawled.source,
    errorMessage: crawled.errorMessage || "فشل جلب صفحة المنافس.",
  };
}

async function processTarget(target: DueCompetitorTarget): Promise<{
  checked: boolean;
  changed: boolean;
  failed: boolean;
  changeCount: number;
}> {
  const resolved = await resolvePage(target);

  if (!resolved.page) {
    await insertCompetitorSnapshot({
      targetId: target.id,
      workspaceId: target.workspaceId,
      scrapeSource: resolved.source,
      scrapeStatus: "failed",
      signals: null,
      scores: null,
      page: null,
      errorMessage: resolved.errorMessage ?? "لا توجد بيانات منافس.",
    });
    await touchCompetitorTarget({ targetId: target.id, changed: false });
    return {
      checked: false,
      changed: false,
      failed: resolved.source !== "none",
      changeCount: 0,
    };
  }

  // In development with audit reuse: skip writing a duplicate snapshot when
  // content hash matches the last one (no continuous churn).
  const { signals, scores } = extractCompetitorSignals(resolved.page);
  if (
    resolved.source === "audit_reuse" &&
    target.lastSnapshotSignals?.contentHash &&
    target.lastSnapshotSignals.contentHash === signals.contentHash
  ) {
    await touchCompetitorTarget({ targetId: target.id, changed: false });
    return { checked: true, changed: false, failed: false, changeCount: 0 };
  }

  const snapshotId = await insertCompetitorSnapshot({
    targetId: target.id,
    workspaceId: target.workspaceId,
    scrapeSource: resolved.source,
    scrapeStatus: "ok",
    signals,
    scores,
    page: resolved.page,
  });

  if (!snapshotId) {
    return { checked: false, changed: false, failed: true, changeCount: 0 };
  }

  let changeCount = 0;
  if (target.lastSnapshotSignals) {
    const detected = detectCompetitorChanges(target.lastSnapshotSignals, signals);
    changeCount = await insertCompetitorChanges({
      targetId: target.id,
      workspaceId: target.workspaceId,
      previousSnapshotId: target.lastSnapshotId,
      currentSnapshotId: snapshotId,
      changes: detected,
    });
    if (detected.length) {
      await emitAlertsForCompetitorChanges({
        workspaceId: target.workspaceId,
        storeId: target.storeId,
        targetId: target.id,
        snapshotId,
        targetLabel: target.label,
        targetUrl: target.url,
        changes: detected,
      });
    }
  }

  await touchCompetitorTarget({
    targetId: target.id,
    changed: changeCount > 0,
  });

  return {
    checked: true,
    changed: changeCount > 0,
    failed: false,
    changeCount,
  };
}

async function workspaceAllowsCompetitor(
  workspaceId: string,
  cache: Map<string, boolean>
): Promise<boolean> {
  const cached = cache.get(workspaceId);
  if (cached !== undefined) return cached;
  const plan = await getPlanForWorkspace(workspaceId);
  const allowed = isPlanFeatureEnabled(plan, "competitor");
  cache.set(workspaceId, allowed);
  return allowed;
}

/** Scheduled production entrypoint for competitor change monitoring. */
export async function runCompetitorMonitorJob(
  now = new Date()
): Promise<CompetitorMonitorJobResult> {
  const startedAt = Date.now();
  const crawlEnabled = isCompetitorCrawlAllowed();
  const entitlementCache = new Map<string, boolean>();

  console.info("[competitor-monitor] job start", { crawlEnabled });

  const targetsSynced = await syncCompetitorTargetsFromAudits({
    isWorkspaceAllowed: (workspaceId) =>
      workspaceAllowsCompetitor(workspaceId, entitlementCache),
  });
  const due = await listDueCompetitorTargets(now);

  const result: CompetitorMonitorJobResult = {
    targetsSynced,
    considered: due.length,
    checked: 0,
    changed: 0,
    skipped: 0,
    failed: 0,
    crawlEnabled,
    changeIds: 0,
  };

  for (const target of due) {
    try {
      const allowed = await workspaceAllowsCompetitor(
        target.workspaceId,
        entitlementCache
      );
      if (!allowed) {
        // Advance cadence so free-plan leftovers do not re-queue daily.
        await touchCompetitorTarget({ targetId: target.id, changed: false });
        result.skipped += 1;
        continue;
      }

      const outcome = await processTarget(target);
      if (outcome.failed) {
        result.failed += 1;
        continue;
      }
      if (!outcome.checked && !outcome.changed) {
        result.skipped += 1;
        continue;
      }
      result.checked += 1;
      if (outcome.changed) result.changed += 1;
      result.changeIds += outcome.changeCount;
    } catch (err) {
      console.error(
        "[competitor-monitor] target failed",
        target.id,
        err instanceof Error ? err.message : err
      );
      result.failed += 1;
    }
  }

  console.info("[competitor-monitor] job end", {
    ...result,
    durationMs: Date.now() - startedAt,
  });

  return result;
}
