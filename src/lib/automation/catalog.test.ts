import { describe, expect, it } from "vitest";
import {
  AUTOMATION_JOB_CATALOG,
  getAutomationJobDefinition,
  isAutomationJobId,
  listAutomationJobDefinitions,
  listProductionActivatedJobs,
} from "./catalog";
import { AUTOMATION_JOB_IDS } from "./types";

describe("automation catalog", () => {
  it("covers all six supported job ids", () => {
    expect(AUTOMATION_JOB_IDS).toEqual([
      "weekly_scan",
      "monthly_scan",
      "competitor_monitoring",
      "health_updates",
      "weekly_reports",
      "ai_alerts",
    ]);
    expect(listAutomationJobDefinitions()).toHaveLength(6);
  });

  it("keeps every job production-inactive", () => {
    for (const job of listAutomationJobDefinitions()) {
      expect(job.productionActivated).toBe(false);
      expect(job.httpPath).toBe(`/api/cron/automation/${job.id}`);
      expect(job.adapters).toEqual(
        expect.arrayContaining(["vercel", "supabase", "worker"])
      );
    }
    expect(listProductionActivatedJobs()).toEqual([]);
  });

  it("resolves definitions and validates ids", () => {
    expect(getAutomationJobDefinition("weekly_reports").name).toBe(
      "Weekly Reports"
    );
    expect(isAutomationJobId("weekly_scan")).toBe(true);
    expect(isAutomationJobId("not_a_job")).toBe(false);
    expect(AUTOMATION_JOB_CATALOG.competitor_monitoring.schedule).toBe(
      "0 7 * * *"
    );
  });
});
