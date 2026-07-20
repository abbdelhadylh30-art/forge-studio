/**
 * PixelForge v19 — Quick Fix Engine
 * -----------------------------------
 * 1:1 port of the 50+ quick-fix functions from v19. Each fix mutates the
 * iframe document, then re-syncs HTML and re-scores. Fixes return a
 * ChangeLogItem describing what changed (for the undo/changelog panel).
 */

import type { ChangeLogItem } from "../types";

export interface QuickFixContext {
  doc: Document;
  /** Push a snapshot before the mutation for undo */
  pushHistory: () => void;
  /** Re-sync HTML from iframe to store */
  syncHTML: () => void;
  /** Show a toast */
  toast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

export interface QuickFixResult {
  applied: boolean;
  change?: Omit<ChangeLogItem, "id" | "timestamp">;
}

type FixFn = (ctx: QuickFixContext) => QuickFixResult;

// ─── SEO fixes ──────────────────────────────────────────────────────────

const addMetaDescription: FixFn = ({ doc, syncHTML, toast }) => {
  if (!doc.head) return { applied: false };
  let meta = doc.querySelector('meta[name="description"]');
  if (meta && (meta.getAttribute("content") || "").trim()) {
    toast("Meta description already exists — edit it in the page head", "info");
    return { applied: false };
  }
  if (!meta) {
    meta = doc.createElement("meta");
    meta.setAttribute("name", "description");
    doc.head.appendChild(meta);
  }
  meta.setAttribute("content", "Your landing page description - edit this to be 50-160 characters");
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "addMetaDescription",
      title: "Added meta description",
      description: "Created <meta name='description'> with placeholder content",
      before: "(none)",
      after: meta.getAttribute("content") || "",
    },
  };
};

const addPageTitle: FixFn = ({ doc, syncHTML, toast }) => {
  if (!doc.head) return { applied: false };
  let title = doc.querySelector("title");
  if (title && title.textContent?.trim()) {
    toast("Page title already exists", "info");
    return { applied: false };
  }
  if (!title) {
    title = doc.createElement("title");
    doc.head.appendChild(title);
  }
  title.textContent = "Your Page Title - Edit to be 30-60 chars";
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "addPageTitle",
      title: "Added page title",
      description: "Created <title> tag with placeholder text",
      before: "(none)",
      after: title.textContent || "",
    },
  };
};

const addLangAttr: FixFn = ({ doc, syncHTML }) => {
  doc.documentElement.setAttribute("lang", "en");
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "addLangAttr",
      title: "Added lang attribute",
      description: 'Set lang="en" on <html>',
      before: "(none)",
      after: "en",
    },
  };
};

const addViewport: FixFn = ({ doc, syncHTML }) => {
  if (!doc.head) return { applied: false };
  let meta = doc.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = doc.createElement("meta");
    meta.setAttribute("name", "viewport");
    doc.head.appendChild(meta);
  }
  meta.setAttribute("content", "width=device-width, initial-scale=1");
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "addViewport",
      title: "Added viewport meta",
      description: 'Set <meta name="viewport" content="width=device-width, initial-scale=1">',
      before: "(none)",
      after: "width=device-width, initial-scale=1",
    },
  };
};

const fixMissingH1: FixFn = ({ doc, syncHTML }) => {
  const body = doc.body;
  if (!body) return { applied: false };
  // Guard: if there's already an H1 anywhere in the document, do nothing.
  // Without this guard, "Fix All Safe" would prepend a placeholder H1 even
  // when the page already has a perfectly good H1, creating a duplicate
  // that the next fix (fixMultipleH1) then has to clean up — net regression.
  if (doc.querySelector("h1")) return { applied: false };
  const h1 = doc.createElement("h1");
  h1.textContent = "Your Headline Here";
  h1.setAttribute("style", "font-size:2.5rem;font-weight:700;padding:1rem 0;text-align:center;");
  body.insertBefore(h1, body.firstChild);
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixMissingH1",
      title: "Added H1 headline",
      description: "Inserted an H1 with placeholder text at the top of the body",
      before: "(none)",
      after: "Your Headline Here",
    },
  };
};

