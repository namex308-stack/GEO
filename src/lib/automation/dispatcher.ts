import "server-only";

import type { AutomationEnv } from "./config";
import { MemoryIdempotencyStore, type IdempotencyStore } from "./idempotency";
import { getAutomationHandler } from "./handlers";
import { runAutomationJob } from "./runner";
import type {
  AutomationJobId,
  AutomationJobResult,
  AutomationTriggerSource,
} from "./types";

/** Process-local idempotency for a single serverless isolate / worker. */
const defaultStore = new MemoryIdempotencyStore();

export type DispatchAutomationJobInput = {
  jobId: AutomationJobId;
  source: AutomationTriggerSource;
  triggeredAt?: Date;
  runId?: string;
  idempotencyKey?: string;
  dryRun?: boolean;
  idempotencyStore?: IdempotencyStore;
  env?: AutomationEnv;
};

/**
 * Single entry for adapters (Vercel HTTP, Supabase HTTP, workers).
 * Honors AUTOMATION_ENABLED / AUTOMATION_DRY_RUN — safe to expose while inactive.
 */
export async function dispatchAutomationJob(
  input: DispatchAutomationJobInput
): Promise<AutomationJobResult> {
  return runAutomationJob({
    jobId: input.jobId,
    handler: getAutomationHandler(input.jobId),
    source: input.source,
    triggeredAt: input.triggeredAt,
    runId: input.runId,
    idempotencyKey: input.idempotencyKey,
    dryRun: input.dryRun,
    env: input.env,
    idempotencyStore: input.idempotencyStore ?? defaultStore,
  });
}
