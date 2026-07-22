/**
 * Non-destructive Kashier P0 verification:
 * - env presence / production gates
 * - HMAC round-trip with configured secrets
 * Does not charge cards or mutate subscriptions.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    // Unescape \$ for dotenv-expand style
    val = val.replace(/\\\$/g, "$");
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvLocal();

const checks = [];
function ok(name, pass, detail = "") {
  checks.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const merchant = process.env.KASHIER_MERCHANT_ID || process.env.NEXT_PUBLIC_KASHIER_MERCHANT_ID;
const apiKey = process.env.KASHIER_API_KEY;
const secret = process.env.KASHIER_SECRET_KEY?.trim();
const webhookSecret = process.env.KASHIER_WEBHOOK_SECRET?.trim();
const mode = process.env.KASHIER_MODE?.trim();
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

ok("KASHIER_MERCHANT_ID set", !!merchant, merchant ? `len=${merchant.length}` : "missing");
ok("KASHIER_API_KEY set", !!apiKey, apiKey ? `len=${apiKey.length}` : "missing");
ok("KASHIER_SECRET_KEY set", !!secret, secret ? `len=${secret.length}` : "missing");
ok(
  "KASHIER_MODE explicit (prod requirement)",
  mode === "live" || mode === "test" || mode === "sandbox",
  mode ? `value=${mode}` : "unset → defaults to test"
);

let publicUrl = false;
try {
  const u = new URL(appUrl);
  publicUrl = !/^(localhost|127\.0\.0\.1)$/i.test(u.hostname);
  ok("NEXT_PUBLIC_APP_URL set", !!appUrl, `host=${u.host}`);
  ok("APP_URL not localhost (prod webhook reachable)", publicUrl, u.host);
} catch {
  ok("NEXT_PUBLIC_APP_URL set", false, "invalid URL");
  ok("APP_URL not localhost (prod webhook reachable)", false, "invalid URL");
}

const payload = JSON.stringify({
  status: "SUCCESS",
  orderId: "sp-pro-monthly-00000000-0000-0000-0000-000000000000-0",
  amount: 199,
});

function verify(payloadStr, signature, secrets) {
  const sig = signature.replace(/^sha256=/i, "").trim();
  for (const s of secrets) {
    const expected = crypto.createHmac("sha256", s).update(payloadStr).digest("hex");
    try {
      const a = Buffer.from(expected, "utf8");
      const b = Buffer.from(sig, "utf8");
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
    } catch {
      /* continue */
    }
  }
  return false;
}

const secrets = [...new Set([webhookSecret, secret, apiKey].filter(Boolean))];
ok("At least one HMAC secret available", secrets.length > 0, `count=${secrets.length}`);

if (secrets.length > 0) {
  const preferred = webhookSecret || secret || apiKey;
  const signature = crypto.createHmac("sha256", preferred).update(payload).digest("hex");
  ok("HMAC round-trip (preferred secret)", verify(payload, signature, secrets));
  ok("HMAC rejects garbage", !verify(payload, "00".repeat(32), secrets));
}

const failed = checks.filter((c) => !c.pass);
console.log("\n---");
console.log(
  failed.length === 0
    ? "All local P0 env/HMAC checks passed. Complete live checklist in docs/kashier-payment-testing-checklist.md"
    : `${failed.length} check(s) need attention before production payments.`
);
process.exit(failed.some((c) => c.name.includes("HMAC") || c.name.includes("MERCHANT") || c.name.includes("API_KEY")) ? 1 : 0);
