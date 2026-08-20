import { afterEach, describe, expect, it, vi } from "vitest";
import { absoluteUrl, getSiteUrl } from "@/lib/site-url";

describe("getSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses NEXT_PUBLIC_APP_URL and strips trailing slashes", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.convaudit.com/");
    expect(getSiteUrl()).toBe("https://www.convaudit.com");
  });

  it("falls back to localhost only outside production when unset", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("throws in production when NEXT_PUBLIC_APP_URL is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(() => getSiteUrl()).toThrow(/NEXT_PUBLIC_APP_URL is required in production/);
  });

  it("allows explicit localhost during local production builds", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("ENFORCE_PUBLIC_SITE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("throws on Vercel production when URL is localhost", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    expect(() => getSiteUrl()).toThrow(/must not be a localhost/);
  });

  it("throws on Vercel production when URL is not https", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://convaudit.com");
    expect(() => getSiteUrl()).toThrow(/must use https/);
  });

  it("throws in production for non-loopback http even without Vercel", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("ENFORCE_PUBLIC_SITE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://convaudit.com");
    expect(() => getSiteUrl()).toThrow(/must use https/);
  });

  it("accepts https public URL on Vercel production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.convaudit.com/");
    expect(getSiteUrl()).toBe("https://www.convaudit.com");
  });

  it("rewrites stale *.vercel.app APP_URL to the canonical production domain", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://geo-lime-chi.vercel.app");
    expect(getSiteUrl()).toBe("https://www.convaudit.com");
  });

  it("does not rewrite *.vercel.app outside Vercel production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("ENFORCE_PUBLIC_SITE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://geo-lime-chi.vercel.app");
    expect(getSiteUrl()).toBe("https://geo-lime-chi.vercel.app");
  });

  it("throws on invalid absolute URL values", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "not-a-url");
    expect(() => getSiteUrl()).toThrow(/invalid/);
  });
});

describe("absoluteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("joins paths to the canonical site origin", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.convaudit.com/");
    expect(absoluteUrl("/sitemap.xml")).toBe("https://www.convaudit.com/sitemap.xml");
    expect(absoluteUrl("pricing")).toBe("https://www.convaudit.com/pricing");
    expect(absoluteUrl("/")).toBe("https://www.convaudit.com");
  });
});
