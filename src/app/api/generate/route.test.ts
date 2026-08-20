import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("server-only", () => ({}));

const requireApiUser = vi.fn();
vi.mock("@/lib/auth/require-api-user", () => ({
  requireApiUser: (...args: unknown[]) => requireApiUser(...args),
}));

const checkRateLimit = vi.fn();
vi.mock("@/lib/redis", () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
}));

const getPlanForUser = vi.fn();
const getCurrentUsagePeriod = vi.fn();
vi.mock("@/lib/db/workspace-stats", () => ({
  getPlanForUser: (...args: unknown[]) => getPlanForUser(...args),
  getCurrentUsagePeriod: (...args: unknown[]) => getCurrentUsagePeriod(...args),
}));

const ensurePersonalWorkspace = vi.fn();
const getAuditByIdForUser = vi.fn();
const tryConsumeUsageQuota = vi.fn();
const releaseUsageQuota = vi.fn();
const saveGeneratedContentForAudit = vi.fn();
vi.mock("@/lib/db/audit-repository", () => ({
  ensurePersonalWorkspace: (...args: unknown[]) => ensurePersonalWorkspace(...args),
  getAuditByIdForUser: (...args: unknown[]) => getAuditByIdForUser(...args),
  tryConsumeUsageQuota: (...args: unknown[]) => tryConsumeUsageQuota(...args),
  releaseUsageQuota: (...args: unknown[]) => releaseUsageQuota(...args),
  saveGeneratedContentForAudit: (...args: unknown[]) =>
    saveGeneratedContentForAudit(...args),
}));

const crawlAndNormalize = vi.fn();
vi.mock("@/lib/firecrawl", () => ({
  crawlAndNormalize: (...args: unknown[]) => crawlAndNormalize(...args),
}));

const generateContent = vi.fn();
const isGeminiConfigured = vi.fn();
const getGeminiModelId = vi.fn(() => "gemini-test");
vi.mock("@/lib/gemini", () => ({
  generateContent: (...args: unknown[]) => generateContent(...args),
  isGeminiConfigured: () => isGeminiConfigured(),
  getGeminiModelId: () => getGeminiModelId(),
}));

vi.mock("@/lib/url-safety", () => ({
  assertSafePublicHttpUrl: vi.fn(async (raw: string) => ({
    ok: true as const,
    href: raw.endsWith("/") ? raw : `${raw}/`,
  })),
}));

import { POST } from "./route";

const PRO_PLAN = {
  planId: "pro" as const,
  displayName: "احترافي",
  auditsPerMonth: 50,
  aiGensPerMonth: 100,
  storesLimit: 5,
  features: {
    aiGenerator: true,
    competitor: true,
    api: false,
    competitorMonitoring: false,
    weeklyMonitoring: false,
    automatedAlerts: false,
  },
};

const PAGE = {
  url: "https://shop.example.com/p/1",
  title: "Tree Runner",
  description: "Breathable sneaker",
  pageType: "product" as const,
  markdown: "# Tree Runner",
  imageCount: 1,
  contentHash: "abc",
  structuredData: {},
  scrapeStatus: "ok" as const,
};

const ARABIC_CONTENT = {
  title: "حذاء يومي مريح للتنقل",
  description:
    "حذاء يومي خفيف ومريح مصنوع لخطوات أطول مع تهوية جيدة ودعم مناسب للقدم طوال اليوم.",
  faq: [
    {
      q: "هل المقاس مطابق للحجم الحقيقي؟",
      a: "نعم، المقاس مطابق لمعظم العملاء مع توصية بطلب المقاس المعتاد.",
    },
  ],
  metaDescription: "حذاء يومي مريح بتهوية ممتازة وشحن سريع داخل المنطقة.",
  adCopy: [
    {
      platform: "Meta / Instagram",
      headline: "راحة طوال اليوم",
      body: "جرّب الحذاء الأخف لروتينك اليومي مع شحن سريع.",
      cta: "تسوّق الآن",
    },
  ],
  source: "gemini" as const,
};

const PAGE_CONTENT = {
  title: "Tree Runner",
  description: "Breathable everyday sneaker for long walks and city days.",
  faq: [],
  metaDescription: "Breathable everyday sneaker for long walks and city days.",
  adCopy: [],
  source: "page" as const,
};

function jsonRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function authedSetup() {
  requireApiUser.mockResolvedValue({
    ok: true,
    user: { id: "user-1", email: "u@example.com" },
  });
  checkRateLimit.mockResolvedValue({ success: true });
  getPlanForUser.mockResolvedValue(PRO_PLAN);
  getCurrentUsagePeriod.mockReturnValue({
    start: "2026-08-01T00:00:00.000Z",
    end: "2026-08-31T23:59:59.000Z",
  });
  ensurePersonalWorkspace.mockResolvedValue("ws-1");
  crawlAndNormalize.mockResolvedValue(PAGE);
  saveGeneratedContentForAudit.mockResolvedValue("gen-1");
  tryConsumeUsageQuota.mockResolvedValue({
    allowed: true,
    used: 1,
    usageEventId: "usage-1",
  });
}

