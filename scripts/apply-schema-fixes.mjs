/**
 * Apply missing remote schema fixes (billing_period + auth trigger).
 * Uses the Supabase Management API when SUPABASE_ACCESS_TOKEN is set,
 * otherwise prints SQL for the SQL Editor.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-schema-fixes.mjs
 *   npm run db:migrate
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const sql = readFileSync(
  resolve(root, "supabase/migrations/005_ensure_billing_period.sql"),
  "utf8"
);

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ref = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const token = process.env.SUPABASE_ACCESS_TOKEN;

async function main() {
  if (token && ref) {
    console.log("Applying migration 005 via Management API...");
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("Failed:", res.status, text);
      console.log("\n--- Run this SQL manually in Supabase SQL Editor ---\n");
      console.log(sql);
      process.exit(1);
    }
    console.log("OK:", text.slice(0, 300));
    return;
  }

  console.log("No SUPABASE_ACCESS_TOKEN — print SQL for manual apply.\n");
  console.log(`Project: ${ref || "unknown"}`);
  console.log("Open: https://supabase.com/dashboard/project/" + (ref || "_") + "/sql/new\n");
  console.log("--- SQL ---\n");
  console.log(sql);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
