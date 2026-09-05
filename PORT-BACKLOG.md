# LandingForge v21 → Sites Module — Remaining Port Backlog

Full gap analysis of `upload/landingForge.html` (v21, 25.5k lines) vs the Sites module
(`src/components/sites/` + `src/lib/landing/`). Everything in the original 8 phases
(icon bank, announcement, hero variants, narrative sections, gallery styles, dual-mode
themes, consent + tracking, form delivery, export readiness) is done. This is what remains.

## P1 — Offer section (missing entirely, highest conversion value)

v21 has a dedicated high-urgency offer block that Sites completely lacks (Sites' `pricing`
is a multi-plan table — a different pattern).

Port as new section type `offer`:
- Price display: current price + strikethrough original + period label
- Savings badge ("Save 50%") + urgency badge ("Limited spots")
- Live countdown timer (days/hrs/min/sec boxes) — reuse the announcement countdown engine
- Feature checklist (icon + text, v21 uses check icons per row)
- CTA button + trust row ("Secure checkout", "30-day guarantee" with icons)
- Styles: `single` (the card) and `tiered` (stacked bundles)

## P2 — Legal pages (missing entirely)

v21's Legal tab has no Sites equivalent (cookie consent was ported; legal pages were not):
- Privacy Policy + Terms content fields in the studio (per-site)
- Standalone `privacy.html` / `terms.html` export alongside the landing HTML
- Footer URL fields: docs / privacy / terms links
- "Export everything" package: index.html + privacy.html + terms.html + landing.yaml
  (v21 ships config.json — the YAML is our equivalent)

## P3 — Footer social links are decorative

Sites `footer.social` is `string[]` (labels) rendered as non-clickable icon buttons.
v21 has per-platform enable toggles + real URLs for 8 platforms
(twitter, facebook, instagram, tiktok, whatsapp, messenger, linkedin, github).

Port: `social: { platform: string; url: string; enabled?: boolean }[]`, platform-branded
icons (already in the icon bank pipeline), open in new tab with rel noopener.
Backward-compatible YAML coercion: old `string[]` keeps rendering icons (hidden when no URL).

## P4 — Missing style variants for existing sections

| Section | v21 styles | Sites has | Missing |
|---|---|---|---|
| problem | cards, tabs, timeline | grid, split | tabs, timeline |
| solution | grid, alternating, icons | grid, split, steps | alternating, icons |
| gallery | horizontal, vertical, ticker, slider, stories, accordion | masonry, carousel, slider, stories, ticker | horizontal strip |
| comparison | table, checklist, matrix | table (single) | checklist, matrix |
| guarantee | badge, certificate, seals | card, split | badge, certificate, seals |
| faq | accordion, cards, categorized | accordion, twocol | cards, categorized |
| contact/form | centered, sidebar, split | single layout | sidebar, split |
| reviews | cards, carousel, masonry, ticker | grid, marquee, spotlight, video, logo-wall | (equivalent coverage) |

## P5 — Theme fine-tuning controls (Themes tab sliders)

Sites has fixed theme tokens; v21 exposes user-tunable controls:
- Secondary/accent color hex pickers (Sites: accent only)
- Heading/body font-size, line-height, letter-spacing, paragraph-spacing sliders
- Section padding, content max-width, card radius, button radius, shadow intensity
- Premium theme JSON import (one-click theme packages)

Design note: port as a per-site `themeTweaks` block layered on the preset, exported in
YAML, applied as CSS-variable overrides so dual-mode dark/light still resolves in CSS.

## P6 — Hero image carousel

v21 hero image area is an auto-rotating carousel with 4 animation styles
(slide / fade / zoom / flip). Sites hero renders a single static image.
Port: optional `images: string[]` on hero (first image keeps current rendering), with
animation style + interval fields; vanilla-JS engine for the standalone export.

## P7 — Small settings gaps

- Favicon URL (v21 settings → favicon; Sites: none — falls back to app icon)
- SEO meta keywords field (minor; harmless to include in exports)
- Contact form: configurable success message + redirect URL after submit
- Version history: named snapshots (5 slots) on top of undo/redo
- Share-link (config encoded in URL) — LOW priority: Sites' publish/deploy covers the
  need better; only useful for throwaway sharing without a project

## Already covered (v21 → Sites, no action)

Announcement static/ticker/countdown · hero 8 layouts (v21 has 4-6) · video styles ·
icon bank picker · dark mode (dual-mode, better) · consent-gated tracking scripts ·
form delivery (sheets/inbox/embed/mailto, better) · export checklist (Readiness) ·
section visibility + reorder · config export/import (YAML, better) · theme presets
(10 vs v21's ~14, comparable) · font pairs w/ Google Fonts streaming · RTL (per-locale
dir, better than a global toggle) · mobile menu · sticky nav.

## Suggested order

P1 offer → P2 legal pages → P3 social links → P4 style variants → P5 theme tweaks →
P6 hero carousel → P7 small settings. P1–P3 are shippable as one release (v1.7);
P4–P5 as v1.8; P6–P7 as v1.9.

## Status

- ✅ **P1 offer — SHIPPED in v1.7** (card + split, live countdown reusing the announcement engine, savings auto-derivation, 3 content packs, readiness check, YAML round-trip)
- ✅ **P2 legal pages — SHIPPED in v1.7** (privacy/terms editors with starter drafts, themed standalone privacy.html/terms.html export, footer legal links, LegalConfig restructured with all-optional fields)
- ✅ **P3 social links — SHIPPED in v1.7** (socialLinks platform+url with http(s)-only activation, brand SVGs for TikTok/WhatsApp/Messenger, legacy string[] coercion)
- ⬜ P4 style variants — next (v1.8)
- ⬜ P5 theme tweak sliders — next (v1.8)
- ⬜ P6 hero carousel — v1.9
- ⬜ P7 small settings — v1.9
