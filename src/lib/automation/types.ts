/**
 * Automation engine types.
 * Infrastructure only — production schedules are not activated by this module.
 */

export const AUTOMATION_JOB_IDS = [
  "weekly_scan",
  "monthly_scan",
  "competitor_monitoring",
  "health_updates",
  "weekly_reports",
  "ai_alerts",
] as const;

export type AutomationJobId = (typeof AUTOMATION_JOB_IDS)[number];

export type AutomationTriggerSource =
  | "vercel_cron"
  | "supabase_cron"
  | "background_worker"
  | "manual"
  | "test";

export type AutomationJobStatus =
  | "succeeded"
  | "failed"
  | "skipped_disabled"
  | "skipped_idempotent"
  | "skipped_dry_run"
  | "not_implemented";

/** Cron expression in UTC (5-field). */
export type CronSchedule = string;

export type AutomationAdapterKind = "vercel" | "supabase" | "worker";

export type AutomationJobDefinition = {
  id: AutomationJobId;
  /** Stable English key for logs / env overrides. */
  name: string;
  description: string;
  /** Intended UTC cron schedule when activated. */
  schedule: CronSchedule;
  /** Cadence label for idempotency windows. */
  cadence: "hourly" | "daily" | "weekly" | "monthly";
  /** Which trigger adapters may host this job once activated. */
  adapters: readonly AutomationAdapterKind[];
  /** HTTP path used by the Vercel/Supabase HTTP trigger (relative to app origin). */
  httpPath: string;
  /**
   * When false, the catalog entry is infrastructure-only and must never be
   * written into vercel.json / pg_cron until explicitly activated.
   */
  productionActivated: boolean;
};

export type AutomationJobContext = {
  jobId: AutomationJobId;
  runId: string;
  triggeredAt: Date;
  source: AutomationTriggerSource;
  /** Optional override; otherwise derived from job cadence + triggeredAt. */
  idempotencyKey?: string;
  dryRun?: boolean;
};

export type AutomationJobResult = {
  jobId: AutomationJobId;
  runId: string;
  status: AutomationJobStatus;
  attempts: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  idempotencyKey: string;
  /** Domain payload from the handler (counts, ids, etc.). */
  data?: unknown;
  error?: string;
  logs: AutomationLogEntry[];
};

export type AutomationLogLevel = "debug" | "info" | "warn" | "error";

export type AutomationLogEntry = {
  at: string;
  level: AutomationLogLevel;
  event: string;
  jobId: AutomationJobId;
  runId: string;
  attempt?: number;
  detail?: Record<string, unknown>;
};

export type AutomationJobHandler = (
  ctx: AutomationJobContext
) => Promise<{ data?: unknown; message?: string }>;

export type RetryPolicy = {
  maxAttempts: number;
  /** Initial delay before 2nd attempt. */
  baseDelayMs: number;
  maxDelayMs: number;
  /** Multiplier applied each attempt (exponential). */
  factor: number;
  /** When true, add up to 20% jitter on delays. */
  jitter: boolean;
};

export type WorkerJobMessage = {
  type: "automation.job";
  jobId: AutomationJobId;
  runId: string;
  idempotencyKey: string;
  triggeredAt: string;
  source: AutomationTriggerSource;
  dryRun: boolean;
};

export type VercelCronEntry = {
  path: string;
  schedule: CronSchedule;
  jobId: AutomationJobId;
};

export type SupabaseCronSpec = {
  jobId: AutomationJobId;
  /** Suggested pg_cron job name (inactive until applied). */
  cronName: string;
  schedule: CronSchedule;
  /** HTTP invoke URL path (app origin appended by operator). */
  httpPath: string;
  /** Example SQL — not applied by this package. */
  exampleSql: string;
};
