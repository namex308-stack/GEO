import { describe, expect, it } from "vitest";
import {
  isWeeklyReportDue,
  shouldSendWeeklyReportEmail,
  shouldSkipWeeklyReportRegeneration,
  WEEKLY_REPORT_INTERVAL_MS,
} from "./cadence";

describe("isWeeklyReportDue", () => {
  const now = new Date("2026-08-10T12:00:00.000Z");

  it("is due when never generated", () => {
    expect(isWeeklyReportDue(null, now)).toBe(true);
  });

  it("is not due within the interval", () => {
    const last = new Date(now.getTime() - WEEKLY_REPORT_INTERVAL_MS + 60_000);
    expect(isWeeklyReportDue(last.toISOString(), now)).toBe(false);
  });

  it("is due after the interval", () => {
    const last = new Date(now.getTime() - WEEKLY_REPORT_INTERVAL_MS);
    expect(isWeeklyReportDue(last.toISOString(), now)).toBe(true);
  });

  it("treats invalid timestamps as due", () => {
    expect(isWeeklyReportDue("not-a-date", now)).toBe(true);
  });
});

describe("shouldSkipWeeklyReportRegeneration", () => {
  it("does not skip when no existing report", () => {
    expect(
      shouldSkipWeeklyReportRegeneration({
        existing: null,
        latestAuditId: "a1",
      })
    ).toBe(false);
  });

  it("skips ready report for the same audit", () => {
    expect(
      shouldSkipWeeklyReportRegeneration({
        existing: { status: "ready", latestAuditId: "a1" },
        latestAuditId: "a1",
      })
    ).toBe(true);
  });

  it("regenerates when latest audit changed", () => {
    expect(
      shouldSkipWeeklyReportRegeneration({
        existing: { status: "ready", latestAuditId: "a1" },
        latestAuditId: "a2",
      })
    ).toBe(false);
  });

  it("regenerates failed reports", () => {
    expect(
      shouldSkipWeeklyReportRegeneration({
        existing: { status: "failed", latestAuditId: "a1" },
        latestAuditId: "a1",
      })
    ).toBe(false);
  });
});

describe("shouldSendWeeklyReportEmail", () => {
  it("sends when never emailed", () => {
    expect(shouldSendWeeklyReportEmail(null)).toBe(true);
    expect(shouldSendWeeklyReportEmail(undefined)).toBe(true);
  });

  it("skips when already emailed", () => {
    expect(shouldSendWeeklyReportEmail("2026-08-03T06:00:00.000Z")).toBe(false);
  });
});
