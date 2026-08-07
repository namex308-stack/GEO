import { describe, expect, it, vi } from "vitest";
import { MemoryIdempotencyStore } from "./idempotency";
import { runAutomationJob } from "./runner";

describe("runAutomationJob", () => {
  it("skips when automation master switch is off", async () => {
    const handler = vi.fn(async () => ({ data: { ran: true } }));
    const result = await runAutomationJob({
      jobId: "weekly_scan",
      handler,
      env: {},
      consoleMirror: false,
    });
    expect(result.status).toBe("skipped_disabled");
    expect(handler).not.toHaveBeenCalled();
  });

  it("short-circuits dry-run without invoking the handler", async () => {
    const handler = vi.fn(async () => ({ data: { ran: true } }));
    const store = new MemoryIdempotencyStore();
    const result = await runAutomationJob({
      jobId: "health_updates",
      handler,
      env: { AUTOMATION_ENABLED: "true" },
      dryRun: true,
      idempotencyStore: store,
      consoleMirror: false,
      triggeredAt: new Date("2026-08-07T08:00:00.000Z"),
    });
    expect(result.status).toBe("skipped_dry_run");
    expect(handler).not.toHaveBeenCalled();
    expect(result.logs.some((l) => l.event === "job.dry_run")).toBe(true);
  });

  it("executes handler with retry and records success", async () => {
    const handler = vi
      .fn()
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValueOnce({ data: { ok: 1 } });

    const result = await runAutomationJob({
      jobId: "ai_alerts",
      handler,
      env: { AUTOMATION_ENABLED: "true", AUTOMATION_DRY_RUN: "false" },
      dryRun: false,
      sleep: async () => undefined,
      retryPolicy: { maxAttempts: 3, baseDelayMs: 1, jitter: false },
      consoleMirror: false,
    });

    expect(result.status).toBe("succeeded");
    expect(result.attempts).toBe(2);
    expect(result.data).toEqual({ ok: 1 });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("maps not_implemented handler message", async () => {
    const result = await runAutomationJob({
      jobId: "monthly_scan",
      handler: async () => ({
        message: "not_implemented",
        data: { stub: true },
      }),
      env: { AUTOMATION_ENABLED: "true", AUTOMATION_DRY_RUN: "false" },
      dryRun: false,
      consoleMirror: false,
    });
    expect(result.status).toBe("not_implemented");
    expect(result.data).toEqual({ stub: true });
  });

  it("skips on idempotent replay after success", async () => {
    const store = new MemoryIdempotencyStore();
    const handler = vi.fn(async () => ({ data: { n: 1 } }));
    const at = new Date("2026-08-07T07:00:00.000Z");

    const first = await runAutomationJob({
      jobId: "competitor_monitoring",
      handler,
      env: { AUTOMATION_ENABLED: "true", AUTOMATION_DRY_RUN: "false" },
      dryRun: false,
      idempotencyStore: store,
      triggeredAt: at,
      consoleMirror: false,
    });
    expect(first.status).toBe("succeeded");

    const second = await runAutomationJob({
      jobId: "competitor_monitoring",
      handler,
      env: { AUTOMATION_ENABLED: "true", AUTOMATION_DRY_RUN: "false" },
      dryRun: false,
      idempotencyStore: store,
      triggeredAt: at,
      consoleMirror: false,
    });
    expect(second.status).toBe("skipped_idempotent");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("returns failed status after retries exhaust", async () => {
    const result = await runAutomationJob({
      jobId: "weekly_reports",
      handler: async () => {
        throw new Error("hard fail");
      },
      env: { AUTOMATION_ENABLED: "true", AUTOMATION_DRY_RUN: "false" },
      dryRun: false,
      sleep: async () => undefined,
      retryPolicy: { maxAttempts: 2, baseDelayMs: 1, jitter: false },
      consoleMirror: false,
    });
    expect(result.status).toBe("failed");
    expect(result.error).toBe("hard fail");
    expect(result.attempts).toBe(2);
  });
});