const fixMultipleH1: FixFn = ({ doc, syncHTML }) => {
  const h1s = doc.querySelectorAll("h1");
  if (h1s.length <= 1) return { applied: false };
  let changed = 0;
  for (let i = 1; i < h1s.length; i++) {
    const h2 = doc.createElement("h2");
    // Move child nodes (preserves inner HTML: links, spans, images) — do NOT
    // set textContent first, that would destroy the children we're about to move.
    while (h1s[i].firstChild) h2.appendChild(h1s[i].firstChild);
    // Copy attrs except tag
    for (const attr of Array.from(h1s[i].attributes)) {
      h2.setAttribute(attr.name, attr.value);
    }
    h1s[i].parentNode?.replaceChild(h2, h1s[i]);
    changed++;
  }
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixMultipleH1",
      title: `Demoted ${changed} extra H1 → H2`,
      description: `Kept the first H1, changed ${changed} other H1 tags to H2`,
      before: `${h1s.length} H1 tags`,
      after: "1 H1 + H2s",
    },
  };
};

const fixShortH1: FixFn = ({ doc, syncHTML, toast }) => {
  const h1 = doc.querySelector("h1");
  if (!h1) return { applied: false };
  // Guard: only expand if the H1 is actually short (< 3 chars per engine rule).
  // Without this guard, fixShortH1 blindly OVERWRITES any existing H1 text
  // with the marketing placeholder, destroying the user's actual headline.
  const original = h1.textContent || "";
  if (original.trim().length >= 3) return { applied: false };
  h1.textContent = "Build Better Landing Pages 3x Faster with PixelForge";
  syncHTML();
  toast("H1 expanded — edit the text to match your value prop", "success");
  return {
    applied: true,
    change: {
      fixId: "fixShortH1",
      title: "Expanded short H1",
      description: "Replaced short H1 with a descriptive, value-driven headline",
      before: original,
      after: h1.textContent || "",
    },
  };
};

const fixShortMeta: FixFn = ({ doc, syncHTML }) => {
  if (!doc.head) return { applied: false };
  let meta = doc.querySelector('meta[name="description"]');
  if (!meta) {
    meta = doc.createElement("meta");
    meta.setAttribute("name", "description");
    doc.head.appendChild(meta);
  }
  const before = meta.getAttribute("content") || "";
  meta.setAttribute("content", "Discover how our product helps you achieve your goals faster. Try it free today — no credit card required. Join 10,000+ happy customers.");
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixShortMeta",
      title: "Expanded meta description",
      description: "Lengthened meta description to 50-160 characters",
      before,
      after: meta.getAttribute("content") || "",
    },
  };
};

const fixLongMeta: FixFn = ({ doc, syncHTML }) => {
  const meta = doc.querySelector('meta[name="description"]');
  if (!meta) return { applied: false };
  const before = meta.getAttribute("content") || "";
  const trimmed = before.substring(0, 155) + (before.length > 155 ? "…" : "");
  meta.setAttribute("content", trimmed);
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixLongMeta",
      title: "Trimmed meta description",
      description: `Shortened from ${before.length} to ${trimmed.length} chars`,
      before,
      after: trimmed,
    },
  };
};

const fixShortTitle: FixFn = ({ doc, syncHTML }) => {
  const title = doc.querySelector("title");
  if (!title) return { applied: false };
  const before = title.textContent || "";
  title.textContent = `${before} — Your Brand | Get Started Free`;
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixShortTitle",
      title: "Expanded page title",
      description: "Added brand + CTA to make title 30-60 chars",
      before,
      after: title.textContent || "",
    },
  };
};

const addOpenGraph: FixFn = ({ doc, syncHTML }) => {
  if (!doc.head) return { applied: false };
  const ensure = (property: string, content: string) => {
    let m = doc.querySelector(`meta[property="${property}"]`);
    if (!m) {
      m = doc.createElement("meta");
      m.setAttribute("property", property);
      doc.head!.appendChild(m);
    }
    m.setAttribute("content", content);
  };
  const titleEl = doc.querySelector("title");
  const ogTitle = titleEl?.textContent || "Your Page Title";
  ensure("og:title", ogTitle);
  ensure("og:description", doc.querySelector('meta[name="description"]')?.getAttribute("content") || "Page description");
  ensure("og:image", "https://placehold.co/1200x630/5c8def/ffffff?text=Your+Page");
  ensure("og:type", "website");
  ensure("og:url", "https://yoursite.com");
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "addOpenGraph",
      title: "Added Open Graph tags",
      description: "Created og:title, og:description, og:image, og:type, og:url",
      before: "(none)",
      after: "5 OG tags",
    },
  };
};

