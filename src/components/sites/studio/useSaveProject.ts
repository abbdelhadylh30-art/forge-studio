"use client"

import { toast } from "sonner"
import { useForge } from "@/lib/landing/store"
import { normalizeConfig } from "@/lib/landing/yaml"
import { upsertLocalProject } from "@/lib/landing/localProjects"
import type { ProjectWithConfig } from "@/lib/landing/types"

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
  const setSaving = useForge((s) => s.setSaving)
  const markSaved = useForge((s) => s.markSaved)
  const setProjectMeta = useForge((s) => s.setProjectMeta)

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
        // slug travels along so a COLD instance (which never saw the POST that
        // created this project) can re-create it with the right published URL
        body: JSON.stringify({ name: project.name, slug: project.slug, config: normalizeConfig(config) }),
      })
      if (!res.ok) throw new Error(describeSaveFailure(res.status))
      const saved = (await res.json().catch(() => null)) as ProjectWithConfig | null
      markSaved()
      // the server is the source of truth for the slug (a recreate may have
      // suffixed it -2 when the plain slug was taken on that instance)
      if (saved?.slug && saved.slug !== project.slug) {
        setProjectMeta(project.name, saved.slug)
      }
      // confirm the durable browser copy at the moment of a successful save
      upsertLocalProject({
        id: project.id,
        name: project.name,
        slug: saved?.slug || project.slug,
        updatedAt: Date.now(),
        config: normalizeConfig(config),
      })
      if (!opts?.silent) toast.success("Project saved", { description: project.name })
    } catch (e) {
      const message = e instanceof Error ? e.message : undefined
      // the local registry mirror (SitesApp effect) already holds the newest
      // config — a failed server save costs nothing but a sync retry
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

  return { save, saving: useForge((s) => s.saving), dirty: useForge((s) => s.dirty), hasProject: Boolean(project.id), lastSavedAt: useForge((s) => s.lastSavedAt) }
}
