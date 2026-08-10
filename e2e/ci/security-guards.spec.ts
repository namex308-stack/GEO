import { expect, test } from "@playwright/test";
import { ensureOnboardingComplete, loginWithPassword } from "../helpers/auth";
import { e2eCredentials, expectFreePlan } from "../helpers/env";

test.describe("CI — API security guards", () => {
  test("unauthorized API access is rejected", async ({ request }) => {
    const res = await request.post("/api/audit", {
      data: { storeUrl: "https://example.com" },
    });
    // 401 when Auth is configured; 503 when Supabase env is missing — both reject.
    expect([401, 503]).toContain(res.status());
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBeTruthy();
  });

  test("private/SSRF URL is rejected for authenticated users", async ({
    page,
  }) => {
    test.skip(!e2eCredentials(), "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");

    await loginWithPassword(page);
    await ensureOnboardingComplete(page);

    const res = await page.request.post("/api/audit", {
      data: { storeUrl: "http://127.0.0.1/" },
    });

    expect(res.status()).toBe(400);
    const body = (await res.json()) as { code?: string; error?: string };
    expect(body.code).toBe("BLOCKED_URL");
    expect(body.error).toBeTruthy();
  });

  test("plan-restricted competitor monitor is rejected for free plans", async ({
    page,
  }) => {
    test.skip(!e2eCredentials(), "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");
    test.skip(
      !expectFreePlan(),
      "Set E2E_EXPECT_FREE_PLAN=1 when the E2E user is on the free plan"
    );

    await loginWithPassword(page);
    await ensureOnboardingComplete(page);

    const res = await page.request.get("/api/competitor-monitor");
    expect(res.status()).toBe(403);
    const body = (await res.json()) as { code?: string };
    expect(body.code).toBe("COMPETITOR_LOCKED");
  });
});
