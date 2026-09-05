"use client"

import { toast } from "sonner"
import { useForge } from "@/lib/landing/store"
import { normalizeConfig } from "@/lib/landing/yaml"

export function useSaveProject() {
  const project = useForge((s) => s.project)
  const config = useForge((s) => s.config)
  const saving = useForge((s) => s.saving)
  const setSaving = useForge((s) => s.setSaving)
  const markSaved = useForge((s) => s.markSaved)

  const save = async (opts?: { silent?: boolean }) => {
    if (!project.id) {
      if (!opts?.silent) toast.error("No project loaded yet")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/sites/${project.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: project.name, config: normalizeConfig(config) }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `Save failed (${res.status})`)
      markSaved()
      if (!opts?.silent) toast.success("Project saved", { description: project.name })
    } catch (e) {
      if (!opts?.silent) {
        toast.error("Save failed", { description: e instanceof Error ? e.message : undefined })
      }
    } finally {
      setSaving(false)
    }
  }

  return { save, saving, dirty: useForge((s) => s.dirty), hasProject: Boolean(project.id), lastSavedAt: useForge((s) => s.lastSavedAt) }
}
