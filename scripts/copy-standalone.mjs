/**
 * Cross-platform standalone copy script.
 * Copies .next/static and public into .next/standalone so the standalone
 * server has everything it needs. Uses Node fs (works on Windows/Mac/Linux).
 *
 * Also verifies that node_modules/next exists in the standalone output —
 * if not, copies the full node_modules as a fallback.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, rmSync } from "node:fs";
import { join } from "node:path";

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
const publicSrc = join(process.cwd(), "public");

// Copy to a flat "standalone-server" directory (no dots in path)
// This avoids Windows/electron-builder issues with dot-prefixed directories
const bundleDir = join(process.cwd(), "standalone-server");

if (!existsSync(standaloneDir)) {
  console.error("Standalone dir not found. Run `next build` first.");
  process.exit(1);
}

// Remove old bundle dir if it exists
if (existsSync(bundleDir)) {
  
  rmSync(bundleDir, { recursive: true, force: true });
}

console.log("Copying standalone → standalone-server/...");
copyDir(standaloneDir, bundleDir);

console.log("Copying .next/static → standalone-server/.next/static...");
copyDir(staticSrc, join(bundleDir, ".next", "static"));

console.log("Copying public → standalone-server/public...");
copyDir(publicSrc, join(bundleDir, "public"));

// Verify node_modules/next exists in standalone output
const nextModulePath = join(bundleDir, "node_modules", "next");
if (!existsSync(nextModulePath)) {
  console.warn("WARNING: node_modules/next not found in standalone output!");
  console.log("Copying full node_modules as fallback...");
  const nodeModulesSrc = join(process.cwd(), "node_modules");
  const nodeModulesDest = join(bundleDir, "node_modules");
  copyDir(nodeModulesSrc, nodeModulesDest);
  console.log("Done copying node_modules.");
} else {
  console.log("Verified: node_modules/next exists in standalone-server.");
}

console.log("Done. Bundle dir:", bundleDir);

