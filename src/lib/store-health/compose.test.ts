import { describe, expect, it } from "vitest";
import type { AuditData, Recommendation } from "@/lib/types";
import { composeStoreHealth, computeNextScan } from "./compose";
import { performanceScoreFromCrawlMs } from "./performance";

function rec(
  partial: Partial<Recommendation> & Pick<Recommendation, "id" | "severity" | "problem">
): Recommendation {
  return {
    pillar: "conversion",
    impact: "high",
    solution: "أصلح المشكلة.",
    ...partial,
  };
}

function audit(partial?: Partial<AuditData>): AuditData {
  return {
    id: "audit-1",
    productUrl: "https://shop.example/p/1",
    storeName: "متجر الصحة",
    productName: "منتج",
    overallScore: 62,
    breakdown: [
      { pillar: "seo", score: 70, max: 100, label: "SEO", summary: "عنوان ووصف واضحان." },
      { pillar: "geo", score: 55, max: 100, label: "GEO", summary: "ظهور متوسط في AI." },
      { pillar: "conversion", score: 48, max: 100, label: "Conversion", summary: "CTA غير واضح." },
      { pillar: "trust", score: 80, max: 100, label: "Trust", summary: "سياسات ظاهرة." },
    ],
    recommendations: [
      rec({ id: "c1", severity: "critical", problem: "زر الشراء مخفي." }),
      rec({ id: "w1", severity: "warning", problem: "لا يوجد تقسيط ظاهر." }),
      rec({ id: "o1", severity: "opportunity", problem: "أضف فيديو منتج." }),
    ],
    geoReadability: { chatgpt: 50, perplexity: 50, googleAI: 50 },
    createdAt: "2026-08-01T12:00:00.000Z",
    crawlMetadata: {
      source: "firecrawl",
      scrapeMs: 4000,
      scrapedAt: "2026-08-01T12:00:00.000Z",
    },
    ...partial,
  };
}

describe("store-health compose", () => {
  it("maps crawl timing to a performance proxy without new engine", () => {
    expect(performanceScoreFromCrawlMs(2000)).toBe(95);
    expect(performanceScoreFromCrawlMs(5000)).toBe(80);
    expect(performanceScoreFromCrawlMs(20000)).toBe(45);
    expect(performanceScoreFromCrawlMs(null)).toBeNull();
  });

  it("composes health from stored pillars + performance and splits issues", () => {
    const health = composeStoreHealth({
      audit: audit(),
      crawlDurationMs: 4000,
      completedAudits: [
        {
          overallScore: 50,
          completedAt: "2026-07-20T12:00:00.000Z",
          createdAt: "2026-07-20T12:00:00.000Z",
        },
        {
          overallScore: 62,
          completedAt: "2026-08-01T12:00:00.000Z",
          createdAt: "2026-08-01T12:00:00.000Z",
        },
      ],
      now: new Date("2026-08-02T12:00:00.000Z"),
    });

    expect(health.currentHealth).toBeGreaterThan(0);
    expect(health.healthBand).toBeTruthy();
    expect(health.pillars.map((p) => p.key)).toEqual([
      "seo",
      "geo",
      "conversion",
      "trust",
      "performance",
    ]);
    expect(health.pillars.find((p) => p.key === "performance")?.score).toBe(80);
    expect(health.criticalProblems.map((i) => i.id)).toEqual(["c1"]);
    expect(health.warnings.map((i) => i.id)).toEqual(["w1"]);
    expect(health.healthySignals.some((s) => s.id === "healthy-trust")).toBe(true);
    expect(health.healthySignals.some((s) => s.id === "healthy-seo")).toBe(true);
    expect(health.recommendations.length).toBeGreaterThan(0);
    expect(health.historicalTrend.length).toBe(2);
    expect(health.trend).toBe("up");
    expect(health.lastScan).toBe("2026-08-01T12:00:00.000Z");
    expect(health.nextScan).toBeTruthy();
  });

  it("does not invent scores when no audit exists", () => {
    const health = composeStoreHealth({
      audit: null,
      completedAudits: [],
    });
    expect(health.currentHealth).toBeNull();
    expect(health.criticalProblems).toEqual([]);
    expect(health.historicalTrend).toEqual([]);
  });

  it("computes next-scan recommendation from last scan + 7 days", () => {
    const due = computeNextScan("2026-07-01T00:00:00.000Z", new Date("2026-08-01T00:00:00.000Z"));
    expect(due.label).toContain("الآن");

    const upcoming = computeNextScan(
      "2026-08-01T00:00:00.000Z",
      new Date("2026-08-02T00:00:00.000Z")
    );
    expect(upcoming.at).toBe("2026-08-08T00:00:00.000Z");
  });
});
