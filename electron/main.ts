/**
 * Forge Studio — Electron Main Process
 * -----------------------------------
 * Spawns the Next.js standalone server as a child process, shows a
 * loading window while it boots, then loads the app.
 *
 * Robustness:
 * - Shows a loading splash immediately so the user sees something
 * - Probes and binds the SAME address (127.0.0.1) so the availability
 *   check and the server never disagree (fixes EADDRINUSE ::1:3000
 *   crashes caused by IPv4/IPv6 "localhost" resolution differences)
 * - If the port is stolen between probe and bind, automatically retries
 *   on the next free port (up to 5 attempts) instead of crashing
 * - Single-instance lock: a second launch focuses the first window
 * - Properly handles Windows paths and process management
 */

import { app, BrowserWindow, shell, dialog } from "electron";
import { spawn, ChildProcess, exec } from "node:child_process";
import { join } from "node:path";
import * as net from "node:net";

/** Everything (probe, server, health check, window) uses IPv4 loopback only.
 *  This sidesteps the Node >=17 "localhost → ::1" resolution mismatch that
 *  made the old probe (bound to `::`) disagree with the server (bound to
 *  `::1`) and crash with EADDRINUSE even though the probe had passed. */
const HOST = "127.0.0.1";
const MAX_START_ATTEMPTS = 5;
const MAX_PORT_PROBES = 50;

let nextServer: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let serverPort = 3000;
let serverReady = false;
let serverExited = false;
let serverStartError = "";

const isDev = !app.isPackaged;

/**
 * Find an available port on HOST, probing exactly the address the Next.js
 * server will bind (127.0.0.1). Tries up to MAX_PORT_PROBES consecutive
 * ports; returns 0 if none are free.
 */
async function findAvailablePort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + MAX_PORT_PROBES; port++) {
    const free = await new Promise<boolean>((resolve) => {
      const probe = net.createServer();
      probe.once("error", () => resolve(false));
      probe.listen(port, HOST, () => probe.close(() => resolve(true)));
    });
    if (free) return port;
  }
  return 0;
}

/**
 * Wait for the Next.js server to respond. Bails out early if the child
 * process dies while we're polling (so EADDRINUSE is detected in ~1s
 * instead of burning the full timeout).
 */
async function waitForServer(port: number, maxRetries = 60): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    if (serverExited) return false;
    try {
      const res = await fetch(`http://${HOST}:${port}`);
      if (res.ok || res.status === 404) return true;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

/** Show a loading splash window while the server boots. */
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: { contextIsolation: true },
  });

  splashWindow.loadURL("data:text/html," + encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          color: white;
          border-radius: 12px;
          overflow: hidden;
        }
        .logo {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #a78bfa, #f472b6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: #a78bfa;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .text {
          margin-top: 16px;
          font-size: 13px;
          opacity: 0.7;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div class="logo">Forge Studio</div>
      <div class="spinner"></div>
      <div class="text">Starting up…</div>
    </body>
    </html>
  `));
}

function startNextServer(port: number): ChildProcess {
  let cwd: string;
  let cmd: string;
  let args: string[];
  let env: NodeJS.ProcessEnv;

  if (isDev) {
    // Dev mode: run `next dev` on the same deterministic host
    cwd = process.cwd();
    cmd = "npx";
    args = ["next", "dev", "-p", String(port), "-H", HOST];
    env = { ...process.env };
  } else {
    // Production: run the standalone server
    // The standalone output is bundled as "standalone-server" inside the app.
    // NOTE: electron-builder.json sets `asar: false` so that app.getAppPath()
    // is a REAL directory on disk — a child node.exe process cannot read
    // files inside an .asar archive, so the server must live as plain files.
    cwd = join(app.getAppPath(), "standalone-server");
    cmd = "node";
    args = ["server.js"];
    env = {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      // Prevent Electron from interfering with the child Node process
      ELECTRON_RUN_AS_NODE: undefined as any,
      // Bind IPv4 loopback explicitly — matches our port probe exactly.
      // (Never "localhost": on Node >=17 it can resolve to ::1, which is a
      // different bind target than the probe used and caused EADDRINUSE.)
      HOSTNAME: HOST,
      // Give Prisma a writable SQLite location (feedback + email-report
      // routes fall back gracefully if the tables don't exist yet)
      DATABASE_URL: `file:${join(app.getPath("userData"), "forge.db")}`,
    };
  }

  // On Windows, we need shell:true so it can find node/npx.
  // But in a packaged Electron app, the ComSpec env var might not be set,
  // causing spawn ENOENT. We fix this by explicitly setting ComSpec to cmd.exe.
  const spawnEnv = { ...env };
  if (process.platform === "win32" && !spawnEnv.ComSpec) {
    spawnEnv.ComSpec = "C:\\Windows\\system32\\cmd.exe";
  }

  const child = spawn(cmd, args, {
    cwd,
    shell: process.platform === "win32" ? spawnEnv.ComSpec : true,
    stdio: "pipe",
    env: spawnEnv,
  });

  serverExited = false;
  serverStartError = "";

  child.stdout?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) console.log(`[next] ${msg}`);
  });

  child.stderr?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) {
      console.error(`[next] ${msg}`);
      serverStartError += msg + "\n";
    }
  });

  // Record failures; the bootstrap loop decides whether to retry (EADDRINUSE)
  // or surface the error to the user. No dialogs from here.
  child.on("error", (err) => {
    console.error("[next] Spawn error:", err);
    serverStartError += "Spawn error: " + err.message + "\n";
    serverExited = true;
  });

  child.on("exit", (code) => {
    serverExited = true;
    if (code !== 0 && code !== null) {
      console.error(`[next] Server exited with code ${code}`);
    }
  });

  return child;
}

function showErrorDialog(error: string) {
  if (mainWindow) return; // Already running, don't show error
  dialog.showErrorBox(
    "Forge Studio failed to start",
    `The app couldn't start its internal server.\n\n` +
    `Error: ${error || "Unknown error"}\n\n` +
    `Try:\n` +
    `1. Close any other instances of Forge Studio\n` +
    `2. Restart your computer\n` +
    `3. Free up ports 3000–3050 (in a terminal: netstat -ano | findstr :3000,\n` +
    `   then: taskkill /PID <the-listed-PID> /F)`
  );
  app.quit();
}

