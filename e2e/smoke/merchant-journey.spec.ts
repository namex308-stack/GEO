import { expect, test } from "@playwright/test";
import { ensureOnboardingComplete, loginWithPassword } from "../helpers/auth";
import {
  e2eCredentials,
  e2eStoreUrl,
  isE2ESmokeEnabled,
} from "../helpers/env";

/**
 * Local / live smoke — not run in default CI.
 * Requires:
 *   E2E_SMOKE=1
 *   E2E_USER_EMAIL / E2E_USER_PASSWORD
 *   E2E_STORE_URL (public https store)
 * plus working Firecrawl/Gemini (or demo crawl path that still produces a score).
 */
test.describe("Smoke — merchant journey", () => {
  test.beforeEach(() => {
    test.skip(!isE2ESmokeEnabled(), "Set E2E_SMOKE=1 to run live smoke");
    test.skip(!e2eCredentials(), "Set E2E_USER_EMAIL and E2E_USER_PASSWORD");
    test.skip(!e2eStoreUrl(), "Set E2E_STORE_URL to a public store URL");
  });

  test("login → onboarding → audit → report with real score", async ({
    page,
  }) => {
    const storeUrl = e2eStoreUrl()!;

    await loginWithPassword(page);
    await ensureOnboardingComplete(page);

    await page.goto("/audit/new");
    await page.locator("#store").fill(storeUrl);
    await page.getByRole("button", { name: "حلّل متجري" }).click();

    await page.waitForURL(/\/audit\/[^/]+\/scanning/, { timeout: 60_000 });
    const scanningPath = new URL(page.url()).pathname;
    const auditId = scanningPath.split("/")[2];
    expect(auditId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    // Poll the real audit API until completion (no fixture scores).
    await expect
      .poll(
        async () => {
          const res = await page.request.get(`/api/audit/${auditId}`);
          if (!res.ok()) return `http:${res.status()}`;
          const data = (await res.json()) as {
            audit?: { status?: string; overallScore?: number };
            demoMode?: boolean;
          };
          if (data.audit?.status === "failed") return "failed";
          if (data.audit?.status === "completed") {
            return `completed:${data.audit.overallScore}`;
          }
          return data.audit?.status ?? "unknown";
        },
        {
          timeout: 8 * 60_000,
          intervals: [2_000, 3_000, 5_000],
        }
      )
      .toMatch(/^completed:/);

    const finalRes = await page.request.get(`/api/audit/${auditId}`);
    expect(finalRes.ok()).toBeTruthy();
    const final = (await finalRes.json()) as {
      audit: { status: string; overallScore: number; productUrl?: string };
    };
    expect(final.audit.status).toBe("completed");
    expect(typeof final.audit.overallScore).toBe("number");
    expect(final.audit.overallScore).toBeGreaterThanOrEqual(0);
    expect(final.audit.overallScore).toBeLessThanOrEqual(100);

    await page.goto(`/audit/${auditId}/report`);
    await expect(page).toHaveURL(new RegExp(`/audit/${auditId}/report`));
    await expect(page.getByText("تقريرك جاهز", { exact: false })).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByText(new RegExp(`درجة ${final.audit.overallScore} من 100`))
    ).toBeVisible();
  });
});
