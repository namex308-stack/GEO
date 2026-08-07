import { describe, expect, it } from "vitest";
import {
  buildIdempotencyKey,
  isoWeekKey,
  MemoryIdempotencyStore,
  periodKeyForCadence,
  shouldSkipForIdempotency,
} from "./idempotency";

describe("periodKeyForCadence", () => {
  const at = new Date("2026-08-07T15:30:00.000Z"); // Friday

  it("formats hourly / daily / monthly keys in UTC", () => {
    expect(periodKeyForCadence("hourly", at)).toBe("2026-08-07T15");
    expect(periodKeyForCadence("daily", at)).toBe("2026-08-07");
    expect(periodKeyForCadence("monthly", at)).toBe("2026-08");
  });

  it("formats weekly ISO week keys", () => {
    expect(periodKeyForCadence("weekly", at)).toBe(isoWeekKey(at));
    expect(isoWeekKey(at)).toMatch(/^2026-W\d{2}$/);
  });
});

describe("buildIdempotencyKey", () => {
  it("namespaces by job id and cadence period", () => {
    const at = new Date("2026-08-07T06:00:00.000Z");
    expect(buildIdempotencyKey("weekly_reports", at)).toBe(
      `automation:weekly_reports:${isoWeekKey(at)}`
    );
    expect(buildIdempotencyKey("competitor_monitoring", at)).toBe(
      "automation:competitor_monitoring:2026-08-07"
    );
  });
});

describe("shouldSkipForIdempotency", () => {
  it("skips succeeded / dry-run / not_implemented", () => {
    expect(
      shouldSkipForIdempotency({
        key: "k",
        jobId: "ai_alerts",
        completedAt: "2026-08-07T00:00:00.000Z",
        status: "succeeded",
      })
    ).toBe(true);
    expect(
      shouldSkipForIdempotency({
        key: "k",
        jobId: "ai_alerts",
        completedAt: "2026-08-07T00:00:00.000Z",
        status: "skipped_dry_run",
      })
    ).toBe(true);
    expect(
      shouldSkipForIdempotency({
        key: "k",
        jobId: "weekly_scan",
        completedAt: "2026-08-07T00:00:00.000Z",
        status: "not_implemented",
      })
    ).toBe(true);
  });

  it("does not skip failed or missing records", () => {
    expect(shouldSkipForIdempotency(null)).toBe(false);
    expect(
      shouldSkipForIdempotency({
        key: "k",
        jobId: "ai_alerts",
        completedAt: "2026-08-07T00:00:00.000Z",
        status: "failed",
      })
    ).toBe(false);
  });
});

describe("MemoryIdempotencyStore", () => {
  it("round-trips records", async () => {
    const store = new MemoryIdempotencyStore();
    await store.set({
      key: "automation:health_updates:2026-08-07",
      jobId: "health_updates",
      completedAt: "2026-08-07T08:00:00.000Z",
      status: "succeeded",
    });
    const got = await store.get("automation:health_updates:2026-08-07");
    expect(got?.status).toBe("succeeded");
    expect(store.size()).toBe(1);
    store.clear();
    expect(store.size()).toBe(0);
  });
});