describe("/api/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGeminiModelId.mockReturnValue("gemini-test");
  });

  it("rejects unauthenticated requests without consuming quota", async () => {
    requireApiUser.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "المصادقة مطلوبة." }, { status: 401 }),
    });

    const res = await POST(jsonRequest({ productUrl: "https://shop.example.com/p/1" }));
    expect(res.status).toBe(401);
    expect(tryConsumeUsageQuota).not.toHaveBeenCalled();
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("rejects foreign audit access (IDOR) without consuming quota", async () => {
    await authedSetup();
    getAuditByIdForUser.mockResolvedValue(null);

    const res = await POST(
      jsonRequest({ auditId: "0615dfa0-54f2-4d0b-8398-833f9fc861ce" })
    );
    expect(res.status).toBe(404);
    expect(tryConsumeUsageQuota).not.toHaveBeenCalled();
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("rejects locked plans without consuming quota", async () => {
    await authedSetup();
    getPlanForUser.mockResolvedValue({
      ...PRO_PLAN,
      planId: "free",
      displayName: "مجاني",
      aiGensPerMonth: 0,
      features: {
        aiGenerator: false,
        competitor: false,
        api: false,
        competitorMonitoring: false,
        weeklyMonitoring: false,
        automatedAlerts: false,
      },
    });

    const res = await POST(jsonRequest({ productUrl: "https://shop.example.com/p/1" }));
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.code).toBe("AI_GENERATOR_LOCKED");
    expect(tryConsumeUsageQuota).not.toHaveBeenCalled();
  });

  it("consumes exactly one AI quota on successful Gemini generation", async () => {
    await authedSetup();
    isGeminiConfigured.mockReturnValue(true);
    generateContent.mockResolvedValue({
      ok: true,
      content: ARABIC_CONTENT,
      source: "gemini",
      tokensUsed: 120,
    });

    const res = await POST(jsonRequest({ productUrl: "https://shop.example.com/p/1" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.source).toBe("gemini");
    expect(body.demoMode).toBe(false);
    expect(body.content.title).toMatch(/[\u0600-\u06FF]/);
    expect(tryConsumeUsageQuota).toHaveBeenCalledTimes(1);
    expect(releaseUsageQuota).not.toHaveBeenCalled();
    expect(saveGeneratedContentForAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-test",
        status: "completed",
      })
    );
  });

  it("does not consume AI quota when Gemini fails", async () => {
    await authedSetup();
    isGeminiConfigured.mockReturnValue(true);
    generateContent.mockResolvedValue({
      ok: false,
      code: "GEMINI_FAILED",
      error: "فشل توليد المحتوى بالذكاء الاصطناعي. حاول مرة أخرى.",
    });

    const res = await POST(jsonRequest({ productUrl: "https://shop.example.com/p/1" }));
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.code).toBe("GEMINI_FAILED");
    expect(tryConsumeUsageQuota).not.toHaveBeenCalled();
    expect(releaseUsageQuota).not.toHaveBeenCalled();
    expect(saveGeneratedContentForAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        model: "gemini-test",
      })
    );
  });

  it("never stores page fallback as a successful Gemini generation when Gemini is configured", async () => {
    await authedSetup();
    isGeminiConfigured.mockReturnValue(true);
    // Defensive path: generateContent must not return page while configured,
    // but if it did, the route must not treat it as AI success / burn quota.
    generateContent.mockResolvedValue({
      ok: true,
      content: PAGE_CONTENT,
      source: "page",
      tokensUsed: null,
    });

    const res = await POST(jsonRequest({ productUrl: "https://shop.example.com/p/1" }));
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.code).toBe("GEMINI_FAILED");
    expect(tryConsumeUsageQuota).not.toHaveBeenCalled();
    expect(saveGeneratedContentForAudit).not.toHaveBeenCalledWith(
      expect.objectContaining({ model: "gemini-test", status: "completed" })
    );
  });

  it("allows explicit page fallback without AI quota when Gemini is not configured", async () => {
    await authedSetup();
    isGeminiConfigured.mockReturnValue(false);
    generateContent.mockResolvedValue({
      ok: true,
      content: PAGE_CONTENT,
      source: "page",
      tokensUsed: null,
    });

    const res = await POST(jsonRequest({ productUrl: "https://shop.example.com/p/1" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.source).toBe("page");
    expect(body.demoMode).toBe(true);
    expect(tryConsumeUsageQuota).not.toHaveBeenCalled();
    expect(saveGeneratedContentForAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "page",
        status: "completed",
      })
    );
  });
});
