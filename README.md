# Forge Studio

**Build. Audit. Publish. Ship.** — The all-in-one landing page studio.

Drag-drop builder + 5-category auditor with one-click fixes + the landing-forge Sites studio: AI page generation, published pages with built-in analytics, section-level A/B testing, and a leads inbox — no code, no plugins, no sign-up.

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

### Landing Sites (from landing-forge)
The full landing-forge studio, embedded as a fourth view:
- Drag & drop section list — reorder, duplicate, hide, delete **13 section types** (navbar, hero, logos, features, stats, testimonials, pricing, FAQ, gallery, **about**, contact, final CTA, footer) with 40+ content packs
- **AI prompt → full page** (`/api/ai/generate`), AI copy improve, AI images
- **YAML import/export** — round-trips with the landing-forge CLI config format
- **Multilingual publishing** — per-section AI translation into any locale, RTL (Arabic/Hebrew/Farsi/Urdu), language switcher on the published page, `?lang=` deep links
- **Per-section entrance animations** — fade/slide/zoom on scroll into view (respects `prefers-reduced-motion`, included in the HTML export)
- **Section-level A/B testing** — weighted per-visitor assignment, per-variant engagement/read counts, confidence + auto-winner + one-click Promote
- **Published pages** at `/p/<slug>` — server-rendered SEO (OG + Twitter card + JSON-LD + canonical + sitemap), real visitor tracking (pageviews, referrers, countries, devices, bounce, section reads, CTA attribution)
- **Analytics dashboard** — live socket.io relay ("right now" visitors + event ticker), traffic charts, conversion funnel, section performance, leads inbox, CSV export, traffic simulation
- **Readiness audit** — weighted score (SEO, content, links, brand) with fix suggestions
- **Deploy simulation** with streaming build logs + published-page URL
- 6 one-click themes + Google webfont pairs + custom accent

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

# Ported from landing-forge? Push the new Prisma models first
bun run db:push

# Start the dev server (auto-picks the first free port from 3000,
# and prints/records it in dev.port — no more EADDRINUSE crashes)
bun run dev

# Start elsewhere explicitly
PORT=3005 bun run dev        # or: bun run dev -- 3005

# Desktop shell (dev): boots the dev server + Electron together
bun run electron:dev

# Run lint
bun run lint

# Run tests
bun x vitest run

# Push the Prisma schema to SQLite
bun run db:push
```

## Deploying on Vercel

The repo is already wired for Vercel (`vercel.json`: bun install + `next build`,
`DATABASE_URL=file:/tmp/prod.db`) — push to `main` and the Git integration
deploys automatically. Since **v1.5.1** the serverless deployment is fully
self-healing, no manual setup:

- **Runtime schema provisioning** — `ensureSchema()` (src/lib/db.ts) creates all
  30 tables/indexes exactly like `prisma db push` on the first request of a
  cold instance. No build step or CLI needed inside the lambda.
- **Writable uploads** — the app FS is read-only on Vercel, so AI-generated and
  uploaded images are stored in `/tmp/uploads` and streamed back through the
  `GET /api/uploads/<name>` route. Template-bundled images keep their static
  `/uploads/<name>` URLs.
- **Honest 404s** — unknown `/p/<slug>` pages return a real HTTP 404 when the
  database is deterministic (local / desktop). On Vercel the page falls through
  to the client shell instead, because route lambdas don't share the ephemeral
  SQLite — the client fetches `/api/sites` from the lambda that has the site
  and renders normally.

Known serverless limits (by design, honest trade-offs): the SQLite file is
**per-instance and ephemeral** — a cold start begins with an empty database and
the Sites studio re-bootstraps its demo site; data doesn't survive instance
recycling. For durable server-side history, point `DATABASE_URL` at Turso or
Postgres. The socket.io live-analytics relay (mini-services/analytics-live,
port 3003) is a local companion service — on Vercel the dashboard silently
falls back to REST polling. Optional env vars: `NEXT_PUBLIC_SITE_URL` (canonical
/ OG absolute URLs), `PSI_API_KEY` (dedicated PageSpeed quota).

## Troubleshooting

**"EADDRINUSE ::1:3000" on launch (v1.3.0 and earlier).**
Something else on your machine was holding port 3000 (a leftover
`node.exe`, another dev server, Docker, …) and old versions crashed on
it. **Since v1.4.1 the app doesn't use any fixed port at all**: the
internal server binds an OS-assigned ephemeral port (picked fresh by
Windows at every launch), and the UI loads over an internal `app://`
protocol — so port conflicts are structurally impossible. Just grab the
latest release. On old versions, free the port:

```powershell
netstat -ano | findstr :3000      # note the PID in the last column
taskkill /PID <that-PID> /F
```

…or simply reboot, then launch the app again.

**Where did my data go after an update?**
Nowhere — the desktop app runs on the stable `app://local` origin, so
your projects, audits, and pages live in the same storage regardless of
which port the server got. (Data is stored per-origin in localStorage.)

**Windows shows "SmartScreen protected your PC" / blocks the installer.**
The exe is unsigned, so Windows warns on first run. Click
**More info → Run anyway**. If Defender quarantined it, restore it from
*Protection history* and add an exclusion for the Forge Studio folder.

**The app window is blank or takes ~30s on first launch.**
The first run self-extracts and compiles caches — the splash spinner can
sit for a while. Give it up to a minute before assuming it failed.

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
│   ├── sites/                    # Landing Sites studio (from landing-forge): SitesApp, panels, preview sections, dashboard, published page
│   ├── pixelforge/               # Page Auditor UI
│   │   ├── editor/               # AppShell, TopBar, DeviceBar, LayerPanel, Preview, RightPanel, GuideOverlay, ChangelogFab
│   │   ├── modals/               # Import, Competitor, A/B, Tools, Export
│   │   ├── panels/               # Score, Edit, OG, Share
│   │   └── shared/               # Toasts, confetti, improvement toast
│   └── ui/                       # shadcn/ui base components
├── lib/
│   ├── builder/                  # Builder store, section registry, templates, renderer
│   ├── forge/                    # Unified store (view switching + transfer bridge)
│   ├── landing/                  # Sites engine: types, themes, defaults, YAML, A/B, readiness, i18n, export
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

Built as a Next.js 16 reimagining of three earlier projects:
- **LandingForge v4** — the drag-drop builder
- **PixelForge v19** — the page auditor
- **landing-forge (abbdelhadylh30-art)** — the visual landing-page studio with analytics, A/B testing and published pages (ported whole as the Sites view, per the [kasimmj/landing-forge](https://github.com/kasimmj/landing-forge) vision)

Combined into Forge Studio with a bidirectional transfer bridge so pages flow freely between build and audit — plus the Sites studio for publish-and-measure workflows.
