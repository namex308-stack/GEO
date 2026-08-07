import type { RetryPolicy } from "./types";

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 250,
  maxDelayMs: 8_000,
  factor: 2,
  jitter: true,
};

export type RetryAttemptFailure = {
  attempt: number;
  error: unknown;
  delayMs: number | null;
};

export type WithRetryOptions = {
  policy?: Partial<RetryPolicy>;
  /** Injectable sleep for tests. */
  sleep?: (ms: number) => Promise<void>;
  /** Return false to stop retrying immediately. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onAttemptFailure?: (info: RetryAttemptFailure) => void;
  /** Injectable RNG for jitter (0..1). */
  random?: () => number;
};

function mergePolicy(partial?: Partial<RetryPolicy>): RetryPolicy {
  return { ...DEFAULT_RETRY_POLICY, ...partial };
}

export function computeRetryDelayMs(
  attempt: number,
  policy: RetryPolicy,
  random: () => number = Math.random
): number {
  // attempt is 1-based for the failed try that just completed.
  const exp = Math.max(0, attempt - 1);
  const raw = policy.baseDelayMs * policy.factor ** exp;
  const capped = Math.min(policy.maxDelayMs, raw);
  if (!policy.jitter) return Math.round(capped);
  const jitterFactor = 1 + (random() * 0.2 - 0.1); // ±10%
  return Math.max(0, Math.round(capped * jitterFactor));
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run `fn` with exponential backoff. Pure control-flow helper — no I/O.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: WithRetryOptions = {}
): Promise<T> {
  const policy = mergePolicy(options.policy);
  const sleep = options.sleep ?? defaultSleep;
  const random = options.random ?? Math.random;
  const shouldRetry = options.shouldRetry ?? (() => true);

  let lastError: unknown;
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      const canRetry =
        attempt < policy.maxAttempts && shouldRetry(error, attempt);
      const delayMs = canRetry
        ? computeRetryDelayMs(attempt, policy, random)
        : null;
      options.onAttemptFailure?.({ attempt, error, delayMs });
      if (!canRetry || delayMs == null) break;
      await sleep(delayMs);
    }
  }
  throw lastError;
}