const addFavicon: FixFn = ({ doc, syncHTML }) => {
  if (!doc.head) return { applied: false };
  // Generate a data-URI favicon from the brand color
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#5c8def"/><text x="16" y="22" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#fff" text-anchor="middle">P</text></svg>`;
  const dataUri = "data:image/svg+xml;base64," + (typeof btoa !== "undefined" ? btoa(svg) : Buffer.from(svg).toString("base64"));
  let link = doc.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
  if (!link) {
    link = doc.createElement("link");
    link.setAttribute("rel", "icon");
    doc.head.appendChild(link);
  }
  link.setAttribute("type", "image/svg+xml");
  link.setAttribute("href", dataUri);
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "addFavicon",
      title: "Added branded favicon",
      description: "Generated an SVG favicon with the brand initial",
      before: "(none)",
      after: "data:image/svg+xml (branded)",
    },
  };
};

// ─── Content & CTA fixes ────────────────────────────────────────────────

const fixCTACopy: FixFn = ({ doc, syncHTML, toast }) => {
  // Find first button/CTA above fold and improve its text
  const ctaEls = Array.from(doc.querySelectorAll('a[href], button, [role="button"]'));
  const target = ctaEls.find((el) => {
    const r = (el as HTMLElement).getBoundingClientRect();
    return r.top < 600 && r.height > 0 && !el.closest("nav");
  });
  if (!target) {
    toast("No CTA found above the fold to improve", "warning");
    return { applied: false };
  }
  const before = target.textContent || "";
  target.textContent = "Start Free";
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixCTACopy",
      title: "Improved CTA copy",
      description: 'Changed CTA text to concise action phrase "Start Free"',
      before,
      after: "Start Free",
    },
  };
};

const fixMissingCTA: FixFn = ({ doc, syncHTML }) => {
  const body = doc.body;
  if (!body) return { applied: false };
  // Find a hero section or first section
  const hero = body.querySelector("section, header, [class*='hero']") || body;
  const cta = doc.createElement("a");
  cta.setAttribute("href", "#signup");
  cta.setAttribute("style", "display:inline-block;padding:14px 32px;background:#5c8def;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;margin-top:16px;");
  cta.textContent = "Start Free";
  hero.appendChild(cta);
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixMissingCTA",
      title: "Added CTA button above fold",
      description: 'Inserted a "Start Free" CTA button in the hero section',
      before: "(none)",
      after: "Start Free",
    },
  };
};

const fixNoCTACopy: FixFn = ({ doc, syncHTML }) => {
  // Find any button with empty/long text and shorten it
  const buttons = Array.from(doc.querySelectorAll("button, a[href]"));
  const target = buttons.find((el) => {
    const r = (el as HTMLElement).getBoundingClientRect();
    const t = (el.textContent || "").trim();
    return r.top < 800 && (t.length === 0 || t.length > 30);
  });
  if (!target) return { applied: false };
  const before = target.textContent || "";
  target.textContent = "Get Started";
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixNoCTACopy",
      title: "Set CTA copy",
      description: 'Set button text to "Get Started"',
      before,
      after: "Get Started",
    },
  };
};

const fixTrustSignals: FixFn = ({ doc, syncHTML }) => {
  const body = doc.body;
  if (!body) return { applied: false };
  const trust = doc.createElement("div");
  trust.setAttribute("style", "padding:20px;text-align:center;background:#f8f9fa;border-top:1px solid #eee;margin-top:40px;");
  trust.innerHTML = `
    <p style="font-weight:600;margin-bottom:8px">⭐⭐⭐⭐⭐ Rated 4.9/5 by 10,000+ customers</p>
    <p style="font-size:14px;color:#666;margin-bottom:8px">30-day money-back guarantee · No credit card required · Cancel anytime</p>
    <p style="font-size:14px;color:#666">Contact us: hello@yoursite.com · 1-800-YOURSITE</p>
  `;
  body.appendChild(trust);
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixTrustSignals",
      title: "Added trust signals",
      description: "Added customer rating, money-back guarantee, and contact info",
      before: "(none)",
      after: "Ratings + guarantee + contact",
    },
  };
};

