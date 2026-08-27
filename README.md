# Forge Studio

**Build. Audit. Ship.** — The all-in-one landing page studio.

Drag-drop builder + 5-category auditor with one-click fixes. Build, audit, and ship landing pages in one place — no code, no plugins, no sign-up.

**Try it live:** <https://forge-studio-green.vercel.app> · **Windows app:** grab the installer from the [latest release](https://github.com/abbdelhadylh30-art/forge-studio/releases/latest)

## What's inside

### Page Builder
- 20 section types (Navbar, Hero, Logocloud, Features, Stats, Gallery, Testimonials, Pricing, FAQ, CTA, Newsletter, Footer, Announcement, Problem, Solution, Video, Comparison, Guarantee, Contactform, Legal)
- **LandingForge v21 engine** (v1.4) — per-section style variants + interactive JS in every export:
  - Hero image **carousel** with fade/zoom/flip/cube animations, autoplay & swipe
  - Gallery styles: grid · horizontal scroll-snap · accordion · infinite ticker · **stories** (progress bars) · vertical fade
  - Video layouts: centered · split · full-width · **cinematic fullscreen** with gradient veil
  - Pricing styles: tiered cards · **single offer card** (urgency badge + struck-through price) · **monthly/yearly toggle** with save badge
  - Testimonials grid or auto-playing **carousel**
  - FAQ accordion or side-by-side **cards**
  - Problem section as cards or interactive **tabs**
  - Comparison table renders `yes`/`no` as green ✓ / red ✗ matrix icons
  - Announcement bar: static, scrolling ticker, or **live countdown**
  - Contact form with **real submission** — Google Sheets (Apps Script), FormSubmit.co email, or demo toast — plus optional phone/company fields, honeypot spam trap & success redirect
  - **Mobile hamburger menu** in the exported navbar (with slide-down panel)
  - **Dark-mode toggle** shipped with every exported page (persisted)
  - **OG + Twitter card meta** and `theme-color` generated from page SEO settings
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
- 43 individual checks with severity, points, and selector
- 38 one-click quick-fixes that mutate the iframe DOM
- "Fix All Safe" button applies all safe fixes in sequence
- 4-tab right panel: Score, Edit, OG (social preview), Share
- URL import via server-side CORS proxy (Fetch mode) or direct iframe (Live mode)
- Bidirectional transfer: send builder HTML to auditor, or send audited HTML back to builder
- 80-deep undo/redo with changelog
- **Real PageSpeed Insights** (v1.3): Google Lighthouse lab metrics + Chrome UX Report field data for imported URLs, with the instant DOM-heuristic sim as an offline fallback — set `PSI_API_KEY` for dedicated quota
- **Audit history** (v1.3): save score snapshots (localStorage + Prisma) and review them on the dashboard — desktop/mobile split, error/warning counts, client & URL context
- 10 tools: PDF report, White label, Platform export, Client mode, Auto monitor, Heatmap sim, Conversion score, Team comments, Page Speed (real PSI + sim), Above-fold analysis
- Guided walkthrough with spotlight + checklist

### Cross-cutting
- **⌘K / Ctrl+K command palette** (v1.3) — fuzzy-searchable, grouped, view-aware commands (navigate, themes, sections, audit actions) available from any screen
- **Track in Build Ledger** (v1.3) — export any builder site or audit as a [Build Ledger](https://github.com/abbdelhadylh30-art/build-ledger) project entry; the payload passes Build Ledger's import guard as-is
- **Dark mode** (v1.3) — system-aware light/dark theme with a header toggle and a palette command; persisted across visits
- **PWA** (v1.3) — installable app with offline shell, generated icons, and app shortcuts (Builder / Auditor)
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
