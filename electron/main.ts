/**
 * Forge Studio — Electron Main Process
 * -----------------------------------
 * Spawns the Next.js standalone server as a child process, waits for it
 * to be ready, then opens a BrowserWindow pointing to localhost:3000.
 *
 * On quit, kills the child process cleanly.
 */

import { app, BrowserWindow, shell } from "electron";
import { spawn, ChildProcess } from "node:child_process";
import { join } from "node:path";
import { existsSync } from "node:fs";

let nextServer: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;

const PORT = 3000;
const isDev = !app.isPackaged;

/** Wait for the Next.js server to respond before opening the window. */
async function waitForServer(maxRetries = 30): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}`);
      if (res.ok || res.status === 404) return true; // 404 is fine — means server is up
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function startNextServer(): ChildProcess {
  let serverPath: string;
  let cwd: string;

  if (isDev) {
    // Dev mode: run `bun run dev` or `npm run dev`
    cwd = process.cwd();
    serverPath = "npx";
    const child = spawn(serverPath, ["next", "dev", "-p", String(PORT)], {
      cwd,
      shell: true,
      stdio: "pipe",
    });
    return child;
  }

  // Production: run the standalone server
  // Path: resources/app/.next/standalone/server.js
  cwd = join(process.resourcesPath, "app", ".next", "standalone");
  serverPath = "node";

  const child = spawn(serverPath, ["server.js"], {
    cwd,
    shell: true,
    stdio: "pipe",
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(PORT),
      ELECTRON_RUN_AS_NODE: "0",
    },
  });

  child.stdout?.on("data", (data: Buffer) => {
    console.log(`[next] ${data.toString().trim()}`);
  });

  child.stderr?.on("data", (data: Buffer) => {
    console.error(`[next] ${data.toString().trim()}`);
  });

  return child;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "Forge Studio",
    backgroundColor: "#ffffff",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, "preload.js"),
    },
    // Auto-hidden menu bar (Windows/Linux), clean on Mac
    autoHideMenuBar: true,
  });

  // Open external links in the user's browser, not in the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Load the Next.js app
  await mainWindow.loadURL(`http://localhost:${PORT}`);
}

app.whenReady().then(async () => {
  // Start the Next.js server
  nextServer = startNextServer();

  // Wait for it to be ready
  const isReady = await waitForServer();
  if (!isReady) {
    console.error("Failed to start Next.js server");
    app.quit();
    return;
  }

  // Create the window
  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
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
    nextServer.kill("SIGTERM");
    // Force kill after 3 seconds if it hasn't exited
    setTimeout(() => {
      if (nextServer && !nextServer.killed) {
        nextServer.kill("SIGKILL");
      }
    }, 3000);
  }
});