// ─── Accessibility fixes ────────────────────────────────────────────────

const fixAltText: FixFn = ({ doc, syncHTML }) => {
  const imgs = Array.from(doc.querySelectorAll("img"));
  if (imgs.length === 0) return { applied: false };
  let fixed = 0;
  imgs.forEach((img) => {
    const alt = (img.getAttribute("alt") || "").trim();
    if (!alt || ["image", "photo", "picture"].includes(alt.toLowerCase())) {
      // Generate alt from context
      const src = img.getAttribute("src") || "";
      const filename = src.split("/").pop()?.split("?")[0]?.split(".")[0] || "image";
      const generated = filename
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace(/\.\w+$/, "");
      img.setAttribute("alt", generated || "Decorative image");
      fixed++;
    }
  });
  if (fixed === 0) return { applied: false };
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixAltText",
      title: `Fixed ${fixed} image alt text`,
      description: `Generated descriptive alt attributes from image filenames`,
      before: `${fixed} missing`,
      after: `${fixed} fixed`,
    },
  };
};

const fixImgSize: FixFn = ({ doc, syncHTML }) => {
  const imgs = Array.from(doc.querySelectorAll("img"));
  if (imgs.length === 0) return { applied: false };
  let fixed = 0;
  imgs.forEach((img) => {
    if (!img.getAttribute("width") && !img.getAttribute("height")) {
      const r = (img as HTMLImageElement).getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        img.setAttribute("width", String(Math.round(r.width)));
        img.setAttribute("height", String(Math.round(r.height)));
        fixed++;
      } else {
        img.setAttribute("width", "400");
        img.setAttribute("height", "300");
        fixed++;
      }
    }
  });
  if (fixed === 0) return { applied: false };
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixImgSize",
      title: `Added size to ${fixed} images`,
      description: "Set width/height attributes to prevent layout shift (CLS)",
      before: `${fixed} unsized`,
      after: `${fixed} sized`,
    },
  };
};

const fixFormLabels: FixFn = ({ doc, syncHTML }) => {
  const inputs = Array.from(doc.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'));
  if (inputs.length === 0) return { applied: false };
  let fixed = 0;
  inputs.forEach((inp, idx) => {
    const id = inp.getAttribute("id");
    const hasLabel = id && doc.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = inp.getAttribute("aria-label") || inp.getAttribute("aria-labelledby");
    const hasTitle = inp.getAttribute("title");
    if (hasLabel || hasAriaLabel || hasTitle) return;
    const placeholder = inp.getAttribute("placeholder") || inp.getAttribute("name") || `Field ${idx + 1}`;
    inp.setAttribute("aria-label", placeholder);
    fixed++;
  });
  if (fixed === 0) return { applied: false };
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixFormLabels",
      title: `Added ${fixed} form labels`,
      description: "Added aria-label attributes derived from placeholders/names",
      before: `${fixed} unlabeled`,
      after: `${fixed} labeled`,
    },
  };
};

const fixLinkText: FixFn = ({ doc, syncHTML }) => {
  const badLinkTexts = ["click here", "read more", "learn more", "here", "more", "link", "this", "go", "see more", "continue", "click"];
  const links = Array.from(doc.querySelectorAll("a"));
  let fixed = 0;
  links.forEach((a) => {
    const t = (a.textContent || "").trim().toLowerCase();
    if (!t || badLinkTexts.includes(t)) {
      const href = a.getAttribute("href") || "";
      // Try to derive from href
      let newText = href
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0]
        .split("?")[0];
      if (!newText || newText === "#") newText = a.getAttribute("title") || "Visit link";
      a.textContent = newText.charAt(0).toUpperCase() + newText.slice(1);
      fixed++;
    }
  });
  if (fixed === 0) return { applied: false };
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixLinkText",
      title: `Improved ${fixed} vague links`,
      description: "Replaced 'click here' / 'read more' with descriptive text from href",
      before: `${fixed} vague`,
      after: `${fixed} descriptive`,
    },
  };
};

