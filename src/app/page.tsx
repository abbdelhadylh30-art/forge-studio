"use client";

import { useForge } from "@/lib/forge/store";
import { ForgeDashboard } from "@/components/forge/Dashboard";
import { BuilderShell } from "@/components/builder/editor/BuilderShell";
import { AuditorShell } from "@/components/forge/AuditorShell";
import { TemplatesGallery } from "@/components/builder/templates/TemplatesGallery";
import { SitesApp } from "@/components/sites/SitesApp";
import { CommandPalette } from "@/components/builder/editor/CommandPalette";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  const view = useForge((s) => s.view);

  return (
    <>
      {view === "dashboard" && <ForgeDashboard />}
      {view === "builder" && <BuilderShell />}
      {view === "templates" && <TemplatesGallery />}
      {view === "auditor" && <AuditorShell />}
      {view === "sites" && <SitesApp />}
      {/* Global cmdk palette — Ctrl/Cmd+K from any view (the Sites module
          ships its own palette, so we skip it there to avoid double ⌘K) */}
      {view !== "sites" && <CommandPalette />}
      <Toaster />
    </>
  );
}
