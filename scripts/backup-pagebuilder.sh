#!/usr/bin/env bash
# Backup the old Page Builder ("Start Building") module before stripping it.
# Produces a self-contained zip with the module + glue files + RESTORE notes.
set -euo pipefail
cd /home/z/my-project

STAMP=v1.9.4
TAG="page-builder-final-$STAMP"
OUT=/tmp/forge-page-builder-backup
ZIP=/home/z/my-project/download/forge-page-builder-backup.zip

# 1) git tag the pre-strip state (recoverable from history forever)
git tag -f "$TAG" 2>/dev/null || true

# 2) assemble the module snapshot
rm -rf "$OUT" && mkdir -p "$OUT"/{src/app/api,src/components/forge,src/lib/forge,src/app}
cp -r src/components/builder "$OUT/src/components/"
cp -r src/lib/builder      "$OUT/src/lib/"
cp    src/app/api/export/route.ts "$OUT/src/app/api/export-route.ts.txt"
cp    src/app/page.tsx            "$OUT/src/app/page.tsx.txt"
cp    src/components/forge/Dashboard.tsx   "$OUT/src/components/forge/"
cp    src/components/forge/AuditorShell.tsx "$OUT/src/components/forge/"
cp    src/lib/forge/store.ts      "$OUT/src/lib/forge/"
cp    src/lib/forge/store.test.ts "$OUT/src/lib/forge/" 2>/dev/null || true

# 3) restore instructions
cat > "$OUT/RESTORE.md" << 'EOF'
# Forge Studio — Page Builder backup

This zip snapshots the OLD "Start Building" Page Builder module exactly as it
shipped in forge-studio v1.9.4 (git tag: page-builder-final-v1.9.4), before it
was retired in v2.0.0 in favor of the Sites builder.

## What's inside
- `src/components/builder/**` — the full editor UI (shell, canvas, inspector,
  top bar, templates gallery, command palette, dialogs, 12 section components)
- `src/lib/builder/**` — section registry/renderer/types, Zustand store with
  autosave, 5 starter templates, unit tests
- `src/app/api/export-route.ts.txt` — /api/export (HTML/ZIP export route,
  imports builder types)
- `src/app/page.tsx.txt`, `src/components/forge/Dashboard.tsx`,
  `src/components/forge/AuditorShell.tsx`, `src/lib/forge/store.ts` — the
  glue files as they were, showing exactly how the module was wired
  (view switching, transfer bridge, dashboard cards)

## How to restore
Preferred (from git history — identical content):
    git checkout page-builder-final-v1.9.4
    # or, onto a newer branch:
    git checkout page-builder-final-v1.9.4 -- src/components/builder src/lib/builder src/app/api/export

From this zip:
    1. copy `src/components/builder` and `src/lib/builder` back into the repo
    2. restore /api/export from `src/app/api/export-route.ts.txt`
    3. re-add the `builder`/`templates` views to src/lib/forge/store.ts and
       the view branches in src/app/page.tsx (see the included .txt snapshots)
    4. `npm install && npm run dev`

The module is 100% client-side (localStorage autosave, no dedicated API
routes besides /api/export), so it runs anywhere the rest of the app does.
EOF

# 4) zip it (store the README first so it's the first entry)
cd "$OUT" && rm -f "$ZIP" && zip -r -q "$ZIP" RESTORE.md src
cd /home/z/my-project && unzip -t "$ZIP" > /dev/null && echo "zip integrity OK"

# 5) mirror into public/downloads (gitignored) so the /downloads page serves it
mkdir -p public/downloads
cp "$ZIP" public/downloads/
ls -la "$ZIP" public/downloads/forge-page-builder-backup.zip
md5sum "$ZIP"
echo "tag: $TAG"
