/**
 * Cross-platform standalone copy script.
 * Copies .next/static and public into .next/standalone so the standalone
 * server has everything it needs. Uses Node fs (works on Windows/Mac/Linux).
 */
const { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } = require("node:fs");
const { join } = require("node:path");

function copyDir(src, dest) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const s = join(src, entry);
    const d = join(dest, entry);
    if (statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      copyFileSync(s, d);
    }
  }
}

const standaloneDir = join(process.cwd(), ".next", "standalone");
const staticSrc = join(process.cwd(), ".next", "static");
const staticDest = join(standaloneDir, ".next", "static");
const publicSrc = join(process.cwd(), "public");
const publicDest = join(standaloneDir, "public");

if (!existsSync(standaloneDir)) {
  console.error("Standalone dir not found. Run `next build` first.");
  process.exit(1);
}

console.log("Copying .next/static → .next/standalone/.next/static...");
copyDir(staticSrc, staticDest);
console.log("Copying public → .next/standalone/public...");
copyDir(publicSrc, publicDest);
console.log("Done.");
