/**
 * Forge Studio — Electron Main Process
 * -----------------------------------
 * Spawns the Next.js standalone server as a child process, shows a
 * loading window while it boots, then loads the app.
 *
 * Port-free architecture (v1.4.1+):
 * - The server binds an OS-ASSIGNED EPHEMERAL PORT (PORT=0): the OS picks
 *   a free high port at every launch, so a port conflict is structurally
 *   impossible — the app never needs port 3000 (or any fixed port).
 * - The window loads the app over a custom `app://local` protocol that
 *   proxies to the internal server. The origin the app runs on is ALWAYS
 *   `app://local`, no matter which port the server got this session —
 *   so localStorage data (the app's source of truth) stays put forever.
 * - If a fixed port is requested via PORT/FORGE_PORT env (CI, tooling),
 *   it is probed first and used when free; otherwise ephemeral wins.
 * - Safety net: if the `app://` load fails, the window falls back to
 *   loading the server directly over http://127.0.0.1:<port>.
 * - Single-instance lock: a second launch focuses the first window.
 */

import { app, BrowserWindow, shell, dialog, protocol, net } from "electron";
import { spawn, ChildProcess, exec } from "node:child_process";
import { join } from "node:path";
import * as net2 from "node:net";

/**
 * The `app` scheme is registered as privileged BEFORE app ready so the
 * renderer can use storage, fetch, and streaming on a stable, secure origin.
 */
protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      codeCache: true,
    },
  },
]);

/** Everything (probe, server, health check, proxy) uses IPv4 loopback only. */
const HOST = "127.0.0.1";
const APP_ORIGIN = "app://local";
const MAX_START_ATTEMPTS = 5;
const MAX_PORT_PROBES = 50;
const PORT_DISCOVERY_TIMEOUT_MS = 12_000;

let nextServer: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let serverPort = 0; // 0 = not yet known
let serverReady = false;
let serverExited = false;
let serverStartError = "";
let protocolRegistered = false;

const isDev = !app.isPackaged;
/** Force the production server path (standalone-server) even when running
 *  unpacked — used by the E2E harness and local desktop-style testing. */
const useProdServer = !isDev || process.env.FORGE_TEST_PROD === "1";

/** Parse an env var into a valid port number (>= 0), or null. */
function envPort(name: string): number | null {
  const raw = process.env[name];
  if (raw === undefined) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 && n <= 65535 ? n : null;
}

/**
 * Find an available port on HOST, probing exactly the address the Next.js
 * server will bind (127.0.0.1). Tries up to MAX_PORT_PROBES consecutive
 * ports; returns 0 if none are free.
 */
async function findAvailablePort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + MAX_PORT_PROBES; port++) {
    const free = await new Promise<boolean>((resolve) => {
      const probe = net2.createServer();
      probe.once("error", () => resolve(false));
      probe.listen(port, HOST, () => probe.close(() => resolve(true)));
    });
    if (free) return port;
  }
  return 0;
}

/** Wait for the Next.js server to respond. */
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

/**
 * Wait for the server banner that reports the ACTUAL port it bound.
 * With PORT=0 (ephemeral) the OS assigns one; Next prints e.g.
 *   - Local:  http://127.0.0.1:45231
 * after `listening`, with the real port from server.address().
 * Also resolves early (0) if the child dies (e.g. EADDRINUSE) so the
 * retry loop reacts in milliseconds instead of waiting out the timeout.
 */
function waitForPortFromServer(maxMs = PORT_DISCOVERY_TIMEOUT_MS): Promise<number> {
  return new Promise((resolve) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (serverPort > 0) {
        clearInterval(timer);
        resolve(serverPort);
      } else if (serverExited) {
        clearInterval(timer);
        resolve(0);
      } else if (Date.now() - started > maxMs) {
        clearInterval(timer);
        resolve(0);
      }
    }, 150);
  });
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

  if (!useProdServer) {
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
    cwd = process.env.FORGE_STANDALONE_DIR
      ? join(process.cwd(), process.env.FORGE_STANDALONE_DIR)
      : join(app.getAppPath(), "standalone-server");
    cmd = "node";
    args = ["server.js"];
    env = {
      ...process.env,
      NODE_ENV: "production",
      // 0 = OS-assigned ephemeral port (the default — no fixed port needed).
      PORT: String(port),
      // Prevent Electron from interfering with the child Node process
      ELECTRON_RUN_AS_NODE: undefined as any,
      // Bind IPv4 loopback explicitly — matches our probes exactly.
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
  serverPort = 0; // reset — a retry attempt must rediscover the (new) port

  // The startup banner carries the ACTUAL port (vital for PORT=0).
  const PORT_RE = new RegExp(`https?://${HOST.replace(/\./g, "\\.")}:(\\d+)`);
  const scanForPort = (text: string) => {
    const m = text.match(PORT_RE);
    if (m && serverPort === 0) {
      serverPort = parseInt(m[1], 10);
      console.log(`[forge] Server reported actual port: ${serverPort}`);
    }
  };

  child.stdout?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) {
      console.log(`[next] ${msg}`);
      scanForPort(msg);
    }
  });

  child.stderr?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) {
      console.error(`[next] ${msg}`);
      serverStartError += msg + "\n";
      scanForPort(msg);
    }
  });

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
    `3. If it persists, report this error — the app uses an OS-assigned\n` +
    `   port so a port conflict should not be possible.`
  );
  app.quit();
}

