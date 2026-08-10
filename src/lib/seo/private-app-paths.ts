/**
 * Signed-in / auth surfaces that must stay out of search indexes.
 *
 * Kept as the single source for:
 * - `robots.ts` disallow rules
 * - `PROTECTED_PATHS` / `AUTH_PATHS` in Supabase middleware
 * - `robots: { index: false, follow: false }` via `privatePageMetadata()` on matching layouts
 * - `X-Robots-Tag: noindex, nofollow` on matching paths in `next.config.ts`
 *
 * robots.txt only reduces crawling; the per-segment meta robots tag is what
 * keeps a URL out of the index if it is linked from elsewhere.
 *
 * Notes:
 * - `/settings` covers `/settings/billing` and `/settings/usage` (no top-level `/billing`).
 * - There is no `/ai-studio` route in this app — do not invent disallow paths.
 */
export const PRIVATE_APP_PATHS = [
  "/dashboard",
  "/health",
  "/audit",
  "/history",
  "/reports",
  "/monitor",
  "/geo",
  "/settings",
  "/checkout",
  "/onboarding",
  "/auth",
  "/alerts",
  "/notifications",
  "/tasks",
] as const;

export type PrivateAppPath = (typeof PRIVATE_APP_PATHS)[number];

/** Session-required paths (excludes `/auth` entry). */
export const PROTECTED_APP_PATHS = PRIVATE_APP_PATHS.filter(
  (path): path is Exclude<PrivateAppPath, "/auth"> => path !== "/auth"
);

export const AUTH_APP_PATHS = ["/auth"] as const satisfies readonly PrivateAppPath[];

/**
 * robots.txt disallow list: API JSON + private app prefixes.
 * Public marketing/content (`/`, `/pricing`, `/blog`, …) stays allowed via `Allow: /`.
 */
export const ROBOTS_DISALLOW_PATHS = ["/api/", ...PRIVATE_APP_PATHS] as const;
