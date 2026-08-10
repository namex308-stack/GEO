import { describe, expect, it } from "vitest";
import { FOOTER_LINK_COLS } from "@/components/layout/footer";
import { ROUTES } from "@/lib/routes";
import {
  CRAWLABLE_LOGIN_HREF,
  CRAWLABLE_START_AUDIT_HREF,
} from "@/lib/use-navigate";

/** Indexable public paths that must appear as real footer hrefs. */
const SITEMAP_STATIC_PATHS = [
  ROUTES.pricing,
  ROUTES.docs,
  ROUTES.blog,
  ROUTES.affiliate,
  ROUTES.security,
  ROUTES.privacy,
  ROUTES.roadmap,
] as const;

describe("public internal links crawlability", () => {
  it("exposes guest auth/audit CTAs as stable crawlable hrefs", () => {
    expect(CRAWLABLE_START_AUDIT_HREF).toMatch(/^\/auth\?/);
    expect(CRAWLABLE_START_AUDIT_HREF).toContain("mode=signup");
    expect(CRAWLABLE_START_AUDIT_HREF).toContain("next=");
    expect(CRAWLABLE_LOGIN_HREF).toMatch(/^\/auth\?/);
    expect(CRAWLABLE_LOGIN_HREF).toContain("mode=login");
  });

  it("covers every sitemap static page from the footer with real hrefs", () => {
    const hrefs = FOOTER_LINK_COLS.flatMap((col) => col.links.map((l) => l.href));
    for (const path of SITEMAP_STATIC_PATHS) {
      expect(hrefs, `missing footer link for ${path}`).toContain(path);
    }
    expect(hrefs.every((h) => h.startsWith("/") && !h.startsWith("javascript:"))).toBe(
      true
    );
  });

  it("does not use empty or hash-only footer destinations", () => {
    const hrefs = FOOTER_LINK_COLS.flatMap((col) => col.links.map((l) => l.href));
    for (const href of hrefs) {
      expect(href.length).toBeGreaterThan(1);
      expect(href).not.toBe("#");
    }
  });
});