async function createWindow(port: number) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Forge Studio",
    backgroundColor: "#ffffff",
    show: false, // Don't show until ready
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, "preload.js"),
    },
    autoHideMenuBar: true,
  });

  // Open external links in the user's browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Load the Next.js app
  await mainWindow.loadURL(`http://${HOST}:${port}`);

  // Close splash and show main window
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
  mainWindow.show();
  mainWindow.focus();
  serverReady = true;
}

async function bootstrap() {
  // Show splash immediately
  createSplashWindow();

  // `electron:dev` runs the dev server externally (scripts/dev.mjs +
  // scripts/wait-dev.mjs) and points us at it — don't spawn a second one.
  const externalUrl = isDev ? process.env.FORGE_DEV_URL : undefined;
  if (externalUrl) {
    try {
      serverPort = Number(new URL(externalUrl).port) || 3000;
    } catch {
      serverPort = 3000;
    }
    console.log(`[forge] Using external dev server on port ${serverPort}`);
    const ready = await waitForServer(serverPort, 240); // dev compile can be slow
    if (!ready) {
      showErrorDialog(`Dev server at ${externalUrl} did not respond in time.`);
      return;
    }
    await createWindow(serverPort);
    return;
  }

  // Find an available port (probe binds exactly what the server will bind)
  serverPort = await findAvailablePort(3000);
  if (!serverPort) {
    showErrorDialog(`No available port found between 3000 and ${3000 + MAX_PORT_PROBES - 1}.`);
    return;
  }
  console.log(`[forge] Using port ${serverPort}`);

  // Start the server; if the port gets stolen between probe and bind
  // (EADDRINUSE), transparently fall back to the next free port.
  for (let attempt = 1; attempt <= MAX_START_ATTEMPTS; attempt++) {
    nextServer = startNextServer(serverPort);
    const ready = await waitForServer(serverPort);

    if (ready) {
      console.log("[forge] Server ready, creating window…");
      await createWindow(serverPort);
      return;
    }

    const addrInUse = serverExited && /EADDRINUSE/i.test(serverStartError);
    if (addrInUse && attempt < MAX_START_ATTEMPTS) {
      console.warn(
        `[forge] Port ${serverPort} was taken during startup ` +
        `(attempt ${attempt}/${MAX_START_ATTEMPTS}) — trying the next free port…`
      );
      serverPort = await findAvailablePort(serverPort + 1);
      if (!serverPort) break;
      continue;
    }
    break; // Unrecoverable — show the error below
  }

  showErrorDialog(serverStartError || "Server did not respond within 30 seconds.");
}

// --- Single instance: a second launch focuses the first window instead of
// fighting it for the port. ---
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(bootstrap);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0 && serverReady) {
      createWindow(serverPort);
    }
  });
}

// Quit when all windows are closed (except on Mac)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Clean up the child process on quit
app.on("before-quit", () => {
  if (nextServer && !nextServer.killed) {
    // On Windows, need to use taskkill to kill the process tree
    if (process.platform === "win32") {
      try {
        exec(`taskkill /pid ${nextServer.pid} /f /t`);
      } catch {
        // Ignore — process might already be dead
      }
    } else {
      nextServer.kill("SIGTERM");
      setTimeout(() => {
        if (nextServer && !nextServer.killed) {
          nextServer.kill("SIGKILL");
        }
      }, 3000);
    }
  }
});
