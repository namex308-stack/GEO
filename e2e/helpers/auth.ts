import type { Page } from "@playwright/test";
import { e2eCredentials, e2eStoreUrl } from "./env";

/** Sign in via the real /auth form (no session bypass). */
export async function loginWithPassword(page: Page): Promise<void> {
  const creds = e2eCredentials();
  if (!creds) {
    throw new Error("E2E_USER_EMAIL and E2E_USER_PASSWORD are required for this step.");
  }

  await page.goto("/auth");
  await page.locator('input[type="email"]').fill(creds.email);
  await page.locator('input[type="password"]').fill(creds.password);
  await page.getByRole("button", { name: "تسجيل الدخول" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
    timeout: 45_000,
  });
}

async function isOnboardingCompleted(page: Page): Promise<boolean> {
  const res = await page.request.get("/api/onboarding");
  if (!res.ok()) return false;
  const data = (await res.json()) as { onboarding?: { completed?: boolean } };
  return Boolean(data.onboarding?.completed);
}

/**
 * Finish onboarding when the account still needs it.
 * Uses E2E_STORE_URL (required when onboarding runs).
 */
export async function ensureOnboardingComplete(page: Page): Promise<void> {
  if (await isOnboardingCompleted(page)) return;

  const storeUrl = e2eStoreUrl();
  if (!storeUrl) {
    throw new Error("E2E_STORE_URL is required to complete onboarding in E2E.");
  }

  await page.goto("/onboarding/business-name");
  await page.waitForURL(/\/onboarding\//, { timeout: 30_000 });

  if (page.url().includes("/onboarding/done")) {
    return;
  }

  // Resume wherever the wizard left off.
  const path = new URL(page.url()).pathname;

  if (path.includes("business-name") || path === "/onboarding") {
    await page.goto("/onboarding/business-name");
    await page.locator("input").first().fill("E2E Merchant");
    await page.getByRole("button", { name: "متابعة" }).click();
    await page.waitForURL(/store-url/, { timeout: 30_000 });
  }

  if (page.url().includes("store-url")) {
    await page.locator('input[type="url"]').fill(storeUrl);
    await page.getByRole("button", { name: "متابعة" }).click();
    await page.waitForURL(/country|platform|competitor|done/, { timeout: 90_000 });
  }

  if (page.url().includes("country")) {
    await page.locator("select").selectOption("EG");
    await page.waitForURL(/platform|competitor|done/, { timeout: 30_000 });
  }

  if (page.url().includes("platform")) {
    const other = page.getByRole("button", { name: "أخرى" });
    if (await other.isVisible()) {
      await other.click();
    } else {
      await page.getByRole("button", { name: "متابعة" }).click();
    }
    await page.waitForURL(/competitor|done/, { timeout: 30_000 });
  }

  if (page.url().includes("competitor")) {
    await page.getByRole("button", { name: /تخطي/ }).click();
    await page.waitForURL(/onboarding\/done|audit\/new|dashboard/, {
      timeout: 60_000,
    });
  }

  // Confirm via API — UI may still be on /done.
  await page.waitForTimeout(500);
  if (!(await isOnboardingCompleted(page))) {
    // Final competitor save with markComplete if still open.
    if (page.url().includes("competitor")) {
      await page.getByRole("button", { name: /تخطي|بناء ملفي/ }).click();
    }
    await expectOnboardingEventually(page);
  }
}

async function expectOnboardingEventually(page: Page): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await isOnboardingCompleted(page)) return;
    await page.waitForTimeout(1_000);
  }
  throw new Error("Onboarding did not complete within timeout.");
}
