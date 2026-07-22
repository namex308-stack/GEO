/**
 * Smoke-test Firecrawl scrape.
 * Usage: node scripts/test-firecrawl.mjs [url]
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

const key = process.env.FIRECRAWL_API_KEY?.trim();
const url = process.argv[2] || "https://example.com";

if (!key) {
  console.error("FIRECRAWL_API_KEY missing");
  process.exit(1);
}

const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  },
  body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
});

const text = await res.text();
if (!res.ok) {
  console.error("Firecrawl failed:", res.status, text.slice(0, 400));
  process.exit(1);
}

const json = JSON.parse(text);
const md = json.data?.markdown ?? json.markdown ?? "";
console.log("OK — scraped", url);
console.log("title:", json.data?.metadata?.title ?? json.metadata?.title ?? "(none)");
console.log("markdown chars:", md.length);
console.log("preview:", md.slice(0, 200).replace(/\n/g, " "));
