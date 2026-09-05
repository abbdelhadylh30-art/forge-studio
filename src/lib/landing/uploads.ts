// ─────────────────────────────────────────────────────────────────────────────
// uploads — writable image storage helpers.
//
// Local / Electron: images live in public/uploads and are served as static
// files at /uploads/<name>.
//
// Vercel / serverless: the app filesystem is READ-ONLY, so new images are
// written to /tmp/uploads (writable, ephemeral per instance) and served by
// the /api/uploads/<name> route handler. Template-bundled images that ship
// in public/uploads keep their static /uploads/<name> URLs.
// ─────────────────────────────────────────────────────────────────────────────
import path from "node:path"

/** True on Vercel serverless (read-only app FS, writable /tmp). */
export function isServerless(): boolean {
  return process.env.VERCEL === "1" || process.env.VERCEL === "true"
}

/** Writable directory for NEW uploads: /tmp/uploads on serverless, public/uploads otherwise. */
export function uploadDir(): string {
  return isServerless() ? "/tmp/uploads" : path.join(process.cwd(), "public", "uploads")
}

/** Read-only directory of template-bundled images (part of the deployment bundle). */
export function bundledDir(): string {
  return path.join(process.cwd(), "public", "uploads")
}

/** Public URL for a file stored by uploadDir(). */
export function publicUrl(name: string): string {
  return isServerless() ? `/api/uploads/${name}` : `/uploads/${name}`
}
