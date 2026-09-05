#!/usr/bin/env python3
"""Replace the AI-generate LLM schema block with the expanded section union."""
from pathlib import Path

p = Path("/home/z/my-project/src/app/api/ai/generate/route.ts")
lines = p.read_text(encoding="utf-8").splitlines(keepends=True)

# locate the schema block: starts at the 'Section is a tagged union' line,
# ends at the line ending with `etc.\`` (the template literal terminator)
start = next(i for i, l in enumerate(lines) if "Section is a tagged union" in l)
end = next(i for i, l in enumerate(lines) if i >= start and "etc.`" in l)

NEW_SCHEMA = '''Section is a tagged union — every section object carries a "type" field with one of these exact values and fields:
- "announcement": { "type": "announcement", "style": "static" | "ticker" | "countdown", "message": string, "link": { "label": string, "href": string }, "deadline": string (ISO datetime, countdown style only), "prefixLabel": string } — the top urgency bar
- "navbar": { "type": "navbar", "links": [{ "label": string, "href": string }], "cta": { "label": string, "href": string } }
- "hero": { "type": "hero", "layout": "split-right" | "split-left" | "center" | "full-bleed" | "gradient" | "card" | "minimal", "badge": string, "headline": string, "sub": string, "cta": { "label": string, "href": string }, "secondaryCta": { "label": string, "href": string }, "image": "", "stats": [{ "value": string, "label": string }] }
- "logos": { "type": "logos", "title": string, "items": string[] }
- "features": { "type": "features", "title": string, "subtitle": string, "style": "grid" | "alternating" | "bento" | "tabs", "columns": number (2-4), "items": [{ "icon": string (icon bank id — pick from: zap shield chart globe puzzle settings target unlock rocket clock brain blocks wand sparkles trending heart check award users), "title": string, "body": string }] }
- "stats": { "type": "stats", "title": string, "items": [{ "value": string, "label": string, "delta": string }] }
- "testimonials": { "type": "testimonials", "title": string, "subtitle": string, "style": "grid" | "marquee" | "spotlight", "items": [{ "quote": string, "author": string, "role": string, "rating": number (1-5) }] }
- "pricing": { "type": "pricing", "title": string, "subtitle": string, "annualToggle": boolean, "plans": [{ "name": string, "price": string like "$29", "period": string like "/mo", "description": string, "features": string[], "highlighted": boolean, "ctaLabel": string }] }
- "faq": { "type": "faq", "title": string, "subtitle": string, "style": "accordion" | "twocol", "items": [{ "q": string, "a": string }] }
- "gallery": { "type": "gallery", "title": string, "subtitle": string, "style": "masonry" | "carousel" | "slider" | "stories" | "ticker", "items": [{ "alt": string, "caption": string, "hue": string ("0"-"360") }] }
- "problem": { "type": "problem", "title": string, "subtitle": string, "style": "grid" | "split", "items": [{ "icon": string (icon bank id), "title": string, "body": string }] } — pain points that set up the story
- "solution": { "type": "solution", "title": string, "subtitle": string, "style": "grid" | "split" | "steps", "items": [{ "icon": string (icon bank id), "title": string, "body": string }] } — the turn: how the product fixes it
- "video": { "type": "video", "title": string, "subtitle": string, "videoUrl": string ("" is fine — leave empty when unknown), "style": "cinematic" | "split" | "minimal", "caption": string, "cta": { "label": string, "href": string } }
- "comparison": { "type": "comparison", "title": string, "subtitle": string, "usLabel": string, "themLabel": string, "rows": [{ "feature": string, "us": "yes" | "no" | "partial" | short text, "them": "yes" | "no" | "partial" | short text }], "note": string }
- "guarantee": { "type": "guarantee", "title": string, "subtitle": string, "body": string (the promise, 1-3 sentences), "style": "card" | "split", "items": [{ "icon": string (icon bank id), "title": string, "body": string }] } — risk reversal before the final CTA
- "contact": { "type": "contact", "title": string, "subtitle": string, "email": string, "phone": string, "fields": string[], "submitLabel": string }
- "cta-final": { "type": "cta-final", "headline": string, "sub": string, "cta": { "label": string, "href": string }, "note": string }
- "footer": { "type": "footer", "style": "minimal" | "mega" | "newsletter", "tagline": string, "linkGroups": [{ "group": string, "items": [{ "label": string, "href": string }] }], "social": string[], "copyright": string }

Rules: navbar first (announcement may precede it), hero right after, footer last; 6-12 sections total; when the product solves a real pain, prefer the narrative arc problem → solution → features/proof → comparison → guarantee → cta-final; 3-6 items per list; copy must be specific, punchy, marketing-grade (short headlines <=8 words); if the user writes in another language, write ALL copy in that language; pick themeId that matches the vibe; href "#" or "#features" etc.}`
'''

lines[start:end + 1] = [NEW_SCHEMA]
p.write_text("".join(lines), encoding="utf-8")
print(f"Replaced lines {start + 1}..{end + 1}")
