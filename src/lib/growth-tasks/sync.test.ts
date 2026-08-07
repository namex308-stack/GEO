import { describe, expect, it } from "vitest";
import type { Recommendation } from "@/lib/types";
import { buildTasksFromRecommendations } from "@/lib/report/growth-roadmap";
import { groupTasksByHorizon, planGrowthTaskSync } from "./sync";
import type { GrowthTaskRecord } from "./types";

function rec(
  partial: Partial<Recommendation> & Pick<Recommendation, "id" | "problem">
): Recommendation {
  return {
    pillar: "conversion",
    severity: "critical",
    impact: "high",
    effort: "quick",
    solution: "نفّذ الإصلاح المطلوب فوراً.",
    ...partial,
  };
}

function existing(
  partial: Partial<GrowthTaskRecord> &
    Pick<GrowthTaskRecord, "id" | "fingerprint" | "title" | "status">
): GrowthTaskRecord {
  return {
    workspaceId: "w1",
    storeId: null,
    externalKey: partial.fingerprint,
    category: "conversion",
    priority: "p1",
    difficulty: "easy",
    estimatedTime: "١٥–٤٥ دقيقة",
    expectedBusinessImpact: "أثر عالٍ",
    horizon: "today",
    suggestedOrder: 1,
    completedAt: null,
    completionSource: null,
    sourceAuditId: "audit-1",
    resolvedAuditId: null,
    recommendationProblem: "problem",
    recommendationSolution: "solution",
    severity: "critical",
    impact: "high",
    effort: "quick",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

describe("buildTasksFromRecommendations (shared engine)", () => {
  it("transforms every recommendation into a task with required fields", () => {
    const drafts = buildTasksFromRecommendations([
      rec({ id: "r1", problem: "زر الشراء غير واضح", effort: "quick" }),
      rec({
        id: "r2",
        problem: "نقص Schema",
        pillar: "geo",
        severity: "warning",
        impact: "medium",
        effort: "medium",
        solution: "أضف Product JSON-LD.",
      }),
    ]);

    expect(drafts).toHaveLength(2);
    for (const d of drafts) {
      expect(d.title).toBeTruthy();
      expect(d.category).toBeTruthy();
      expect(d.priority).toMatch(/^p[123]$/);
      expect(d.difficulty).toMatch(/^(easy|medium|hard)$/);
      expect(d.estimatedTime).toBeTruthy();
      expect(d.expectedBusinessImpact).toBeTruthy();
      expect(d.suggestedOrder).toBeGreaterThan(0);
      expect(["today", "week", "month", "longterm"]).toContain(d.horizon);
      expect(d.fingerprint).toBeTruthy();
    }
  });
});

describe("planGrowthTaskSync", () => {
  it("creates open tasks for new recommendations", () => {
    const plan = planGrowthTaskSync({
      recommendations: [
        rec({ id: "r1", problem: "مشكلة جديدة للثقة", pillar: "trust" }),
      ],
      existing: [],
      auditId: "audit-2",
    });

    expect(plan.upserts).toHaveLength(1);
    expect(plan.upserts[0]!.status).toBe("open");
    expect(plan.upserts[0]!.sourceAuditId).toBe("audit-2");
    expect(plan.autoResolvedFingerprints).toHaveLength(0);
  });

  it("auto-resolves open tasks when the issue disappears after re-analysis", () => {
    const prevFp = "مشكلة اختفت";
    const plan = planGrowthTaskSync({
      recommendations: [
        rec({ id: "r2", problem: "مشكلة جديدة مختلفة" }),
      ],
      existing: [
        existing({
          id: "t1",
          fingerprint: prevFp,
          title: "أصلح المشكلة القديمة",
          status: "open",
          recommendationProblem: prevFp,
        }),
      ],
      auditId: "audit-3",
      now: "2026-08-07T12:00:00.000Z",
    });

    expect(plan.autoResolvedFingerprints).toContain(prevFp);
    const resolved = plan.upserts.find((u) => u.fingerprint === prevFp);
    expect(resolved?.status).toBe("auto_resolved");
    expect(resolved?.completionSource).toBe("reanalysis");
    expect(resolved?.completedAt).toBe("2026-08-07T12:00:00.000Z");
    expect(resolved?.resolvedAuditId).toBe("audit-3");
  });

  it("preserves user-done tasks and reopens auto_resolved when issue returns", () => {
    const doneFp = "مشكلة مكتملة يدوياً";
    const autoFp = "مشكلة عادت";
    const plan = planGrowthTaskSync({
      recommendations: [
        rec({ id: "r-done", problem: doneFp }),
        rec({ id: "r-auto", problem: autoFp }),
      ],
      existing: [
        existing({
          id: "t-done",
          fingerprint: doneFp,
          title: "تم يدوياً",
          status: "done",
          completionSource: "user",
          completedAt: "2026-08-01T10:00:00.000Z",
        }),
        existing({
          id: "t-auto",
          fingerprint: autoFp,
          title: "حُلّت سابقاً",
          status: "auto_resolved",
          completionSource: "reanalysis",
          completedAt: "2026-08-02T10:00:00.000Z",
        }),
      ],
      auditId: "audit-4",
    });

    const done = plan.upserts.find((u) => u.fingerprint === doneFp);
    expect(done?.status).toBe("done");
    expect(done?.completionSource).toBe("user");

    const reopened = plan.upserts.find((u) => u.fingerprint === autoFp);
    expect(reopened?.status).toBe("open");
    expect(plan.reopenedFingerprints).toContain(autoFp);
  });
});

describe("groupTasksByHorizon", () => {
  it("groups into today / week / month / longterm", () => {
    const groups = groupTasksByHorizon([
      existing({
        id: "1",
        fingerprint: "a",
        title: "a",
        status: "open",
        horizon: "week",
        suggestedOrder: 2,
      }),
      existing({
        id: "2",
        fingerprint: "b",
        title: "b",
        status: "open",
        horizon: "today",
        suggestedOrder: 1,
      }),
    ]);

    expect(groups.map((g) => g.horizon)).toEqual([
      "today",
      "week",
      "month",
      "longterm",
    ]);
    expect(groups[0]!.tasks).toHaveLength(1);
    expect(groups[0]!.tasks[0]!.fingerprint).toBe("b");
    expect(groups[1]!.tasks).toHaveLength(1);
  });
});