function killServer() {
  if (nextServer && !nextServer.killed && nextServer.pid) {
    if (process.platform === "win32") {
      try {
        exec(`taskkill /pid ${nextServer.pid} /f /t`);
      } catch {
        // Ignore — process might already be dead
      }
    } else {
      try {
        nextServer.kill("SIGTERM");
        setTimeout(() => {
          if (nextServer && !nextServer.killed) {
            nextServer.kill("SIGKILL");
          }
        }, 3000);
      } catch {
        // Ignore — process might already be dead
      }
    }
  }
}

/**
 * Route `app://local/<path>` requests to the internal server on
 * http://127.0.0.1:<port>. The renderer therefore lives on one stable
 * origin forever, while the underlying port may change every launch.
 */
function registerAppProtocol(port: number) {
  if (protocolRegistered) return; // protocol.handle throws on double-register
  protocol.handle("app", (request) => {
    const url = new URL(request.url);
    const target = `http://${HOST}:${port}${url.pathname}${url.search}`;
    // Sanitize headers before forwarding: Chromium's net.fetch REJECTS
    // requests whose `Origin` scheme doesn't match the http target (fonts
    // and preloads always send Origin, even same-origin), and `Host`/
    // `Referer` would describe app://local instead of the real target.
    const fwdHeaders = new Headers();
    request.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (k === "origin" || k === "host" || k === "referer") return;
      fwdHeaders.set(key, value);
    });
    const init: RequestInit & { duplex?: "half" } = {
      method: request.method,
      headers: fwdHeaders,
    };
    // Forward bodies for POST/PUT/PATCH (fetch streams need duplex half).
    if (!["GET", "HEAD"].includes(request.method)) {
      init.body = request.body as any;
      init.duplex = "half";
    }
    // Never let the handler reject: surface upstream failures as a 502 so
    // the renderer gets a diagnostic page instead of net::ERR_FAILED.
    return net.fetch(target, init as any).catch((err: Error) => {
      console.error(`[forge] app:// proxy error for ${request.method} ${url.pathname}:`, err?.message || err);
      return new Response(
        `<!DOCTYPE html><html><head><title>Forge Studio — proxy error</title></head>` +
        `<body style="font-family:system-ui;padding:40px;background:#0f172a;color:#fff">` +
        `<h1>Could not reach the internal server</h1>` +
        `<p>Request: ${request.method} ${url.pathname}</p>` +
        `<p>Error: ${String(err?.message || err)}</p></body></html>`,
        { status: 502, headers: { "content-type": "text/html" } }
      );
    });
  });
  protocolRegistered = true;
}

async function createWindow(loadUrl: string, fallbackUrl?: string) {
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

  if (process.env.FORGE_E2E_DEBUG) {
    mainWindow.webContents.on("console-message", (_e, _level, message) => {
      console.log(`[renderer] ${message}`);
    });
    mainWindow.webContents.on("did-fail-load", (_e, code, desc, url) => {
      console.log(`[forge] did-fail-load ${code} ${desc} ${url}`);
    });
    mainWindow.webContents.on("did-start-loading", () => console.log("[forge] did-start-loading"));
    mainWindow.webContents.on("did-stop-loading", () => console.log("[forge] did-stop-loading"));
    mainWindow.webContents.on("did-finish-load", () => console.log("[forge] did-finish-load"));
  }

  console.log(`[forge] createWindow loading ${loadUrl}`);

  // Load the app — with an http fallback if the custom protocol fails.
  try {
    await mainWindow.loadURL(loadUrl);
  } catch (err) {
    if (fallbackUrl) {
      console.warn(`[forge] Loading ${loadUrl} failed (${String(err)}) — falling back to ${fallbackUrl}`);
      await mainWindow.loadURL(fallbackUrl);
    } else {
      throw err;
    }
  }

  // Close splash and show main window
  console.log("[forge] loadURL resolved — closing splash");
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
  console.log("[forge] splash closed — showing window");
  mainWindow.show();
  mainWindow.focus();
  console.log("[forge] window shown");
  serverReady = true;
}

/**
 * E2E harness hooks (active only when FORGE_TEST_MODE is set — never in
 * normal usage). Lets CI/local scripts verify the whole boot chain,
 * including localStorage persistence across launches with DIFFERENT ports.
 */
