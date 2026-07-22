/**
 * Starts the standalone production server bound to "::" (dual-stack),
 * so both http://127.0.0.1:3000 and http://[::1]:3000 work. Binding only
 * to 0.0.0.0 breaks clients that resolve `localhost` to IPv6 first
 * (browsers/test runners see ERR_EMPTY_RESPONSE).
 *
 * Standalone `server.js` does not load `.env.local` the way `next start`
 * does, so we hydrate process.env from the project root first.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

const root = resolve(import.meta.dirname, "..");
loadEnvFile(resolve(root, ".env"));
loadEnvFile(resolve(root, ".env.local"));

process.env.HOSTNAME = process.env.HOSTNAME || "::";
process.env.PORT = process.env.PORT || "3000";

await import("../.next/standalone/server.js");
