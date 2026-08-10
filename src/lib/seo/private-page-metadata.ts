import type { Metadata } from "next";

/**
 * Canonical robots directive for signed-in / auth application surfaces.
 * Replaces any parent `robots` object entirely (Next resolves per-segment).
 * `googleBot` is set explicitly so a root `googleBot: { index: true }` cannot
 * linger if merge behavior ever changes.
 */
export const PRIVATE_PAGE_ROBOTS = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
} as const satisfies NonNullable<Metadata["robots"]>;

/**
 * Shared metadata for private App Router segment layouts.
 * Pair with `PRIVATE_APP_PATHS` / `robots.ts` disallow — meta is what keeps
 * a linked URL out of the index; robots.txt only reduces crawling.
 */
export function privatePageMetadata(
  extras: Omit<Metadata, "robots"> = {}
): Metadata {
  return {
    ...extras,
    robots: PRIVATE_PAGE_ROBOTS,
  };
}
