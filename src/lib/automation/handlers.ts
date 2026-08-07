import "server-only";

import { runCompetitorMonitorJob } from "@/lib/competitor-monitor/job";
import { runWeeklyReportJob } from "@/lib/weekly-report/job";
import type {
  AutomationJobContext,
  AutomationJobHandler,
  AutomationJobId,
} from "./types";

/**
 * Stub handler for jobs that do not yet have domain runners.
 * Returns `message: "not_implemented"` so the engine records that status.
 */
async function notImplementedHandler(
  ctx: AutomationJobContext
): Promise<{ data?: unknown; message?: string }> {
  return {
    message: "not_implemented",
    data: {
      jobId: ctx.jobId,
      note: "Infrastructure stub — domain runner not wired yet.",
    },
  };
}

async function weeklyReportsHandler(
  ctx: AutomationJobContext
): Promise<{ data?: unknown; message?: string }> {
  // Dry-run is handled by the runner before invoke; live path wraps existing job.
  const result = await runWeeklyReportJob(ctx.triggeredAt);
  return { data: result };
}

async function competitorMonitoringHandler(
  ctx: AutomationJobContext
): Promise<{ data?: unknown; message?: string }> {
  const result = await runCompetitorMonitorJob(ctx.triggeredAt);
  return { data: result };
}

/**
 * Domain handlers for the automation catalog.
 * Weekly/monthly scan, health updates, and AI alerts remain stubs until
 * dedicated runners exist. Existing jobs are wrapped but only reachable when
 * AUTOMATION_ENABLED=true and AUTOMATION_DRY_RUN=false.
 */
export const AUTOMATION_HANDLERS: Record<
  AutomationJobId,
  AutomationJobHandler
> = {
  weekly_scan: notImplementedHandler,
  monthly_scan: notImplementedHandler,
  competitor_monitoring: competitorMonitoringHandler,
  health_updates: notImplementedHandler,
  weekly_reports: weeklyReportsHandler,
  ai_alerts: notImplementedHandler,
};

export function getAutomationHandler(
  jobId: AutomationJobId
): AutomationJobHandler {
  return AUTOMATION_HANDLERS[jobId];
}
