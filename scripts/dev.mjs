#!/usr/bin/env node
/**
 * Forge Studio — dev server launcher with automatic port fallback
 * ---------------------------------------------------------------
 * Replacement for `next dev -p 3000`: finds the first FREE port starting
 * at the requested one and runs `next dev` on it, so a busy port 3000
 * (another dev server, a zombie node process, Docker, …) can never crash
 * startup with `EADDRINUSE ::1:3000` again.
 *
 * Usage:
 *   node scripts/dev.mjs              # start at 3000, fall back 3001, 3002, …
 *   PORT=3005 node scripts/dev.mjs    # start elsewhere
 *   node scripts/dev.mjs --port 3005  # same, as a flag
 *   node scripts/dev.mjs 3005         # same, positional
 *
 * The chosen port is written to `dev.port` so tooling (scripts/wait-dev.mjs)
 * can pick it up. All output is mirrored to dev.log (no `tee` needed, so it
 * works on Windows too).
 */
import net from "node:net";
import { spawn } from "node:child_process";
import { createWriteStream, unlinkSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);

let startPort = 3000;
const flagIdx = args.indexOf("--port");
if (flagIdx !== -1 && args[flagIdx + 1]) {
  startPort = parseInt(args[flagIdx + 1], 10);
} else if (args.length > 0 && /^\d+$/.test(args[0])) {
  startPort = parseInt(args[0], 10);
}
if (Number.isFinite(parseInt(process.env.PORT, 10))) {
  startPort = parseInt(process.env.PORT, 10);
}
if (!Number.isFinite(startPort) || startPort < 1 || startPort > 65535) {
  startPort = 3000;
}

/**
 * Probe 127.0.0.1 exactly — the same address `next dev -H 127.0.0.1`
 * will bind. Never probe the wildcard: on Node >=17 "localhost" can
 * resolve to ::1, and a wildcard probe can disagree with the actual
 * bind target (the classic EADDRINUSE-despite-free-probe bug).
 */
function checkPort(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once("error", () => resolve(false));
    probe.listen(port, "127.0.0.1", () => probe.close(() => resolve(true)));
  });
}

async function findPort(from) {
  for (let p = from; p < from + 50; p++) {
    if (await checkPort(p)) return p;
  }
  return 0;
}

const port = await findPort(startPort);
if (!port) {
  console.error(`✖ No free port found in ${startPort}–${startPort + 49}. Free one up and retry.`);
  process.exit(1);
}
if (port !== startPort) {
  console.log(`➜ Port ${startPort} is busy — using ${port} instead`);
}

// Publish the chosen port for tooling (remove any stale file first)
try { unlinkSync("dev.port"); } catch { /* not there — fine */ }
writeFileSync("dev.port", String(port));

const log = createWriteStream("dev.log", { flags: "w" });
const child = spawn("npx", ["next", "dev", "-p", String(port), "-H", "127.0.0.1"], {
  shell: true,
  stdio: ["inherit", "pipe", "pipe"],
});

const teeOut = (chunk) => { process.stdout.write(chunk); log.write(chunk); };
const teeErr = (chunk) => { process.stderr.write(chunk); log.write(chunk); };
child.stdout.on("data", teeOut);
child.stderr.on("data", teeErr);

child.on("exit", (code) => {
  log.end();
  try { unlinkSync("dev.port"); } catch { /* already gone */ }
  process.exit(code ?? 0);
});

// Ctrl-C / kill: let the child wind down first
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    try { child.kill(sig); } catch { /* already dead */ }
  });
}
