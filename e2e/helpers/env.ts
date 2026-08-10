/**
 * E2E env helpers — credentials stay outside the repo.
 * Never log secret values.
 */

export function e2eCredentials(): { email: string; password: string } | null {
  const email = process.env.E2E_USER_EMAIL?.trim() ?? "";
  const password = process.env.E2E_USER_PASSWORD?.trim() ?? "";
  if (!email || !password) return null;
  return { email, password };
}

export function e2eStoreUrl(): string | null {
  const url = process.env.E2E_STORE_URL?.trim() ?? "";
  return url || null;
}

/** Live smoke suite (crawl + AI). Off by default. */
export function isE2ESmokeEnabled(): boolean {
  const raw = process.env.E2E_SMOKE?.trim().toLowerCase() ?? "";
  return raw === "1" || raw === "true" || raw === "yes";
}

/** Account is expected to be on free plan (competitor locked). */
export function expectFreePlan(): boolean {
  const raw = process.env.E2E_EXPECT_FREE_PLAN?.trim().toLowerCase() ?? "";
  return raw === "1" || raw === "true" || raw === "yes";
}
