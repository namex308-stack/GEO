import { describe, expect, it } from "vitest";
import { assertSafePublicHttpUrl, isPrivateOrReservedHostname } from "@/lib/url-safety";

describe("assertSafePublicHttpUrl", () => {
  it("allows public https URLs", () => {
    const r = assertSafePublicHttpUrl("https://shop.example.com/products/a");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.href).toContain("https://shop.example.com");
  });

  it("rejects localhost and private IPs", () => {
    expect(assertSafePublicHttpUrl("http://localhost/admin").ok).toBe(false);
    expect(assertSafePublicHttpUrl("http://127.0.0.1/").ok).toBe(false);
    expect(assertSafePublicHttpUrl("http://10.0.0.5/").ok).toBe(false);
    expect(assertSafePublicHttpUrl("http://192.168.1.1/").ok).toBe(false);
    expect(assertSafePublicHttpUrl("http://169.254.169.254/latest").ok).toBe(false);
  });

  it("rejects non-http schemes", () => {
    expect(assertSafePublicHttpUrl("file:///etc/passwd").ok).toBe(false);
    expect(assertSafePublicHttpUrl("ftp://example.com/a").ok).toBe(false);
  });
});

describe("isPrivateOrReservedHostname", () => {
  it("detects RFC1918 ranges", () => {
    expect(isPrivateOrReservedHostname("172.16.0.1")).toBe(true);
    expect(isPrivateOrReservedHostname("8.8.8.8")).toBe(false);
  });
});