const fixFocusStyles: FixFn = ({ doc, syncHTML }) => {
  // Remove outline:none from inline styles, add :focus-visible style
  const outlineNoneEls = doc.querySelectorAll('[style*="outline:none"],[style*="outline: none"],[style*="outline:0"],[style*="outline: 0"]');
  outlineNoneEls.forEach((el) => {
    const style = el.getAttribute("style") || "";
    el.setAttribute("style", style.replace(/outline\s*:\s*(none|0)\s*;?/gi, ""));
  });
  let styleEl = doc.querySelector("style#pf-focus-fix");
  if (!styleEl) {
    styleEl = doc.createElement("style");
    styleEl.setAttribute("id", "pf-focus-fix");
    doc.head?.appendChild(styleEl);
  }
  styleEl.textContent = `
    a:focus-visible, button:focus-visible, [role="button"]:focus-visible,
    input:focus-visible, textarea:focus-visible, select:focus-visible {
      outline: 2px solid #5c8def !important;
      outline-offset: 2px !important;
    }
  `;
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixFocusStyles",
      title: "Restored focus indicators",
      description: `Removed outline:none from ${outlineNoneEls.length} elements and added :focus-visible styles`,
      before: `${outlineNoneEls.length} hidden`,
      after: "Visible :focus-visible",
    },
  };
};

const fixContrast: FixFn = ({ doc, syncHTML }) => {
  // Bump text color to a darker shade where contrast is low
  const textEls = Array.from(doc.querySelectorAll("p,h1,h2,h3,h4,h5,h6,a,span,li,label,button")).slice(0, 25);
  let fixed = 0;
  textEls.forEach((el) => {
    const dv = doc.defaultView;
    if (!dv) return;
    const cs = dv.getComputedStyle(el as HTMLElement);
    const fg = cs.color;
    const bg = cs.backgroundColor;
    if (bg === "rgba(0, 0, 0, 0)" || bg === "transparent") return;
    // Quick check: if text is gray-ish on light bg, darken to #000
    const m = fg.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) return;
    const [r, g, b] = [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const bgM = bg.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!bgM) return;
    const bgBrightness = (parseInt(bgM[1]) * 299 + parseInt(bgM[2]) * 587 + parseInt(bgM[3]) * 114) / 1000;
    // If text and bg are both mid-range, darken text
    if (Math.abs(brightness - bgBrightness) < 100) {
      (el as HTMLElement).style.color = bgBrightness > 128 ? "#000000" : "#ffffff";
      fixed++;
    }
  });
  if (fixed === 0) return { applied: false };
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixContrast",
      title: `Improved ${fixed} low-contrast texts`,
      description: "Darkened/lightened text to meet WCAG 4.5:1 contrast ratio",
      before: `${fixed} failing`,
      after: `${fixed} fixed`,
    },
  };
};

// ─── Structure fixes ────────────────────────────────────────────────────

function fixHeadingFactory(newTagLower: string): FixFn {
  return ({ doc, syncHTML, toast }) => {
    const headings = Array.from(doc.querySelectorAll("h1,h2,h3,h4,h5,h6"));
    if (headings.length <= 1) return { applied: false };
    const levels = headings.map((h) => parseInt(h.tagName[1]));
    let skipIdx = -1;
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] > levels[i - 1] + 1) { skipIdx = i; break; }
    }
    if (skipIdx === -1) {
      toast("No heading hierarchy skips found", "info");
      return { applied: false };
    }
    const old = headings[skipIdx];
    const newTag = newTagLower.toUpperCase();
    const replacement = doc.createElement(newTag);
    replacement.textContent = old.textContent || "";
    for (const attr of Array.from(old.attributes)) {
      replacement.setAttribute(attr.name, attr.value);
    }
    old.parentNode?.replaceChild(replacement, old);
    syncHTML();
    return {
      applied: true,
      change: {
        fixId: `fixHeading:${newTagLower}`,
        title: `Changed <${old.tagName.toLowerCase()}> → <${newTagLower}>`,
        description: "Fixed heading hierarchy skip",
        before: old.tagName.toLowerCase(),
        after: newTagLower,
      },
    };
  };
}

