import type { AutomationJobDefinition, AutomationJobId } from "./types";
import { AUTOMATION_JOB_IDS } from "./types";

/**
 * Canonical job catalog.
 *
 * `productionActivated: false` for every entry — schedules here are design
 * intent only. Existing Vercel crons for weekly-report / competitor-monitor
 * remain outside this catalog's activation path until operators migrate them.
 */
export const AUTOMATION_JOB_CATALOG: Record<
  AutomationJobId,
  AutomationJobDefinition
> = {
  weekly_scan: {
    id: "weekly_scan",
    name: "Weekly Scan",
    description:
      "Scheduled product/store re-scan cadence (weekly) for active workspaces.",
    schedule: "0 5 * * 1",
    cadence: "weekly",
    adapters: ["vercel", "supabase", "worker"],
    httpPath: "/api/cron/automation/weekly_scan",
    productionActivated: false,
  },
  monthly_scan: {
    id: "monthly_scan",
    name: "Monthly Scan",
    description:
      "Lower-frequency full re-scan for stores that do not need weekly crawls.",
    schedule: "0 4 1 * *",
    cadence: "monthly",
    adapters: ["vercel", "supabase", "worker"],
    httpPath: "/api/cron/automation/monthly_scan",
    productionActivated: false,
  },
  competitor_monitoring: {
    id: "competitor_monitoring",
    name: "Competitor Monitoring",
    description:
      "Due-target competitor crawl/diff cycle (wraps existing monitor job).",
    schedule: "0 7 * * *",
    cadence: "daily",
    adapters: ["vercel", "supabase", "worker"],
    httpPath: "/api/cron/automation/competitor_monitoring",
    productionActivated: false,
  },
  health_updates: {
    id: "health_updates",
    name: "Health Updates",
    description:
      "Refresh store-health derived signals from latest completed audits.",
    schedule: "0 8 * * *",
    cadence: "daily",
    adapters: ["vercel", "supabase", "worker"],
    httpPath: "/api/cron/automation/health_updates",
    productionActivated: false,
  },
  weekly_reports: {
    id: "weekly_reports",
    name: "Weekly Reports",
    description:
      "Generate and optionally email weekly AI reports (wraps existing report job).",
    schedule: "0 6 * * 1",
    cadence: "weekly",
    adapters: ["vercel", "supabase", "worker"],
    httpPath: "/api/cron/automation/weekly_reports",
    productionActivated: false,
  },
  ai_alerts: {
    id: "ai_alerts",
    name: "AI Alerts",
    description:
      "Sweep unread/undelivered alert drafts and fan out notifications.",
    schedule: "0 */6 * * *",
    cadence: "hourly",
    adapters: ["vercel", "supabase", "worker"],
    httpPath: "/api/cron/automation/ai_alerts",
    productionActivated: false,
  },
};

export function getAutomationJobDefinition(
  jobId: AutomationJobId
): AutomationJobDefinition {
  return AUTOMATION_JOB_CATALOG[jobId];
}

export function listAutomationJobDefinitions(): AutomationJobDefinition[] {
  return AUTOMATION_JOB_IDS.map((id) => AUTOMATION_JOB_CATALOG[id]);
}

export function isAutomationJobId(value: string): value is AutomationJobId {
  return (AUTOMATION_JOB_IDS as readonly string[]).includes(value);
}

/**
 * Jobs that may be written into live scheduler configs.
 * Always empty while infrastructure-only rollout is in effect.
 */
export function listProductionActivatedJobs(): AutomationJobDefinition[] {
  return listAutomationJobDefinitions().filter((j) => j.productionActivated);
}
