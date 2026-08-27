#!/usr/bin/env node
/**
 * Forge Studio — wait for the dev server, then launch Electron
 * ------------------------------------------------------------
 * Companion to scripts/dev.mjs (used by `bun run electron:dev`):
 *   1. Waits for the `dev.port` file (written by dev.mjs)
 *   2. Waits until http://127.0.0.1:<port> answers
 *   3. Spawns Electron with FORGE_DEV_URL so the main process attaches
 *      to that server instead of spawning a second one.
 */
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const readPort = () => {
  try {
    const n = Number(readFileSync("dev.port", "utf8").trim());
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
};

async function waitForDevServer(timeoutMs = 180000) {
  const deadline = Date.now() + timeoutMs;
  let port = 0;
  while (Date.now() < deadline) {
    const latest = readPort(); // re-read each round (dev.mjs may rewrite it)
    if (latest && latest !== port) port = latest;
    if (port) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}`);
        if (res.ok || res.status === 404) return port;
      } catch {
        // still compiling / not ready
      }
    }
    await sleep(500);
  }
  throw new Error(
    port
      ? `Timed out waiting for the dev server on port ${port}.`
      : "Timed out waiting for dev.port — is `bun run dev` running?"
  );
}

const port = await waitForDevServer();
console.log(`[wait-dev] Dev server ready on http://127.0.0.1:${port} — launching Electron…`);

const electron = spawn("npx", ["electron", "electron/dist/main.js"], {
  shell: true,
  stdio: "inherit",
  env: { ...process.env, FORGE_DEV_URL: `http://127.0.0.1:${port}` },
});
electron.on("exit", (code) => process.exit(code ?? 0));

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    try { electron.kill(sig); } catch { /* already dead */ }
  });
}