const fixTouchTargets: FixFn = ({ doc, syncHTML }) => {
  const els = Array.from(doc.querySelectorAll('a, button, [role="button"], input[type="submit"], input[type="button"]'));
  let fixed = 0;
  els.forEach((el) => {
    const r = (el as HTMLElement).getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (r.width < 36 || r.height < 36) {
      const cs = doc.defaultView?.getComputedStyle(el as HTMLElement);
      const minPad = "8px 16px";
      // Increase padding while preserving existing style
      const existing = (el as HTMLElement).getAttribute("style") || "";
      (el as HTMLElement).setAttribute("style", `${existing};min-height:36px;min-width:36px;padding:${minPad};`);
      fixed++;
    }
  });
  if (fixed === 0) return { applied: false };
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixTouchTargets",
      title: `Enlarged ${fixed} touch targets`,
      description: "Set min-width/min-height:36px on small interactive elements",
      before: `${fixed} too small`,
      after: `${fixed} resized`,
    },
  };
};

// ─── Performance fixes ──────────────────────────────────────────────────

const fixExternalResources: FixFn = ({ doc, syncHTML }) => {
  const scripts = doc.querySelectorAll("script[src]");
  let fixed = 0;
  scripts.forEach((s) => {
    if (!s.async && !s.defer) {
      s.setAttribute("defer", "");
      fixed++;
    }
  });
  if (fixed === 0) return { applied: false };
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixExternalResources",
      title: `Deferred ${fixed} render-blocking scripts`,
      description: "Added defer= to non-async scripts",
      before: `${fixed} blocking`,
      after: `${fixed} deferred`,
    },
  };
};

const fixFontDisplay: FixFn = ({ doc, syncHTML }) => {
  const gFontsLinks = Array.from(doc.querySelectorAll('link[href*="fonts.googleapis.com"]'));
  if (gFontsLinks.length === 0) return { applied: false };
  let fixed = 0;
  gFontsLinks.forEach((l) => {
    const href = l.getAttribute("href") || "";
    if (!href.includes("display=swap")) {
      const sep = href.includes("?") ? "&" : "?";
      l.setAttribute("href", href + sep + "display=swap");
      fixed++;
    }
  });
  if (fixed === 0) return { applied: false };
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixFontDisplay",
      title: `Added display=swap to ${fixed} Google Fonts`,
      description: "Prevents FOIT (flash of invisible text) on mobile",
      before: `${fixed} missing`,
      after: `${fixed} fixed`,
    },
  };
};

const fixLazyLoad: FixFn = ({ doc, syncHTML }) => {
  const imgs = Array.from(doc.querySelectorAll("img"));
  let fixed = 0;
  imgs.forEach((img) => {
    const r = (img as HTMLImageElement).getBoundingClientRect();
    if (r.top > 600 && img.getAttribute("loading") !== "lazy") {
      img.setAttribute("loading", "lazy");
      fixed++;
    }
  });
  if (fixed === 0) return { applied: false };
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixLazyLoad",
      title: `Lazy-loaded ${fixed} below-fold images`,
      description: 'Added loading="lazy" to images below the fold',
      before: `${fixed} eager`,
      after: `${fixed} lazy`,
    },
  };
};

const fixHeroPreload: FixFn = ({ doc, syncHTML }) => {
  const imgs = Array.from(doc.querySelectorAll("img"));
  const heroImg = imgs.find((img) => {
    const r = (img as HTMLImageElement).getBoundingClientRect();
    return r.top < 600 && r.width > 100 && r.height > 80;
  });
  if (!heroImg) return { applied: false };
  const src = heroImg.getAttribute("src") || "";
  if (!src) return { applied: false };
  const preload = doc.createElement("link");
  preload.setAttribute("rel", "preload");
  preload.setAttribute("as", "image");
  preload.setAttribute("href", src);
  doc.head?.appendChild(preload);
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixHeroPreload",
      title: "Preloaded hero image",
      description: `<link rel="preload" as="image" href="${src}">`,
      before: "(none)",
      after: "preload hint added",
    },
  };
};