async function runE2ECheck() {
  const mode = process.env.FORGE_TEST_MODE; // "write" | "read"
  if (!mode || !mainWindow) return;
  try {
    if (mode === "write") {
      const marker = `e2e-${Date.now()}`;
      await mainWindow.webContents.executeJavaScript(
        `localStorage.setItem("forge-e2e-marker", ${JSON.stringify(marker)}); ${JSON.stringify(marker)}`
      );
      console.log(`[e2e] WRITE_OK marker=${marker}`);
    } else if (mode === "read") {
      const value = await mainWindow.webContents.executeJavaScript(
        `localStorage.getItem("forge-e2e-marker")`
      );
      console.log(`[e2e] READ_VALUE=${String(value)}`);
      if (!value || !String(value).startsWith("e2e-")) {
        console.log("[e2e] RESULT=FAIL (marker missing — origin not stable)");
        killServer();
        app.exit(3);
        return;
      }
      // Also verify a POST round-trips through the app:// proxy: POST a
      // JSON body to a real route — even a 4xx validation response proves
      // the request + body reached the server through the protocol handler.
      const postStatus = await mainWindow.webContents.executeJavaScript(
        `fetch("/api/audits", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ e2eProbe: true }) })` +
        `.then(r => r.status).catch(e => "ERR:" + e.message)`
      );
      console.log(`[e2e] POST_STATUS=${String(postStatus)}`);
      const postPass = /^\d+$/.test(String(postStatus));
      console.log(`[e2e] RESULT=${value && postPass ? "PASS" : "FAIL"}`);
      if (!postPass) {
        killServer();
        app.exit(4);
        return;
      }
    }
    killServer();
    app.exit(0);
  } catch (err) {
    console.error("[e2e] RESULT=ERROR", err);
    killServer();
    app.exit(5);
  }
}

async function bootstrap() {
  // Show splash immediately
  createSplashWindow();

  // `electron:dev` runs the dev server externally and points us at it —
  // attach over http (HMR needs the real origin, not the app:// proxy).
  const externalUrl = isDev ? process.env.FORGE_DEV_URL : undefined;
  if (externalUrl && !useProdServer) {
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
    await createWindow(`http://${HOST}:${serverPort}`);
    await runE2ECheck();
    return;
  }

  // Pick the launch port:
  //  - ephemeral (PORT=0, OS-assigned) by default → conflicts impossible
  //  - a fixed port only when explicitly requested via env (CI, tooling)
  const requested = envPort("FORGE_PORT") ?? envPort("PORT");
  let launchPort = 0;
  if (requested && requested > 0) {
    launchPort = (await findAvailablePort(requested)) || 0; // 0 here = "none free"
    if (launchPort === 0) {
      console.warn(`[forge] Requested port ${requested} (+${MAX_PORT_PROBES}) all busy — using an ephemeral port instead.`);
      launchPort = 0;
    } else if (launchPort !== requested) {
      console.warn(`[forge] Port ${requested} busy — using ${launchPort} instead.`);
    }
  } else {
    launchPort = 0; // ephemeral
  }
  console.log(`[forge] Server port: ${launchPort === 0 ? "ephemeral (OS-assigned)" : launchPort}`);

  // Start the server; retry on the next free port if a fixed port gets
  // stolen between probe and bind (EADDRINUSE). Ephemeral can't collide.
  for (let attempt = 1; attempt <= MAX_START_ATTEMPTS; attempt++) {
    nextServer = startNextServer(launchPort);

    // Discover the ACTUAL port (banner) — for ephemeral this is the only
    // way to know it; for fixed ports it confirms the bind.
    const discovered = await waitForPortFromServer();
    const actualPort = discovered || launchPort;

    if (actualPort > 0 && !serverExited) {
      const ready = await waitForServer(actualPort);
      if (ready) {
        serverPort = actualPort;
        console.log(`[forge] Server ready on ${HOST}:${actualPort}`);
        // Serve the app on the stable app:// origin, proxying to the server.
        registerAppProtocol(actualPort);
        await createWindow(APP_ORIGIN + "/", `http://${HOST}:${actualPort}`);
        await runE2ECheck();
        return;
      }
    }

    const addrInUse = serverExited && /EADDRINUSE/i.test(serverStartError);
    if (addrInUse && launchPort > 0 && attempt < MAX_START_ATTEMPTS) {
      console.warn(
        `[forge] Port ${launchPort} was taken during startup ` +
        `(attempt ${attempt}/${MAX_START_ATTEMPTS}) — trying the next free port…`
      );
      launchPort = (await findAvailablePort(launchPort + 1)) || 0;
      if (launchPort === 0) break;
      continue;
    }
    break; // Unrecoverable — show the error below
  }

  showErrorDialog(serverStartError || "Server did not respond in time.");
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
    if (BrowserWindow.getAllWindows().length === 0 && serverReady && serverPort > 0) {
      registerAppProtocol(serverPort);
      createWindow(APP_ORIGIN + "/", `http://${HOST}:${serverPort}`);
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
  killServer();
});
