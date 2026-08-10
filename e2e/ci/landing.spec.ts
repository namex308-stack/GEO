import { expect, test } from "@playwright/test";

test.describe("CI — landing", () => {
  test("landing page loads", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole("main").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/ConvAudit|تحليل|متجر/i);
  });
});
