import { describe, expect, it } from "vitest";
import { promisify } from "node:util";
import {
  addressesArePublic,
  assertSafePublicHttpUrl,
  isBlockedIpAddress,
  isPrivateOrReservedHostname,
} from "@/lib/url-safety";
import { ssrfLookup } from "@/lib/safe-http-fetch";

const PUBLIC_A = [{ address: "93.184.216.34", family: 4 }];
const PRIVATE_A = [{ address: "10.0.0.5", family: 4 }];
const LOOPBACK_A = [{ address: "127.0.0.1", family: 4 }];

const lookupPublic = async () => PUBLIC_A;
const lookupPrivate = async () => PRIVATE_A;
const lookupLoopback = async () => LOOPBACK_A;

const lookupSsrf = promisify(ssrfLookup) as (
  hostname: string,
  options: { all?: boolean }
) => Promise<string | Array<{ address: string; family: number }>>;

describe("assertSafePublicHttpUrl", () => {
  it("allows a legitimate public URL after DNS to a public IP", async () => {
    const r = await assertSafePublicHttpUrl("https://shop.example.com/products/a", {
      lookup: lookupPublic,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.href).toContain("https://shop.example.com");
  });

  it("rejects localhost", async () => {
    expect((await assertSafePublicHttpUrl("http://localhost/admin")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("http://localhost.localdomain/")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("http://foo.localhost/")).ok).toBe(false);
  });

  it("rejects 127.0.0.1", async () => {
    expect((await assertSafePublicHttpUrl("http://127.0.0.1/")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("https://127.0.0.1:8443/secret")).ok).toBe(false);
  });

  it("rejects private IPv4", async () => {
    expect((await assertSafePublicHttpUrl("http://10.0.0.5/")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("http://192.168.1.1/")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("http://172.16.0.1/")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("http://169.254.169.254/latest")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("http://100.64.0.1/")).ok).toBe(false);
  });

  it("rejects IPv6 loopback ::1", async () => {
    expect((await assertSafePublicHttpUrl("http://[::1]/")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("http://[::1]:8080/")).ok).toBe(false);
  });

  it("rejects IPv4-mapped IPv6", async () => {
    expect((await assertSafePublicHttpUrl("http://[::ffff:127.0.0.1]/")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("http://[::ffff:7f00:1]/")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("http://[::ffff:10.0.0.1]/")).ok).toBe(false);
  });

  it("rejects private IPv6 / ULA / link-local", async () => {
    expect((await assertSafePublicHttpUrl("http://[fc00::1]/")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("http://[fd12:3456:789a::1]/")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("http://[fe80::1]/")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("http://[64:ff9b::127.0.0.1]/")).ok).toBe(false);
  });

  it("rejects 127.0.0.1.nip.io when it resolves to loopback", async () => {
    const r = await assertSafePublicHttpUrl("http://127.0.0.1.nip.io/", {
      lookup: lookupLoopback,
    });
    expect(r.ok).toBe(false);
  });

  it("rejects a hostname that resolves to a private IP", async () => {
    const r = await assertSafePublicHttpUrl("https://evil.example.internal-test/", {
      lookup: lookupPrivate,
    });
    expect(r.ok).toBe(false);
  });

  it("rejects mixed public+private DNS answers (rebinding)", async () => {
    const r = await assertSafePublicHttpUrl("https://dual.example.com/", {
      lookup: async () => [
        { address: "93.184.216.34", family: 4 },
        { address: "10.0.0.1", family: 4 },
      ],
    });
    expect(r.ok).toBe(false);
  });

  it("rejects malformed and obfuscated IP representations", async () => {
    expect((await assertSafePublicHttpUrl("http://2130706433/")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("http://0x7f000001/")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("http://0177.0.0.1/")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("http://127.1/")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("http://0/")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("http://0x7f.0.0.1/")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("not a url")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("file:///etc/passwd")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("ftp://example.com/a")).ok).toBe(false);
    expect((await assertSafePublicHttpUrl("http://user:pass@shop.example.com/", {
      lookup: lookupPublic,
    })).ok).toBe(false);
  });

  it("does not treat DNS failure as a public host", async () => {
    const r = await assertSafePublicHttpUrl("https://no-such-host.example/", {
      lookup: async () => {
        throw new Error("ENOTFOUND");
      },
    });
    expect(r.ok).toBe(false);
  });
});

describe("isPrivateOrReservedHostname", () => {
  it("detects RFC1918 ranges", () => {
    expect(isPrivateOrReservedHostname("172.16.0.1")).toBe(true);
    expect(isPrivateOrReservedHostname("8.8.8.8")).toBe(false);
  });

  it("detects mapped and ULA IPv6", () => {
    expect(isPrivateOrReservedHostname("[::ffff:127.0.0.1]")).toBe(true);
    expect(isPrivateOrReservedHostname("::ffff:7f00:1")).toBe(true);
    expect(isPrivateOrReservedHostname("fd00::1")).toBe(true);
    expect(isPrivateOrReservedHostname("2001:4860:4860::8888")).toBe(false);
  });
});

describe("isBlockedIpAddress", () => {
  it("blocks loopback and allows public IPv4", () => {
    expect(isBlockedIpAddress("127.0.0.1")).toBe(true);
    expect(isBlockedIpAddress("8.8.8.8")).toBe(false);
  });
});

describe("addressesArePublic", () => {
  it("requires every resolved address to be public", () => {
    expect(addressesArePublic(PUBLIC_A)).toBe(true);
    expect(addressesArePublic(PRIVATE_A)).toBe(false);
    expect(addressesArePublic([])).toBe(false);
  });
});

describe("ssrfLookup", () => {
  it("refuses to connect to loopback or mapped IPv6 literals", async () => {
    await expect(lookupSsrf("127.0.0.1", {})).rejects.toMatchObject({
      code: "ERR_BLOCKED_URL",
    });
    await expect(lookupSsrf("::1", {})).rejects.toMatchObject({
      code: "ERR_BLOCKED_URL",
    });
    await expect(lookupSsrf("::ffff:7f00:1", {})).rejects.toMatchObject({
      code: "ERR_BLOCKED_URL",
    });
  });

  it("allows a public IPv4 literal at connect time", async () => {
    await expect(lookupSsrf("8.8.8.8", {})).resolves.toBe("8.8.8.8");
  });
});
