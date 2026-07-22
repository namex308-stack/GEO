import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const standalone = resolve(root, ".next", "standalone", ".next");
const staticSrc = resolve(root, ".next", "static");
const publicSrc = resolve(root, "public");

if (existsSync(staticSrc)) {
  cpSync(staticSrc, resolve(standalone, "static"), { recursive: true });
  console.log("✓ Copied .next/static → standalone");
}

if (existsSync(publicSrc)) {
  cpSync(publicSrc, resolve(root, ".next", "standalone", "public"), { recursive: true });
  console.log("✓ Copied public → standalone");
}
