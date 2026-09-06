"use client";

import { useForge } from "@/lib/forge/store";
import { ForgeDashboard } from "@/components/forge/Dashboard";
import { AuditorShell } from "@/components/forge/AuditorShell";
import { SitesApp } from "@/components/sites/SitesApp";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  const view = useForge((s) => s.view);

  return (
    <>
      {view === "dashboard" && <ForgeDashboard />}
      {view === "auditor" && <AuditorShell />}
      {view === "sites" && <SitesApp />}
      <Toaster />
    </>
  );
}
