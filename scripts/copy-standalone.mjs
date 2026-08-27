/**
 * Cross-platform standalone copy script.
 * Copies .next/static and public into .next/standalone so the standalone
 * server has everything it needs. Uses Node fs (works on Windows/Mac/Linux).
 *
 * Also verifies that node_modules/next exists in the standalone output —
 * if not, copies the full node_modules as a fallback.
 *
 * Finally patches server.js so PORT=0 (OS-assigned ephemeral port) works:
 * the stock generator emits `parseInt(process.env.PORT, 10) || 3000`,
 * which treats 0 as falsy and silently binds 3000. The desktop app relies
 * on PORT=0 so it NEVER needs a fixed port (zero conflict chance) — the
 * OS picks a free high port and the Electron shell reads the real one
 * back from the startup banner.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, rmSync, writeFileSync } from "node:fs";
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

// Patch server.js: make PORT=0 (ephemeral OS-assigned port) work.
const serverJsPath = join(bundleDir, "server.js");
const STOCK_PORT_LINE = "const currentPort = parseInt(process.env.PORT, 10) || 3000";
const PATCHED_PORT_LINE =
  "const currentPortRaw = parseInt(process.env.PORT, 10)\n" +
  "const currentPort = Number.isFinite(currentPortRaw) && currentPortRaw >= 0 ? currentPortRaw : 3000";
if (existsSync(serverJsPath)) {
  let serverJs = readFileSync(serverJsPath, "utf8");
  if (serverJs.includes(PATCHED_PORT_LINE)) {
    console.log("server.js port patch: already applied.");
  } else if (serverJs.includes(STOCK_PORT_LINE)) {
    serverJs = serverJs.replace(STOCK_PORT_LINE, PATCHED_PORT_LINE);
    writeFileSync(serverJsPath, serverJs);
    console.log("server.js port patch: applied (PORT=0 now requests an OS-assigned ephemeral port).");
  } else {
    // Don't fail the build — main.ts falls back to fixed-port probing if the
    // ephemeral handshake doesn't produce a banner port.
    console.warn("WARNING: could not find the stock PORT line in server.js — ephemeral-port patch NOT applied.");
  }
} else {
  console.warn("WARNING: server.js not found in standalone output — port patch skipped.");
}

console.log("Done. Bundle dir:", bundleDir);

