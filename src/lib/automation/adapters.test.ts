import { describe, expect, it } from "vitest";
import { buildSupabaseCronSpecs, getSupabaseCronSpec } from "./adapters/supabase";
import {
  buildVercelCronEntries,
  toVercelJsonCrons,
} from "./adapters/vercel";
import {
  buildWorkerJobMessage,
  parseWorkerJobMessage,
} from "./adapters/worker";

describe("vercel adapter", () => {
  it("returns no production entries while inactive", () => {
    expect(buildVercelCronEntries()).toEqual([]);
    expect(toVercelJsonCrons(buildVercelCronEntries())).toEqual([]);
  });

  it("can list inactive entries for planning", () => {
    const entries = buildVercelCronEntries({ includeInactive: true });
    expect(entries).toHaveLength(6);
    expect(entries.map((e) => e.jobId)).toContain("weekly_scan");
    expect(entries.every((e) => e.path.startsWith("/api/cron/automation/"))).toBe(
      true
    );
  });
});

describe("supabase adapter", () => {
  it("returns no production specs while inactive", () => {
    expect(buildSupabaseCronSpecs()).toEqual([]);
  });

  it("builds commented-safe example SQL for inactive jobs", () => {
    const specs = buildSupabaseCronSpecs({
      includeInactive: true,
      appOrigin: "https://example.com",
    });
    expect(specs).toHaveLength(6);
    const weekly = getSupabaseCronSpec("weekly_reports", {
      appOrigin: "https://example.com",
    });
    expect(weekly.cronName).toBe("automation_weekly_reports");
    expect(weekly.exampleSql).toContain("INACTIVE TEMPLATE");
    expect(weekly.exampleSql).toContain(
      "https://example.com/api/cron/automation/weekly_reports"
    );
  });
});

describe("worker adapter", () => {
  it("builds and parses worker envelopes", () => {
    const msg = buildWorkerJobMessage({
      jobId: "ai_alerts",
      triggeredAt: new Date("2026-08-07T12:00:00.000Z"),
      runId: "run_test",
      dryRun: true,
    });
    expect(msg.type).toBe("automation.job");
    expect(msg.jobId).toBe("ai_alerts");
    expect(msg.idempotencyKey).toContain("ai_alerts");
    expect(parseWorkerJobMessage(msg)).toEqual(msg);
    expect(parseWorkerJobMessage({ type: "other" })).toBeNull();
    expect(parseWorkerJobMessage(null)).toBeNull();
  });
});
