import { describe, expect, it } from "vitest";
import {
  PRIVATE_APP_PATHS,
  ROBOTS_DISALLOW_PATHS,
} from "@/lib/seo/private-app-paths";
import { ROUTES } from "@/lib/routes";
import { BLOG_SLUGS } from "@/lib/blog-posts";

/** Public marketing/content paths that must remain crawlable. */
const PUBLIC_PATHS = [
  ROUTES.home,
  ROUTES.pricing,
  ROUTES.docs,
  ROUTES.blog,
  ...BLOG_SLUGS.map((slug) => ROUTES.blogPost(slug)),
  ROUTES.affiliate,
  ROUTES.security,
  ROUTES.privacy,
  ROUTES.status,
  ROUTES.roadmap,
  ROUTES.changelog,
  "/llms.txt",
] as const;

function isDisallowedByRobots(pathname: string): boolean {
  return ROBOTS_DISALLOW_PATHS.some((rule) => {
    if (rule.endsWith("/")) {
      return pathname === rule.slice(0, -1) || pathname.startsWith(rule);
    }
    return pathname === rule || pathname.startsWith(`${rule}/`);
  });
}

describe("robots disallow contract", () => {
  it("disallows API and every private app prefix", () => {
    expect(ROBOTS_DISALLOW_PATHS).toContain("/api/");
    for (const path of PRIVATE_APP_PATHS) {
      expect(ROBOTS_DISALLOW_PATHS).toContain(path);
      expect(isDisallowedByRobots(path)).toBe(true);
    }
    expect(isDisallowedByRobots("/api/audit")).toBe(true);
    expect(isDisallowedByRobots("/settings/billing")).toBe(true);
    expect(isDisallowedByRobots("/audit/new")).toBe(true);
  });

  it("does not disallow public marketing/content paths", () => {
    for (const path of PUBLIC_PATHS) {
      expect(isDisallowedByRobots(path)).toBe(false);
    }
  });

  it("does not invent non-existent private roots from the phase checklist", () => {
    // Billing lives under /settings/billing; there is no /billing or /ai-studio page.
    expect(PRIVATE_APP_PATHS).not.toContain("/billing");
    expect(PRIVATE_APP_PATHS).not.toContain("/ai-studio");
  });
});
