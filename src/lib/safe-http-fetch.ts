/**
 * Outbound HTTP(S) for user-supplied crawl URLs.
 * Resolves and re-checks destinations before connect; does not follow redirects blindly.
 */

import http from "node:http";
import https from "node:https";
import { lookup as dnsLookupCb } from "node:dns";
import { isIP } from "node:net";
import type { IncomingMessage, RequestOptions } from "node:http";
import {
  addressesArePublic,
  assertSafePublicHttpUrl,
  isBlockedIpAddress,
  normalizeHostname,
} from "@/lib/url-safety";

const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 2_000_000;

export type SafeHttpFetchSuccess = {
  ok: true;
  status: number;
  url: string;
  headers: Headers;
  bodyText: string;
};

export type SafeHttpFetchFailure = {
  ok: false;
  blocked: boolean;
  reason: string;
  status: number | null;
};

export type SafeHttpFetchResult = SafeHttpFetchSuccess | SafeHttpFetchFailure;

const BLOCKED_FETCH_REASON = "عناوين الشبكات الخاصة أو المحجوزة غير مسموحة.";

function blockedErrno(): NodeJS.ErrnoException {
  const err = new Error("blocked") as NodeJS.ErrnoException;
  err.code = "ERR_BLOCKED_URL";
  return err;
}

/** Connect-time DNS lookup used by http(s).request — rejects private/loopback answers. */
export function ssrfLookup(
  hostname: string,
  options: { all?: boolean },
  callback: (
    err: NodeJS.ErrnoException | null,
    address: string | Array<{ address: string; family: number }>,
    family?: number
  ) => void
): void {
  const host = normalizeHostname(hostname);
  if (isIP(host)) {
    if (isBlockedIpAddress(host)) {
      callback(blockedErrno(), "", 4);
      return;
    }
    const family = isIP(host) === 6 ? 6 : 4;
    if (options.all) {
      callback(null, [{ address: host, family }]);
      return;
    }
    callback(null, host, family);
    return;
  }

  dnsLookupCb(host, { all: true, verbatim: true }, (err, addresses) => {
    if (err) {
      callback(err, "", 4);
      return;
    }
    if (!addressesArePublic(addresses)) {
      callback(blockedErrno(), "", 4);
      return;
    }
    const first = addresses[0];
    if (!first) {
      callback(blockedErrno(), "", 4);
      return;
    }
    if (options.all) {
      callback(null, addresses);
      return;
    }
    callback(null, first.address, first.family);
  });
}

function requestHeaders(init?: {
  headers?: Record<string, string>;
  host: string;
}): http.OutgoingHttpHeaders {
  return {
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Encoding": "identity",
    Connection: "close",
    Host: init?.host,
    ...init?.headers,
  };
}

function incomingToHeaders(res: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(res.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else {
      headers.set(key, value);
    }
  }
  return headers;
}

function readBody(res: IncomingMessage, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    res.on("data", (chunk: Buffer | string) => {
      const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
      size += buf.length;
      if (size > maxBytes) {
        res.destroy();
        resolve(Buffer.concat(chunks).toString("utf8"));
        return;
      }
      chunks.push(buf);
    });
    res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    res.on("error", reject);
  });
}

function remoteAddressBlocked(res: IncomingMessage): boolean {
  const addr = res.socket?.remoteAddress;
  if (!addr) return false;
  return isBlockedIpAddress(addr);
}

function requestOnce(
  target: URL,
  init: {
    method?: string;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  }
): Promise<IncomingMessage> {
  const isHttps = target.protocol === "https:";
  const lib = isHttps ? https : http;
  const hostname = normalizeHostname(target.hostname);

  const options: RequestOptions = {
    protocol: target.protocol,
    hostname,
    port: target.port || (isHttps ? 443 : 80),
    path: `${target.pathname}${target.search}`,
    method: init.method ?? "GET",
    headers: requestHeaders({ headers: init.headers, host: target.host }),
    lookup: ssrfLookup as RequestOptions["lookup"],
  };

  return new Promise((resolve, reject) => {
    const req = lib.request(options, (res) => resolve(res));
    req.on("error", reject);

    const abort = () => {
      req.destroy(init.signal?.reason instanceof Error ? init.signal.reason : new Error("aborted"));
    };
    if (init.signal) {
      if (init.signal.aborted) {
        abort();
        return;
      }
      init.signal.addEventListener("abort", abort, { once: true });
      req.on("close", () => init.signal?.removeEventListener("abort", abort));
    }

    req.end();
  });
}

/**
 * Fetch a user-supplied http(s) URL after SSRF checks.
 * Redirects are followed manually; each hop is validated and re-resolved.
 */
export async function fetchSafePublicHttpUrl(
  raw: string,
  init: {
    method?: string;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  } = {}
): Promise<SafeHttpFetchResult> {
  let current = raw;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const safe = await assertSafePublicHttpUrl(current);
    if (!safe.ok) {
      return { ok: false, blocked: true, reason: safe.reason, status: null };
    }

    let target: URL;
    try {
      target = new URL(safe.href);
    } catch {
      return { ok: false, blocked: true, reason: "رابط غير صالح.", status: null };
    }

    let res: IncomingMessage;
    try {
      res = await requestOnce(target, init);
    } catch (err) {
      const blocked =
        err instanceof Error &&
        "code" in err &&
        (err as NodeJS.ErrnoException).code === "ERR_BLOCKED_URL";
      return {
        ok: false,
        blocked,
        reason: blocked ? BLOCKED_FETCH_REASON : "Direct fetch threw a network error.",
        status: null,
      };
    }

    if (remoteAddressBlocked(res)) {
      res.destroy();
      return { ok: false, blocked: true, reason: BLOCKED_FETCH_REASON, status: res.statusCode ?? null };
    }

    const status = res.statusCode ?? 0;
    const headers = incomingToHeaders(res);
    const location = headers.get("location");
    const isRedirect = status >= 300 && status < 400 && Boolean(location);

    if (isRedirect && location) {
      res.resume();
      if (hop === MAX_REDIRECTS) {
        return {
          ok: false,
          blocked: false,
          reason: "Too many redirects.",
          status,
        };
      }
      try {
        current = new URL(location, target).href;
      } catch {
        return { ok: false, blocked: true, reason: "رابط غير صالح.", status };
      }
      continue;
    }

    const bodyText = await readBody(res, MAX_BODY_BYTES);
    return {
      ok: true,
      status,
      url: target.href,
      headers,
      bodyText,
    };
  }

  return { ok: false, blocked: false, reason: "Too many redirects.", status: null };
}
