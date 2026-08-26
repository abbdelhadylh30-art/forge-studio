# Forge Studio — Requirements Specification

**Version:** 1.2.0 · **Status:** Living document · **SWEBOK KA:** Software Requirements

This document captures the functional and non-functional requirements for Forge Studio. It follows the structure recommended by SWEBOK v3.0 Chapter 1 (Software Requirements): functional requirements, non-functional requirements (quality attributes), and constraints.

## 1. Purpose & Scope

Forge Studio is an all-in-one landing-page studio that combines a no-code drag-drop **page builder** with a 5-category **page auditor** and one-click fixes. The two tools are connected by a bidirectional transfer bridge so a page built in the builder can be audited, and a page imported into the auditor can be edited in the builder.

The tool is a single-user, client-side-heavy application with server-side API routes for URL fetching, AI copy generation, and HTML/ZIP export. It runs as a Next.js 16 app on a single port (3000) behind a Caddy gateway.

## 2. Functional Requirements

### FR-1: Dashboard (landing view)
- **FR-1.1** The root route (`/`) SHALL display a dashboard with two tool cards: Page Builder and Page Auditor.
- **FR-1.2** The dashboard SHALL show quick stats (section types, audit checks, quick-fixes, templates).
- **FR-1.3** The dashboard SHALL show a template quick-start grid (blank + 5 pre-built templates).
- **FR-1.4** The dashboard SHALL explain the 3-step workflow: Build → Audit → Fix & ship.

### FR-2: Page Builder
- **FR-2.1** The builder SHALL support 12 section types: Navbar, Hero, Logo cloud, Features, Stats, Gallery, Testimonials, Pricing, FAQ, CTA, Newsletter, Footer.
- **FR-2.2** The builder SHALL provide 5 pre-built templates (Northwind, Atelier, Globex, Hooli, Tidewave).
- **FR-2.3** The builder SHALL provide 7 theme presets (Slate, Midnight, Sunset, Forest, Rose, Ocean, Mono).
- **FR-2.4** The builder SHALL support drag-and-drop section reordering.
- **FR-2.5** The builder SHALL auto-generate an inspector form from each section's JSON schema.
- **FR-2.6** The builder SHALL offer AI copy suggestions for text fields marked `aiSuggest: true`.
- **FR-2.7** The builder SHALL support multi-page sites with a page switcher.
- **FR-2.8** The builder SHALL provide 50-deep undo/redo with Ctrl+Z / Ctrl+Shift+Z shortcuts.
- **FR-2.9** The builder SHALL provide device preview (desktop / tablet / mobile).
- **FR-2.10** The builder SHALL export a standalone HTML file or a ZIP (index.html + styles.css + README.txt).
- **FR-2.11** The builder SHALL provide an "Audit this page" button that transfers the current HTML to the auditor.

### FR-3: Page Auditor
- **FR-3.1** The auditor SHALL score any HTML document across 5 categories (SEO, Content, Accessibility, Structure, Performance), scaled to 0–100.
- **FR-3.2** The auditor SHALL provide 30+ individual checks with severity, points, and a selector to the offending element.
- **FR-3.3** The auditor SHALL provide 35+ one-click quick-fixes that mutate the iframe DOM.
- **FR-3.4** The auditor SHALL provide a "Fix All Safe" button that applies all safe fixes in sequence.
- **FR-3.5** The auditor SHALL provide a 4-tab right panel: Score, Edit, OG (social preview), Share.
- **FR-3.6** The auditor SHALL support URL import via a server-side CORS proxy (fetch mode) and direct iframe (live mode).
- **FR-3.7** The auditor SHALL provide an "Edit in builder" button that transfers the current HTML to the builder.
- **FR-3.8** The auditor SHALL provide 80-deep undo/redo with a changelog FAB.

### FR-4: Bidirectional transfer
- **FR-4.1** The unified `useForge` store SHALL hold a `pendingTransfer` payload (HTML + name + source + timestamp).
- **FR-4.2** Transferring SHALL switch the active view to the target tool and pre-load the HTML.

### FR-5: Desktop packaging (v1.2.0)
- **FR-5.1** The app SHALL ship as a Windows NSIS installer and a portable .exe via electron-builder.
- **FR-5.2** The packaged app SHALL bundle the Next.js standalone server as plain files (`asar: false`) so the child node process can execute it.
- **FR-5.3** Tag pushes matching `v*` SHALL publish the built installers to a GitHub Release automatically.
- **FR-5.4** The CI pipeline SHALL smoke-test both the standalone server and the packaged .exe (boot + serve HTTP 200) before publishing.

## 3. Non-Functional Requirements (Quality Attributes)

### NFR-1: Security (KA 2 §2.7)
- **NFR-1.1** The URL proxy SHALL reject URLs that resolve to private/loopback/link-local IPs (SSRF defense).
- **NFR-1.2** The URL proxy SHALL strip active content (scripts, on* handlers, javascript: URIs, `<object>`, `<embed>`, `<base>`, meta-refresh) from fetched HTML.
- **NFR-1.3** The AI copy route SHALL fence user-supplied text in delimited blocks with an instruction to ignore embedded commands (prompt-injection defense).
- **NFR-1.4** All export routes SHALL sanitize filenames before placing them in Content-Disposition headers (header-injection defense).
- **NFR-1.5** All API routes SHALL validate request bodies with zod.
- **NFR-1.6** Untrusted HTML SHALL be rendered in a sandboxed iframe with `allow-scripts` omitted.

### NFR-2: Reliability (KA 2 §2.5 / KA 9)
- **NFR-2.1** The scoring engine and quick-fixes SHALL be covered by automated unit tests (Vitest).
- **NFR-2.2** Quick-fixes SHALL return `applied: false` when no elements needed fixing (no-op guard).
- **NFR-2.3** "Fix All Safe" SHALL push exactly one history entry for the whole batch.
- **NFR-2.4** The lint check (`bun run lint`) SHALL pass with zero errors.

### NFR-3: Accessibility (KA 2 §4 / KA 9)
- **NFR-3.1** All icon-only buttons in the tool's own UI SHALL have an `aria-label`.
- **NFR-3.2** All form labels SHALL be associated with their inputs via matching `htmlFor`/`id`.
- **NFR-3.3** Animations SHALL respect `prefers-reduced-motion`.
- **NFR-3.4** The tool SHALL use semantic landmarks (`<main>`, `<header>`, `<nav>`).

### NFR-4: Maintainability (KA 5)
- **NFR-4.1** The codebase SHALL have no duplicated copy of itself in the repo.
- **NFR-4.2** Exported functions in `src/lib/` SHALL have JSDoc comments.
- **NFR-4.3** A CHANGELOG.md SHALL track all notable changes (Keep-a-Changelog format).

### NFR-5: Performance
- **NFR-5.1** The iframe click handler SHALL be cleaned up on every state change (no accumulation).
- **NFR-5.2** Quick-fix score diffs SHALL be computed synchronously (no stale reads).

## 4. Constraints
- **C-1** Framework: Next.js 16 with App Router (non-negotiable).
- **C-2** Language: TypeScript 5 (non-negotiable).
- **C-3** Only the `/` route is user-visible (view-switching via Zustand).
- **C-4** `z-ai-web-dev-sdk` MUST be used server-side only.
- **C-5** Single port (3000) exposed via Caddy gateway.

## 5. Requirements Tracing
Each requirement above maps to a SWEBOK Knowledge Area. The test suite in `src/**/*.test.ts` verifies the functional requirements; the lint + test pipeline verifies the non-functional requirements.
