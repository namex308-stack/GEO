/**
 * Automation engine — infrastructure only.
 *
 * Production schedules are not activated from this module.
 * Existing `/api/cron/weekly-report` and `/api/cron/competitor-monitor` routes
 * remain independent until operators migrate them behind AUTOMATION_ENABLED.
 */

export {
  AUTOMATION_JOB_CATALOG,
  getAutomationJobDefinition,
  isAutomationJobId,
  listAutomationJobDefinitions,
  listProductionActivatedJobs,
} from "./catalog";
export {
  automationConfigSnapshot,
  isAutomationDryRun,
  isAutomationEnabled,
  isAutomationJobEnabled,
  listEnabledAutomationJobs,
  type AutomationEnv,
} from "./config";
export {
  authorizeCronRequest,
  cronAuthFromHeaders,
  type CronAuthEnv,
  type CronAuthRequest,
} from "./auth";
export {
  buildIdempotencyKey,
  isoWeekKey,
  MemoryIdempotencyStore,
  periodKeyForCadence,
  shouldSkipForIdempotency,
  type IdempotencyRecord,
  type IdempotencyStore,
} from "./idempotency";
export {
  createAutomationLogger,
  createRunId,
  type AutomationLogger,
} from "./logging";
export {
  computeRetryDelayMs,
  DEFAULT_RETRY_POLICY,
  withRetry,
  type WithRetryOptions,
} from "./retry";
export { runAutomationJob, type RunAutomationJobInput } from "./runner";
export {
  buildVercelCronEntries,
  toVercelJsonCrons,
} from "./adapters/vercel";
export {
  buildSupabaseCronSpecs,
  getSupabaseCronSpec,
} from "./adapters/supabase";
export {
  buildWorkerJobMessage,
  parseWorkerJobMessage,
  type BuildWorkerMessageInput,
} from "./adapters/worker";
export {
  AUTOMATION_JOB_IDS,
  type AutomationAdapterKind,
  type AutomationJobContext,
  type AutomationJobDefinition,
  type AutomationJobHandler,
  type AutomationJobId,
  type AutomationJobResult,
  type AutomationJobStatus,
  type AutomationLogEntry,
  type AutomationTriggerSource,
  type CronSchedule,
  type RetryPolicy,
  type SupabaseCronSpec,
  type VercelCronEntry,
  type WorkerJobMessage,
} from "./types";
