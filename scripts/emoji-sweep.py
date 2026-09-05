#!/usr/bin/env python3
"""Sweep childish emojis out of Sites UI strings (toasts, badges, hints).
Targeted, exact replacements only — no blind regex over code."""

from pathlib import Path

ROOT = Path("/home/z/my-project/src/components/sites")

# (file, old, new) — exact string replacements
EDITS = [
    # DashboardView
    ("dashboard/DashboardView.tsx",
     'toast.success(mode === "append" ? "Demo traffic appended 🌍" : "Demo traffic generated 🌍", {',
     'toast.success(mode === "append" ? "Demo traffic appended" : "Demo traffic generated", {'),
    ("dashboard/DashboardView.tsx",
     'toast.success("Leads CSV exported 📄",',
     'toast.success("Leads CSV exported",'),
    # ProjectsView
    ("projects/ProjectsView.tsx",
     'toast.success("Published link copied 🔗",',
     'toast.success("Published link copied",'),
    # SitesApp
    ("SitesApp.tsx",
     'toast.success(`Welcome to Sites ⚒️`, {',
     'toast.success(`Welcome to Sites`, {'),
    # PublishedPage
    ("published/PublishedPage.tsx",
     'toast.success("CTA click tracked 🎯",',
     'toast.success("CTA click tracked",'),
    ("published/PublishedPage.tsx",
     'toast.success("Message sent ✅", {',
     'toast.success("Message sent", {'),
    ("published/PublishedPage.tsx",
     'toast.success("Link copied 🔗",',
     'toast.success("Link copied",'),
    # Toolbar
    ("studio/Toolbar.tsx",
     'toast.info("Published page opened 🔗", {',
     'toast.info("Published page opened", {'),
    # PropertiesPanel
    ("studio/PropertiesPanel.tsx",
     'toast.success("Image generated ✨",',
     'toast.success("Image generated",'),
    ("studio/PropertiesPanel.tsx",
     'toast.success("Image uploaded ⬆",',
     'toast.success("Image uploaded",'),
    ("studio/PropertiesPanel.tsx",
     'toast.success(`Translated to ${locale.toUpperCase()} 🌐`,',
     'toast.success(`Translated to ${locale.toUpperCase()}`,'),
    # DeployDialog
    ("studio/DeployDialog.tsx",
     'toast.success("Deployed 🚀",',
     'toast.success("Deployed",'),
    ("studio/DeployDialog.tsx",
     'toast.success("Published link copied 🔗",',
     'toast.success("Published link copied",'),
    # useSaveProject
    ("studio/useSaveProject.ts",
     'toast.success("Project saved 💾",',
     'toast.success("Project saved",'),
    # DevicePreview
    ("studio/DevicePreview.tsx",
     'toast.info("Pageview tracked 🔎",',
     'toast.info("Pageview tracked",'),
    ("studio/DevicePreview.tsx",
     'toast.success("CTA click tracked 🎯",',
     'toast.success("CTA click tracked",'),
    ("studio/DevicePreview.tsx",
     'toast.success("Lead captured 📥",',
     'toast.success("Lead captured",'),
    # CommandPalette
    ("studio/CommandPalette.tsx",
     'toast.info("Published page opened 🔗", {',
     'toast.info("Published page opened", {'),
    ("studio/CommandPalette.tsx",
     'toast.success(`Deep link copied 🔗 #${anchor}`,',
     'toast.success(`Deep link copied #${anchor}`,'),
    # ImageLibraryDialog hint text
    ("studio/ImageLibraryDialog.tsx",
     'Generate one with the ✨ button in a hero or gallery section',
     'Generate one with the sparkle button in a hero or gallery section'),
    # Dialogs
    ("studio/Dialogs.tsx",
     'toast.success("YAML imported 📦",',
     'toast.success("YAML imported",'),
    ("studio/Dialogs.tsx",
     'toast.success("Standalone HTML downloaded 📦",',
     'toast.success("Standalone HTML downloaded",'),
]

changed = 0
missed = []
for rel, old, new in EDITS:
    p = ROOT / rel
    text = p.read_text(encoding="utf-8")
    if old in text:
        p.write_text(text.replace(old, new), encoding="utf-8")
        changed += 1
        print(f"OK   {rel}: replaced")
    else:
        missed.append((rel, old))
        print(f"MISS {rel}: {old[:60]!r}")

print(f"\n{changed} replaced, {len(missed)} missed")
if missed:
    for rel, old in missed:
        print("  missed:", rel, old[:70])
