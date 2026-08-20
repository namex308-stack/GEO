import { expect, test } from "@playwright/test";

test.describe("CI — authentication flow", () => {
  test("auth page exposes email/password sign-in", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "تسجيل الدخول" })).toBeVisible();
  });

  test("invalid credentials are rejected without creating a session", async ({
    page,
  }) => {
    await page.goto("/auth");
    await expect(page.locator("form[data-hydrated='true']")).toBeVisible({
      timeout: 15_000,
    });
    await page.locator('input[type="email"]').fill("e2e-invalid@example.com");
    await page.locator('input[type="password"]').fill("definitely-wrong-password");
    await page.getByRole("button", { name: "تسجيل الدخول" }).click();

    await expect(page).toHaveURL(/\/auth/);
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 20_000 });
  });
});
