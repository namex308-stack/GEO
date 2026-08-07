import {
  isAutomationDryRun,
  isAutomationEnabled,
  isAutomationJobEnabled,
  type AutomationEnv,
} from "./config";
import { buildIdempotencyKey, shouldSkipForIdempotency } from "./idempotency";
import type { IdempotencyStore } from "./idempotency";
import { createAutomationLogger, createRunId } from "./logging";
import { DEFAULT_RETRY_POLICY, withRetry } from "./retry";
import type {
  AutomationJobContext,
  AutomationJobHandler,
  AutomationJobId,
  AutomationJobResult,
  AutomationJobStatus,
  AutomationTriggerSource,
  RetryPolicy,
} from "./types";

export type RunAutomationJobInput = {
  jobId: AutomationJobId;
  handler: AutomationJobHandler;
  source?: AutomationTriggerSource;
  triggeredAt?: Date;
  runId?: string;
  idempotencyKey?: string;
  dryRun?: boolean;
  env?: AutomationEnv;
  idempotencyStore?: IdempotencyStore;
  retryPolicy?: Partial<RetryPolicy>;
  /** Injectable sleep for retry backoff in tests. */
  sleep?: (ms: number) => Promise<void>;
  consoleMirror?: boolean;
  /** Force-run even when master switch is off (unit tests / local harness). */
  ignoreEnablementGate?: boolean;
};

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Execute one automation job with enablement gates, idempotency, retry, and logging.
 * Does not schedule anything — callers (adapters / HTTP) decide when to invoke.
 */
export async function runAutomationJob(
  input: RunAutomationJobInput
): Promise<AutomationJobResult> {
  const env = input.env ?? process.env;
  const triggeredAt = input.triggeredAt ?? new Date();
  const runId = input.runId ?? createRunId();
  const source = input.source ?? "manual";
  const idempotencyKey =
    input.idempotencyKey ?? buildIdempotencyKey(input.jobId, triggeredAt);
  const dryRun = input.dryRun ?? isAutomationDryRun(env);

  const logger = createAutomationLogger({
    jobId: input.jobId,
    runId,
    consoleMirror: input.consoleMirror,
  });

  const startedAtDate = new Date();
  const startedAt = startedAtDate.toISOString();
  let attempts = 0;

  const finish = (
    status: AutomationJobStatus,
    extra: { data?: unknown; error?: string } = {}
  ): AutomationJobResult => {
    const finishedAtDate = new Date();
    return {
      jobId: input.jobId,
      runId,
      status,
      attempts,
      startedAt,
      finishedAt: finishedAtDate.toISOString(),
      durationMs: finishedAtDate.getTime() - startedAtDate.getTime(),
      idempotencyKey,
      data: extra.data,
      error: extra.error,
      logs: logger.entries,
    };
  };

  logger.info("job.start", {
    source,
    dryRun,
    idempotencyKey,
    automationEnabled: isAutomationEnabled(env),
  });

  if (
    !input.ignoreEnablementGate &&
    (!isAutomationEnabled(env) || !isAutomationJobEnabled(input.jobId, env))
  ) {
    logger.info("job.skipped_disabled", {
      reason: "automation_master_or_job_disabled",
    });
    return finish("skipped_disabled");
  }

  if (input.idempotencyStore) {
    const existing = await input.idempotencyStore.get(idempotencyKey);
    if (shouldSkipForIdempotency(existing)) {
      logger.info("job.skipped_idempotent", {
        previousStatus: existing?.status,
        previousCompletedAt: existing?.completedAt,
      });
      return finish("skipped_idempotent", {
        data: { previous: existing },
      });
    }
  }

  const ctx: AutomationJobContext = {
    jobId: input.jobId,
    runId,
    triggeredAt,
    source,
    idempotencyKey,
    dryRun,
  };

  if (dryRun) {
    attempts = 1;
    logger.info("job.dry_run", { message: "Handler not invoked (dry-run)." });
    const result = finish("skipped_dry_run", {
      data: { dryRun: true },
    });
    await input.idempotencyStore?.set({
      key: idempotencyKey,
      jobId: input.jobId,
      completedAt: result.finishedAt,
      status: "skipped_dry_run",
    });
    return result;
  }

  try {
    const handlerResult = await withRetry(
      async (attempt) => {
        attempts = attempt;
        logger.info("job.attempt", { attempt });
        return input.handler(ctx);
      },
      {
        policy: { ...DEFAULT_RETRY_POLICY, ...input.retryPolicy },
        sleep: input.sleep,
        onAttemptFailure: ({ attempt, error, delayMs }) => {
          logger.warn("job.attempt_failed", {
            attempt,
            delayMs,
            error: errorMessage(error),
          });
        },
      }
    );

    const message = handlerResult.message ?? "";
    if (message === "not_implemented") {
      logger.info("job.not_implemented");
      const result = finish("not_implemented", { data: handlerResult.data });
      await input.idempotencyStore?.set({
        key: idempotencyKey,
        jobId: input.jobId,
        completedAt: result.finishedAt,
        status: "not_implemented",
      });
      return result;
    }

    logger.info("job.succeeded", {
      dataKeys:
        handlerResult.data && typeof handlerResult.data === "object"
          ? Object.keys(handlerResult.data as object)
          : [],
    });
    const result = finish("succeeded", { data: handlerResult.data });
    await input.idempotencyStore?.set({
      key: idempotencyKey,
      jobId: input.jobId,
      completedAt: result.finishedAt,
      status: "succeeded",
    });
    return result;
  } catch (error) {
    const msg = errorMessage(error);
    logger.error("job.failed", { error: msg });
    const result = finish("failed", { error: msg });
    await input.idempotencyStore?.set({
      key: idempotencyKey,
      jobId: input.jobId,
      completedAt: result.finishedAt,
      status: "failed",
    });
    return result;
  }
}
