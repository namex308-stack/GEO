import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("server-only", () => ({}));

const requireApiUser = vi.fn();
vi.mock("@/lib/auth/require-api-user", () => ({
  requireApiUser: (...args: unknown[]) => requireApiUser(...args),
}));

vi.mock("@/lib/db/onboarding-repository", () => ({
  getOnboardingState: vi.fn(),
  saveOnboardingStep: vi.fn(),
  updateOnboardingAnswers: vi.fn(),
}));

vi.mock("@/lib/onboarding/probe-store", () => ({
  probeStoreUrl: vi.fn(),
}));

import { GET, PATCH } from "./route";
import { saveOnboardingStep } from "@/lib/db/onboarding-repository";

function jsonRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/onboarding", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/onboarding auth", () => {
  beforeEach(() => {
    requireApiUser.mockReset();
    vi.mocked(saveOnboardingStep).mockReset();
  });

  it("rejects unauthenticated GET", async () => {
    requireApiUser.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "المصادقة مطلوبة." }, { status: 401 }),
    });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated PATCH", async () => {
    requireApiUser.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "المصادقة مطلوبة." }, { status: 401 }),
    });
    const res = await PATCH(
      jsonRequest({
        step: 1,
        answers: { businessName: "GlowLab" },
        markComplete: true,
      })
    );
    expect(res.status).toBe(401);
    expect(saveOnboardingStep).not.toHaveBeenCalled();
  });
});
