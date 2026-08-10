// Quick debug script to find the offending URL
import { beforeEach, afterEach, vi } from "vitest";
import { buildHomeJsonLdGraph, collectJsonLdUrls } from "./src/lib/seo/structured-data.ts";

const CANONICAL = "https://convaudit.example";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", CANONICAL);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const graph = buildHomeJsonLdGraph();
const urls = collectJsonLdUrls(graph);

console.log("=== All collected URLs ===");
urls.forEach((url, idx) => {
  const isCanonical = url.startsWith(CANONICAL);
  const icon = isCanonical ? "✓" : "✗";
  console.log(`${icon} [${idx}] ${url}`);
});

console.log("\n=== Offending URLs ===");
const offending = urls.filter(url => !url.startsWith(CANONICAL));
offending.forEach((url) => {
  console.log(`  ${url}`);
});

console.log("\n=== Full graph (JSON) ===");
console.log(JSON.stringify(graph, null, 2));
