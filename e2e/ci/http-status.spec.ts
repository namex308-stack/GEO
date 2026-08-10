import { expect, test } from "@playwright/test";

/**
 * Soft-200 SEO guards — document responses must use real HTTP semantics.
 * Private soft-200 UI (client API miss) is out of scope here; those routes are noindex.
 */
test.describe("CI — HTTP status / soft-200 SEO", () => {
  test("unknown public path returns 404", async ({ request }) => {
    const res = await request.get("/this-page-does-not-exist-xyz", {
      maxRedirects: 0,
    });
    expect(res.status()).toBe(404);
  });

  test("unknown blog slug returns 404 (not soft-200)", async ({ request }) => {
    const res = await request.get("/blog/not-a-real-post-slug", {
      maxRedirects: 0,
    });
    expect(res.status()).toBe(404);
  });

  test("legacy /login returns 404 (auth lives at /auth)", async ({ request }) => {
    const res = await request.get("/login", { maxRedirects: 0 });
    expect(res.status()).toBe(404);
  });

  test("valid public pages return 200", async ({ request }) => {
    for (const path of ["/", "/pricing", "/blog", "/blog/geo-ai-visibility-guide"]) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), path).toBe(200);
    }
  });

  test("unauthenticated private app route redirects (not 200 shell)", async ({
    request,
  }) => {
    const res = await request.get("/dashboard", { maxRedirects: 0 });
    expect([301, 302, 303, 307, 308]).toContain(res.status());
    const location = res.headers().location ?? "";
    expect(location).toMatch(/\/auth/);
  });
});
