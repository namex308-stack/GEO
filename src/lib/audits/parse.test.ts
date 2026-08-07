import { describe, expect, it } from "vitest";
import {
  mapRecommendationRow,
  parseEffort,
  parseImpact,
  parseSeverity,
  toJsonValue,
} from "./parse";

describe("audits/parse", () => {
  it("coerces severity/impact/effort safely", () => {
    expect(parseSeverity("critical")).toBe("critical");
    expect(parseSeverity("nope")).toBe("opportunity");
    expect(parseImpact("low")).toBe("low");
    expect(parseImpact(null)).toBe("medium");
    expect(parseEffort("quick")).toBe("quick");
    expect(parseEffort("")).toBeUndefined();
  });

  it("maps recommendation rows without unsafe union casts", () => {
    const rec = mapRecommendationRow({
      id: "uuid-1",
      external_key: "seo-schema",
      pillar: "seo",
      severity: "warning",
      impact: "high",
      effort: "medium",
      problem: "لا يوجد schema",
      solution: "أضف Product schema",
      source: "rule_engine",
      fix_type: "manual",
    });
    expect(rec.id).toBe("seo-schema");
    expect(rec.pillar).toBe("seo");
    expect(rec.severity).toBe("warning");
    expect(rec.source).toBe("rule_engine");
  });

  it("serializes audit-like objects to Json-safe values", () => {
    const json = toJsonValue({ a: 1, b: "نص", c: null });
    expect(json).toEqual({ a: 1, b: "نص", c: null });
  });
});
