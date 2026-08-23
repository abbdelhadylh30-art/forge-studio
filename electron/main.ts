/**
 * Forge Studio — Electron Main Process
 * -----------------------------------
 * Spawns the Next.js standalone server as a child process, shows a
 * loading window while it boots, then loads the app.
 *
 * Robustness:
 * - Shows a loading splash immediately so the user sees something
 * - If the server fails to start, shows an error dialog with the reason
 * - Uses a random available port (avoids conflicts with dev server)
 * - Properly handles Windows paths and process management
 */

import { app, BrowserWindow, shell, dialog } from "electron";
import { spawn, ChildProcess, exec } from "node:child_process";
import { join } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import * as net from "node:net";

let nextServer: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let serverPort = 3000;

const isDev = !app.isPackaged;

/** Find an available port starting from 3000. */
function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => resolve(port));
    });
    server.on("error", () => {
      // Port in use, try next
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

/** Wait for the Next.js server to respond. */
async function waitForServer(port: number, maxRetries = 60): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`http://localhost:${port}`);
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
    // Dev mode: run `next dev`
    cwd = process.cwd();
    cmd = "npx";
    args = ["next", "dev", "-p", String(port)];
    env = { ...process.env };
  } else {
    // Production: run the standalone server
    // The standalone output is in resources/app/.next/standalone/
    cwd = join(process.resourcesPath, "app", ".next", "standalone");
    cmd = "node";
    args = ["server.js"];
    env = {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      // Prevent Electron from interfering with the child Node process
      ELECTRON_RUN_AS_NODE: undefined as any,
      // Set the hostname explicitly
      HOSTNAME: "localhost",
    };
  }

  // On Windows, use shell:true so it can find node/npx
  const child = spawn(cmd, args, {
    cwd,
    shell: true,
    stdio: "pipe",
    env,
  });

  let errorOutput = "";

  child.stdout?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) console.log(`[next] ${msg}`);
  });

  child.stderr?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) {
      console.error(`[next] ${msg}`);
      errorOutput += msg + "\n";
    }
  });

  child.on("error", (err) => {
    console.error("[next] Spawn error:", err);
    errorOutput += "Spawn error: " + err.message;
    showErrorDialog(errorOutput);
  });

  child.on("exit", (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`[next] Server exited with code ${code}`);
      showErrorDialog(errorOutput || `Server exited with code ${code}`);
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
    `3. Check if port 3000 is already in use`
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
  await mainWindow.loadURL(`http://localhost:${port}`);

  // Close splash and show main window
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
  mainWindow.show();
  mainWindow.focus();
}

app.whenReady().then(async () => {
  // Show splash immediately
  createSplashWindow();

  // Find an available port
  serverPort = await findAvailablePort(3000);
  console.log(`[forge] Using port ${serverPort}`);

  // Start the Next.js server
  nextServer = startNextServer(serverPort);

  // Wait for it to be ready
  const isReady = await waitForServer(serverPort);
  if (!isReady) {
    console.error("[forge] Failed to start Next.js server");
    showErrorDialog("Server did not respond within 30 seconds.");
    return;
  }

  console.log("[forge] Server ready, creating window…");

  // Create the window
  await createWindow(serverPort);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(serverPort);
    }
  });
});

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
