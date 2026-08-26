# Forge Studio

**Build. Audit. Ship.** — The all-in-one landing page studio.

Drag-drop builder + 5-category auditor with one-click fixes. Build, audit, and ship landing pages in one place — no code, no plugins, no sign-up.

**Try it live:** <https://forge-studio-green.vercel.app> · **Windows app:** grab the installer from the [latest release](https://github.com/abbdelhadylh30-art/forge-studio/releases/latest)

## What's inside

### Page Builder
- 20 section types (Navbar, Hero, Logocloud, Features, Stats, Gallery, Testimonials, Pricing, FAQ, CTA, Newsletter, Footer, Announcement, Problem, Solution, Video, Comparison, Guarantee, Contactform, Legal)
- 5 pre-built templates (SaaS, Portfolio, Agency, E-commerce, Startup)
- 8 theme presets + custom colors, fonts & corner radius
- Drag-and-drop section reordering
- Multi-page sites
- Inline editing with auto-generated inspector forms
- AI copy suggestions (3 variants, 5 tone presets)
- Device preview (desktop / tablet / mobile)
- HTML + JSON export
- 50-deep undo/redo with Ctrl+Z / Ctrl+Shift+Z

### Page Auditor
- 0–100 score across 5 categories (SEO, Content, Accessibility, Structure, Performance)
- 30+ individual checks with severity, points, and selector
- 38 one-click quick-fixes that mutate the iframe DOM
- "Fix All Safe" button applies all safe fixes in sequence
- 4-tab right panel: Score, Edit, OG (social preview), Share
- URL import via server-side CORS proxy (Fetch mode) or direct iframe (Live mode)
- Bidirectional transfer: send builder HTML to auditor, or send audited HTML back to builder
- 80-deep undo/redo with changelog
- 10 tools: PDF report, White label, Platform export, Client mode, Auto monitor, Heatmap sim, Conversion score, Team comments, Page speed sim, Above-fold analysis
- Guided walkthrough with spotlight + checklist

### Cross-cutting
- **Autosave + recovery** — both builder and auditor persist to localStorage; refresh the page and your work is still there
- **Honest UX** — simulated tools are labelled "Sim" / "Estimate" / "Beta"; user-friendly error messages throughout
- **Security** — SSRF guard, prompt-injection fencing, header-injection sanitization, sandboxed iframes, zod-validated APIs
- **Accessibility** — aria-labels on icon-only buttons, semantic landmarks, prefers-reduced-motion support

## Tech stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York)
- **State**: Zustand (client) + TanStack Query (server)
- **DnD**: @dnd-kit
- **Database**: Prisma ORM (SQLite)
- **AI**: z-ai-web-dev-sdk (server-side only)
- **Validation**: Zod
- **Testing**: Vitest + jsdom + @testing-library

## Getting started

```bash
# Install dependencies
bun install

# Start the dev server (http://localhost:3000)
bun run dev

# Run lint
bun run lint

# Run tests
bun x vitest run

# Push the Prisma schema to SQLite
bun run db:push
```

## Project structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # Server-side routes
│   │   ├── ai-copy/              # AI copy suggestions (z-ai-web-dev-sdk)
│   │   ├── fetch-url/            # CORS-safe URL proxy with SSRF guard
│   │   ├── export/               # ZIP export (HTML + CSS + README)
│   │   └── export-html/          # Standalone HTML export
│   ├── globals.css               # Tailwind + PixelForge theme variables
│   ├── layout.tsx                # Root layout + metadata
│   └── page.tsx                  # View switcher (dashboard / builder / auditor / templates)
├── components/
│   ├── builder/                  # Page Builder UI
│   │   ├── editor/               # TopBar, Canvas, Inspector, BuilderShell, ExportDialog
│   │   ├── sections/             # 12 section renderers + SectionRenderer
│   │   └── templates/            # TemplatesGallery
│   ├── forge/                    # Unified shell (Dashboard, AuditorShell)
│   ├── pixelforge/               # Page Auditor UI
│   │   ├── editor/               # AppShell, TopBar, DeviceBar, LayerPanel, Preview, RightPanel, GuideOverlay, ChangelogFab
│   │   ├── modals/               # Import, Competitor, A/B, Tools, Export
│   │   ├── panels/               # Score, Edit, OG, Share
│   │   └── shared/               # Toasts, confetti, improvement toast
│   └── ui/                       # shadcn/ui base components
├── lib/
│   ├── builder/                  # Builder store, section registry, templates, renderer
│   ├── forge/                    # Unified store (view switching + transfer bridge)
│   ├── pixelforge/               # Auditor store, scoring engine, quick-fixes, sample page
│   └── security/                 # SSRF guard, sanitizer, rate limiter
└── hooks/                        # use-mobile, use-toast
prisma/
└── schema.prisma                 # Project, Audit, Issue, QuickFix, etc.
```

## Documentation

- `REQUIREMENTS.md` — Functional and non-functional requirements (SWEBOK format)
- `worklog.md` — Multi-agent work log with full history of decisions and changes

## License

MIT — see `LICENSE`.

## Acknowledgements

Built as a Next.js 16 reimagining of two earlier projects:
- **LandingForge v4** — the drag-drop builder
- **PixelForge v19** — the page auditor

Combined into Forge Studio with a bidirectional transfer bridge so pages flow freely between build and audit.
