import { describe, expect, it, vi } from "vitest";
import {
  computeRetryDelayMs,
  DEFAULT_RETRY_POLICY,
  withRetry,
} from "./retry";

describe("computeRetryDelayMs", () => {
  it("grows exponentially and caps at maxDelayMs", () => {
    const policy = {
      ...DEFAULT_RETRY_POLICY,
      baseDelayMs: 100,
      factor: 2,
      maxDelayMs: 500,
      jitter: false,
    };
    expect(computeRetryDelayMs(1, policy)).toBe(100);
    expect(computeRetryDelayMs(2, policy)).toBe(200);
    expect(computeRetryDelayMs(3, policy)).toBe(400);
    expect(computeRetryDelayMs(4, policy)).toBe(500);
  });

  it("applies jitter when enabled", () => {
    const policy = {
      ...DEFAULT_RETRY_POLICY,
      baseDelayMs: 1000,
      factor: 2,
      maxDelayMs: 10_000,
      jitter: true,
    };
    const delay = computeRetryDelayMs(1, policy, () => 1); // +10%
    expect(delay).toBe(1100);
  });
});

describe("withRetry", () => {
  it("returns on first success", async () => {
    const fn = vi.fn(async () => "ok");
    await expect(withRetry(fn, { sleep: async () => undefined })).resolves.toBe(
      "ok"
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries then succeeds", async () => {
    const sleeps: number[] = [];
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("done");

    const result = await withRetry(fn, {
      policy: { maxAttempts: 3, baseDelayMs: 10, jitter: false },
      sleep: async (ms) => {
        sleeps.push(ms);
      },
      random: () => 0.5,
    });

    expect(result).toBe("done");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(sleeps).toEqual([10]);
  });

  it("stops when shouldRetry returns false", async () => {
    const fn = vi.fn(async () => {
      throw new Error("fatal");
    });
    await expect(
      withRetry(fn, {
        policy: { maxAttempts: 5, jitter: false },
        sleep: async () => undefined,
        shouldRetry: () => false,
      })
    ).rejects.toThrow("fatal");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("exhausts attempts and rethrows", async () => {
    const fn = vi.fn(async () => {
      throw new Error("always");
    });
    await expect(
      withRetry(fn, {
        policy: { maxAttempts: 3, baseDelayMs: 1, jitter: false },
        sleep: async () => undefined,
      })
    ).rejects.toThrow("always");
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
