import { describe, expect, it } from "vitest";
import {
  automationConfigSnapshot,
  isAutomationDryRun,
  isAutomationEnabled,
  isAutomationJobEnabled,
  listEnabledAutomationJobs,
} from "./config";

describe("automation config gates", () => {
  it("defaults to disabled master switch", () => {
    expect(isAutomationEnabled({})).toBe(false);
    expect(isAutomationEnabled({ AUTOMATION_ENABLED: "false" })).toBe(false);
    expect(isAutomationEnabled({ AUTOMATION_ENABLED: "true" })).toBe(true);
  });

  it("defaults dry-run to true unless explicitly disabled", () => {
    expect(isAutomationDryRun({})).toBe(true);
    expect(isAutomationDryRun({ AUTOMATION_DRY_RUN: "true" })).toBe(true);
    expect(isAutomationDryRun({ AUTOMATION_DRY_RUN: "false" })).toBe(false);
  });

  it("requires master switch before per-job enablement", () => {
    expect(
      isAutomationJobEnabled("weekly_scan", {
        AUTOMATION_JOB_WEEKLY_SCAN: "true",
      })
    ).toBe(false);

    expect(
      isAutomationJobEnabled("weekly_scan", {
        AUTOMATION_ENABLED: "true",
      })
    ).toBe(true);

    expect(
      isAutomationJobEnabled("weekly_scan", {
        AUTOMATION_ENABLED: "true",
        AUTOMATION_JOB_WEEKLY_SCAN: "false",
      })
    ).toBe(false);
  });

  it("lists enabled jobs only when master is on", () => {
    expect(listEnabledAutomationJobs({})).toEqual([]);
    const enabled = listEnabledAutomationJobs({ AUTOMATION_ENABLED: "true" });
    expect(enabled).toContain("weekly_reports");
    expect(enabled).toHaveLength(6);
  });

  it("snapshots config for diagnostics", () => {
    expect(
      automationConfigSnapshot({
        AUTOMATION_ENABLED: "true",
        AUTOMATION_DRY_RUN: "false",
        AUTOMATION_JOB_AI_ALERTS: "false",
      })
    ).toEqual({
      enabled: true,
      dryRun: false,
      enabledJobs: [
        "weekly_scan",
        "monthly_scan",
        "competitor_monitoring",
        "health_updates",
        "weekly_reports",
      ],
    });
  });
});