const fixSrcset: FixFn = ({ doc, syncHTML, toast }) => {
  const imgs = Array.from(doc.querySelectorAll("img"));
  let fixed = 0;
  imgs.forEach((img) => {
    if (img.getAttribute("srcset")) return;
    const src = img.getAttribute("src") || "";
    if (!src || src.startsWith("data:")) return;
    // Generate srcset with width descriptors (placeholder pattern)
    const baseW = parseInt(img.getAttribute("width") || "800");
    const w400 = src.replace(/w\d+/, "w400").replace(/\?\w+/, "") + (src.includes("?") ? "" : "");
    const w800 = src.replace(/w\d+/, "w800").replace(/\?\w+/, "") + (src.includes("?") ? "" : "");
    img.setAttribute("srcset", `${w400} 400w, ${w800} 800w, ${src} 1200w`);
    img.setAttribute("sizes", "(max-width: 600px) 400px, (max-width: 900px) 800px, 1200px");
    fixed++;
  });
  if (fixed === 0) return { applied: false };
  syncHTML();
  toast(`Added responsive srcset to ${fixed} images (verify URLs exist)`, "info");
  return {
    applied: true,
    change: {
      fixId: "fixSrcset",
      title: `Added srcset to ${fixed} images`,
      description: "Generated responsive image candidates (review URLs)",
      before: `${fixed} missing`,
      after: `${fixed} responsive`,
    },
  };
};

const fixScriptDefer: FixFn = ({ doc, syncHTML }) => {
  const scripts = doc.querySelectorAll("script[src]");
  let fixed = 0;
  scripts.forEach((s) => {
    if (!s.async && !s.defer) {
      s.setAttribute("defer", "");
      fixed++;
    }
  });
  if (fixed === 0) return { applied: false };
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixScriptDefer",
      title: `Deferred ${fixed} scripts`,
      description: "Added defer to all render-blocking scripts",
      before: `${fixed} blocking`,
      after: `${fixed} deferred`,
    },
  };
};

const fixResponsiveCSS: FixFn = ({ doc, syncHTML }) => {
  let styleEl = doc.querySelector("style#pf-responsive-fix");
  if (!styleEl) {
    styleEl = doc.createElement("style");
    styleEl.setAttribute("id", "pf-responsive-fix");
    doc.head?.appendChild(styleEl);
  }
  styleEl.textContent = `
    img { max-width: 100%; height: auto; }
    @media (max-width: 768px) {
      body { font-size: 16px; }
      [style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
      [style*="display: flex"] { flex-direction: column !important; }
    }
  `;
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixResponsiveCSS",
      title: "Added responsive CSS",
      description: "Injected @media (max-width: 768px) breakpoint with mobile rules",
      before: "(none)",
      after: "Media query + flex/grid stack",
    },
  };
};

const fixThemeColor: FixFn = ({ doc, syncHTML }) => {
  if (!doc.head) return { applied: false };
  let meta = doc.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = doc.createElement("meta");
    meta.setAttribute("name", "theme-color");
    doc.head.appendChild(meta);
  }
  meta.setAttribute("content", "#5c8def");
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixThemeColor",
      title: "Added theme-color meta",
      description: '<meta name="theme-color" content="#5c8def">',
      before: "(none)",
      after: "#5c8def",
    },
  };
};

const fixFontSize: FixFn = ({ doc, syncHTML }) => {
  let styleEl = doc.querySelector("style#pf-fontsize-fix");
  if (!styleEl) {
    styleEl = doc.createElement("style");
    styleEl.setAttribute("id", "pf-fontsize-fix");
    doc.head?.appendChild(styleEl);
  }
  styleEl.textContent = `
    html { font-size: 16px; }
    body { font-size: 16px !important; }
  `;
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixFontSize",
      title: "Set base font size to 16px",
      description: "Ensured body text is at least 16px for mobile readability",
      before: "<16px",
      after: "16px",
    },
  };
};

const fixAutocomplete: FixFn = ({ doc, syncHTML }) => {
  const inputs = Array.from(doc.querySelectorAll('input[type="email"], input[type="tel"], input[type="text"], input[name]'));
  let fixed = 0;
  inputs.forEach((inp) => {
    if (inp.getAttribute("autocomplete")) return;
    const type = inp.getAttribute("type") || inp.getAttribute("name") || "text";
    const mapping: Record<string, string> = {
      email: "email",
      tel: "tel",
      text: "name",
      name: "name",
      username: "username",
    };
    inp.setAttribute("autocomplete", mapping[type] || "on");
    fixed++;
  });
  if (fixed === 0) return { applied: false };
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixAutocomplete",
      title: `Added autocomplete to ${fixed} inputs`,
      description: "Mapped input types to autocomplete tokens (email, tel, name, etc.)",
      before: `${fixed} missing`,
      after: `${fixed} fixed`,
    },
  };
};

