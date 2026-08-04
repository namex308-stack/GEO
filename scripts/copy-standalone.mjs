import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standalone = join(root, ".next", "standalone");

if (!existsSync(standalone)) {
  console.log("Skipping standalone copy — .next/standalone not found.");
  process.exit(0);
}

const staticSrc = join(root, ".next", "static");
const staticDest = join(standalone, ".next", "static");
const publicSrc = join(root, "public");
const publicDest = join(standalone, "public");

mkdirSync(join(standalone, ".next"), { recursive: true });

if (existsSync(staticSrc)) {
  cpSync(staticSrc, staticDest, { recursive: true });
  console.log("Copied .next/static → standalone");
}

if (existsSync(publicSrc)) {
  cpSync(publicSrc, publicDest, { recursive: true });
  console.log("Copied public → standalone");
}
