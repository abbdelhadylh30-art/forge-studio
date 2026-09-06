"use client"

import { toast } from "sonner"
import { useForge } from "@/lib/landing/store"
import { normalizeConfig } from "@/lib/landing/yaml"

/**
 * Silent-save failure throttle: serverless instances can flake per-request.
 * One quiet toast per 5 minutes beats a 3s-interval toast flood, while the
 * local backup mirror keeps the actual data safe regardless.
 */
let lastOfflineToastAt = 0
const OFFLINE_TOAST_INTERVAL_MS = 5 * 60 * 1000

function describeSaveFailure(status: number): string {
  if (status === 404) {
    return "The server instance no longer knows this project. Your edits are safe in this browser — re-create the project from the Projects view."
  }
  if (status === 503) {
    return "The database on this server instance is unavailable. Retrying in a moment usually reaches a healthy instance."
  }
  if (status === 413) {
    return "The project is too large to save — remove some images or sections."
  }
  return `The server rejected the save (status ${status}).`
}

export function useSaveProject() {
  const project = useForge((s) => s.project)
  const config = useForge((s) => s.config)
  const saving = useForge((s) => s.saving)
  const setSaving = useForge((s) => s.setSaving)
  const markSaved = useForge((s) => s.markSaved)

  const save = async (opts?: { silent?: boolean }) => {
    if (!project.id) {
      if (!opts?.silent) {
        toast.error("Working locally", {
          description: "This page isn't on the server yet — your edits are kept in this browser.",
        })
      }
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/sites/${project.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: project.name, config: normalizeConfig(config) }),
      })
      if (!res.ok) throw new Error(describeSaveFailure(res.status))
      markSaved()
      if (!opts?.silent) toast.success("Project saved", { description: project.name })
    } catch (e) {
      const message = e instanceof Error ? e.message : undefined
      if (opts?.silent) {
        // autosave path: log always, toast at most once per 5 minutes
        console.warn("[sites] silent autosave failed:", message)
        if (Date.now() - lastOfflineToastAt > OFFLINE_TOAST_INTERVAL_MS) {
          lastOfflineToastAt = Date.now()
          toast.warning("Autosave couldn't reach the server", {
            description: "Edits are mirrored in this browser — nothing is lost. Retrying happens automatically.",
          })
        }
      } else {
        toast.error("Save failed", { description: message })
      }
    } finally {
      setSaving(false)
    }
  }

  return { save, saving, dirty: useForge((s) => s.dirty), hasProject: Boolean(project.id), lastSavedAt: useForge((s) => s.lastSavedAt) }
}