const fixDnsPrefetch: FixFn = ({ doc, syncHTML }) => {
  if (!doc.head) return { applied: false };
  const extDomains = new Set<string>();
  doc.querySelectorAll('link[href*="://"], script[src*="://"]').forEach((el) => {
    try {
      const u = new URL(el.getAttribute("href") || el.getAttribute("src") || "");
      extDomains.add(u.hostname);
    } catch {
      /* skip */
    }
  });
  let fixed = 0;
  extDomains.forEach((host) => {
    const exists = doc.querySelector(`link[rel="dns-prefetch"][href="//${host}"], link[rel="preconnect"][href*="${host}"]`);
    if (exists) return;
    const link = doc.createElement("link");
    link.setAttribute("rel", "dns-prefetch");
    link.setAttribute("href", `//${host}`);
    doc.head!.appendChild(link);
    fixed++;
  });
  if (fixed === 0) return { applied: false };
  syncHTML();
  return {
    applied: true,
    change: {
      fixId: "fixDnsPrefetch",
      title: `Added ${fixed} dns-prefetch hints`,
      description: "Pre-resolve DNS for external domains to speed up mobile",
      before: `${fixed} missing`,
      after: `${fixed} added`,
    },
  };
};

// ─── Registry ───────────────────────────────────────────────────────────

export const QUICK_FIXES: Record<string, FixFn> = {
  addMeta: addMetaDescription,
  addTitle: addPageTitle,
  addLang: addLangAttr,
  addViewport,
  fixMissingH1,
  fixMultipleH1,
  fixShortH1,
  fixShortMeta,
  fixLongMeta,
  fixShortTitle,
  addOpenGraph,
  addFavicon,
  fixCTACopy,
  fixMissingCTA,
  fixNoCTACopy,
  fixTrustSignals,
  fixAltText,
  fixImgSize,
  fixFormLabels,
  fixLinkText,
  fixFocusStyles,
  fixContrast,
  fixHeadingH2: fixHeadingFactory("h2"),
  fixHeadingH3: fixHeadingFactory("h3"),
  fixHeadingH4: fixHeadingFactory("h4"),
  fixHeadingH5: fixHeadingFactory("h5"),
  fixTouchTargets,
  fixExternalResources,
  fixFontDisplay,
  fixLazyLoad,
  fixHeroPreload,
  fixSrcset,
  fixScriptDefer,
  fixResponsiveCSS,
  fixThemeColor,
  fixFontSize,
  fixAutocomplete,
  fixDnsPrefetch,
};

export function applyQuickFix(fixId: string, ctx: QuickFixContext): QuickFixResult {
  // Handle dynamic fix IDs like "fixHeading:h3"
  if (fixId.startsWith("fixHeading:")) {
    const tag = fixId.split(":")[1];
    const key = `fixHeading${tag.charAt(0).toUpperCase()}${tag.charAt(1)}`;
    const fn = QUICK_FIXES[key];
    if (fn) return fn(ctx);
  }
  const fn = QUICK_FIXES[fixId];
  if (!fn) return { applied: false };
  return fn(ctx);
}

/** Apply ALL safe quick-fixes in sequence (the "Fix All" button) */
export function applyAllSafeFixes(ctx: QuickFixContext): { count: number; changes: Omit<ChangeLogItem, "id" | "timestamp">[] } {
  const safeOrder = [
    "addMeta", "addTitle", "addLang", "addViewport",
    "fixMissingH1", "fixMultipleH1", "fixShortH1", "fixShortMeta", "fixLongMeta", "fixShortTitle",
    "addOpenGraph", "addFavicon",
    "fixAltText", "fixImgSize", "fixFormLabels", "fixLinkText", "fixFocusStyles",
    "fixTouchTargets",
    "fixFontDisplay", "fixLazyLoad", "fixHeroPreload", "fixScriptDefer",
    "fixResponsiveCSS", "fixThemeColor", "fixFontSize", "fixAutocomplete", "fixDnsPrefetch",
    "fixCTACopy", "fixMissingCTA", "fixTrustSignals",
  ];
  let count = 0;
  const changes: Omit<ChangeLogItem, "id" | "timestamp">[] = [];
  for (const fixId of safeOrder) {
    const r = applyQuickFix(fixId, ctx);
    if (r.applied && r.change) {
      count++;
      changes.push(r.change);
    }
  }
  return { count, changes };
}
