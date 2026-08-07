import type { AutomationJobId } from "./types";
import { AUTOMATION_JOB_IDS } from "./types";

/** Loose env map so tests can pass partial objects. */
export type AutomationEnv = Record<string, string | undefined>;

/**
 * Master switch for the automation engine.
 * Production jobs must remain OFF until operators set AUTOMATION_ENABLED=true
 * and activate per-job schedules intentionally.
 */
export function isAutomationEnabled(
  env: AutomationEnv = process.env
): boolean {
  return env.AUTOMATION_ENABLED?.trim().toLowerCase() === "true";
}

/**
 * When true (default), handlers that are wired may short-circuit without
 * side effects. Explicit AUTOMATION_DRY_RUN=false is required for live runs
 * even after the master switch is on.
 */
export function isAutomationDryRun(env: AutomationEnv = process.env): boolean {
  const raw = env.AUTOMATION_DRY_RUN?.trim().toLowerCase();
  if (raw === "false" || raw === "0") return false;
  // Default dry-run when unset — safest for infrastructure rollout.
  return true;
}

function jobEnvKey(jobId: AutomationJobId): string {
  return `AUTOMATION_JOB_${jobId.toUpperCase()}`;
}

/**
 * Per-job enablement. Requires the master switch first.
 * Optional override: AUTOMATION_JOB_<ID>=true|false
 * When unset, job is considered enabled only if the master switch is on
 * (still subject to dry-run).
 */
export function isAutomationJobEnabled(
  jobId: AutomationJobId,
  env: AutomationEnv = process.env
): boolean {
  if (!isAutomationEnabled(env)) return false;
  const raw = env[jobEnvKey(jobId)]?.trim().toLowerCase();
  if (raw === "false" || raw === "0") return false;
  if (raw === "true" || raw === "1") return true;
  return true;
}

export function listEnabledAutomationJobs(
  env: AutomationEnv = process.env
): AutomationJobId[] {
  return AUTOMATION_JOB_IDS.filter((id) => isAutomationJobEnabled(id, env));
}

export function automationConfigSnapshot(env: AutomationEnv = process.env): {
  enabled: boolean;
  dryRun: boolean;
  enabledJobs: AutomationJobId[];
} {
  return {
    enabled: isAutomationEnabled(env),
    dryRun: isAutomationDryRun(env),
    enabledJobs: listEnabledAutomationJobs(env),
  };
}
