import { buildIdempotencyKey } from "../idempotency";
import { createRunId } from "../logging";
import type {
  AutomationJobId,
  AutomationTriggerSource,
  WorkerJobMessage,
} from "../types";

export type BuildWorkerMessageInput = {
  jobId: AutomationJobId;
  triggeredAt?: Date;
  runId?: string;
  idempotencyKey?: string;
  source?: AutomationTriggerSource;
  dryRun?: boolean;
};

/**
 * Envelope for a future background worker / queue consumer.
 * No queue is wired — this only defines the message contract.
 */
export function buildWorkerJobMessage(
  input: BuildWorkerMessageInput
): WorkerJobMessage {
  const triggeredAt = input.triggeredAt ?? new Date();
  return {
    type: "automation.job",
    jobId: input.jobId,
    runId: input.runId ?? createRunId(),
    idempotencyKey:
      input.idempotencyKey ?? buildIdempotencyKey(input.jobId, triggeredAt),
    triggeredAt: triggeredAt.toISOString(),
    source: input.source ?? "background_worker",
    dryRun: input.dryRun ?? true,
  };
}

export function parseWorkerJobMessage(
  raw: unknown
): WorkerJobMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const msg = raw as Partial<WorkerJobMessage>;
  if (msg.type !== "automation.job") return null;
  if (typeof msg.jobId !== "string") return null;
  if (typeof msg.runId !== "string") return null;
  if (typeof msg.idempotencyKey !== "string") return null;
  if (typeof msg.triggeredAt !== "string") return null;
  if (typeof msg.source !== "string") return null;
  if (typeof msg.dryRun !== "boolean") return null;
  return msg as WorkerJobMessage;
}
