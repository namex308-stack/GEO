import { describe, expect, it } from "vitest";
import {
  buildScoreTrend,
  filterTrendByMonths,
  labelTrendPoints,
} from "@/lib/dashboard/trend";

describe("buildScoreTrend", () => {
  it("orders oldest to newest and keeps scores", () => {
    const trend = buildScoreTrend(
      [
        {
          overallScore: 90,
          completedAt: "2026-08-05T12:00:00.000Z",
          createdAt: "2026-08-05T11:00:00.000Z",
        },
        {
          overallScore: 80,
          completedAt: "2026-08-01T12:00:00.000Z",
          createdAt: "2026-08-01T11:00:00.000Z",
        },
      ],
      { locale: "ar" }
    );
    expect(trend.map((p) => p.score)).toEqual([80, 90]);
  });

  it("disambiguates same-day labels with time", () => {
    const labeled = labelTrendPoints(
      [
        { score: 87, date: "2026-08-03T08:00:00.000Z" },
        { score: 92, date: "2026-08-03T14:30:00.000Z" },
        { score: 91, date: "2026-08-03T18:00:00.000Z" },
      ],
      "ar"
    );
    const labels = labeled.map((p) => p.label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels.every((l) => /\d/.test(l))).toBe(true);
  });
});

describe("filterTrendByMonths", () => {
  it("keeps points inside the selected window", () => {
    const now = Date.now();
    const trend = [
      {
        label: "old",
        score: 50,
        date: new Date(now - 200 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        label: "recent",
        score: 90,
        date: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        label: "latest",
        score: 95,
        date: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    const filtered = filterTrendByMonths(trend, 3);
    expect(filtered.map((p) => p.label)).toEqual(["recent", "latest"]);
  });
});
