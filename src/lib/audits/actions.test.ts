import { describe, expect, it } from "vitest";
import { canRetryAuditStatus } from "./actions";

describe("canRetryAuditStatus", () => {
  it("allows retry for completed and failed audits", () => {
    expect(canRetryAuditStatus("completed")).toBe(true);
    expect(canRetryAuditStatus("failed")).toBe(true);
  });

  it("blocks retry while an audit is in progress", () => {
    expect(canRetryAuditStatus("queued")).toBe(false);
    expect(canRetryAuditStatus("scraping")).toBe(false);
    expect(canRetryAuditStatus("analyzing")).toBe(false);
  });
});
