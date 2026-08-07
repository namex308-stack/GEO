import { describe, expect, it } from "vitest";
import type { AuditData } from "@/lib/types";
import { buildWeeklyReportPayload } from "./build";
import { renderWeeklyReportEmailHtml } from "./email-template";

function minimalAudit(): AuditData {
  return {
    productUrl: "https://shop.example/p/1",
    storeName: "متجر النور",
    productName: "منتج",
    overallScore: 70,
    breakdown: [
      { pillar: "conversion", score: 65, max: 100, label: "conversion", summary: "" },
      { pillar: "seo", score: 60, max: 100, label: "seo", summary: "" },
      { pillar: "geo", score: 55, max: 100, label: "geo", summary: "" },
      { pillar: "trust", score: 80, max: 100, label: "trust", summary: "" },
    ],
    recommendations: [],
    geoReadability: { chatgpt: 50, perplexity: 50, googleAI: 50 },
    createdAt: new Date().toISOString(),
  };
}

describe("weekly-report email template", () => {
  it("renders RTL Arabic HTML with all report sections", () => {
    const payload = buildWeeklyReportPayload({
      storeId: "s1",
      storeName: "متجر النور",
      storeUrl: "https://shop.example",
      workspaceId: "w1",
      periodStart: "2026-08-01T00:00:00.000Z",
      periodEnd: "2026-08-07T23:59:59.999Z",
      latest: minimalAudit(),
      previous: { ...minimalAudit(), overallScore: 60 },
      latestAuditId: "a2",
      previousAuditId: "a1",
    });

    const html = renderWeeklyReportEmailHtml(payload, "11111111-1111-1111-1111-111111111111");

    expect(html).toContain('dir="rtl"');
    expect(html).toContain("الملخص التنفيذي");
    expect(html).toContain("تغيّر الدرجات");
    expect(html).toContain("GEO");
    expect(html).toContain("SEO");
    expect(html).toContain("الثقة");
    expect(html).toContain("التحويل");
    expect(html).toContain("مشاكل جديدة");
    expect(html).toContain("مشاكل تم حلها");
    expect(html).toContain("أعلى أولويات العمل");
    expect(html).toContain("ملخص AI التنفيذي");
    expect(html).toContain("/reports/weekly/11111111-1111-1111-1111-111111111111");
    expect(html).toContain("متجر النور");
  });
});
