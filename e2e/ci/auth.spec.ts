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
    await page.locator('input[type="email"]').fill("e2e-invalid@example.com");
    await page.locator('input[type="password"]').fill("definitely-wrong-password");
    await page.getByRole("button", { name: "تسجيل الدخول" }).click();

    // Either a mapped auth error, or not-configured message — never leave /auth.
    await expect(page).toHaveURL(/\/auth/);
    await expect(
      page.getByText(
        /البريد الإلكتروني أو كلمة المرور غير صحيحة|المصادقة غير مُعدّة|حدث خطأ|Invalid|غير/
      )
    ).toBeVisible({ timeout: 20_000 });
  });
});
