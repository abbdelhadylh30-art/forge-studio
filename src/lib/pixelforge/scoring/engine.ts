/**
 * PixelForge v19 — Scoring Engine
 * --------------------------------
 * 1:1 port of the original runScoring() function. Five categories,
 * exact point weights, exact issue definitions, mobile/desktop split.
 *
 * The engine takes a Document (from the iframe) and returns ScoreData.
 * It does NOT touch the DOM (no mutations) — that's the quick-fixes' job.
 */

import type {
  Category,
  CategoryScore,
  ColorRGB,
  Issue,
  ScoreData,
} from "../types";
import { CATEGORIES, MOBILE_PENALTY_ISSUES, scaleTo100 } from "../types";

export interface ScoringInput {
  doc: Document;
  /** width of the iframe viewport — used for above-fold detection (default 1280) */
  viewportWidth?: number;
}

export function runScoring({ doc, viewportWidth = 1280 }: ScoringInput): ScoreData {
  // SWEBOK KA 10 §2.2 (Software Quality — self-measurement): instrument the
  // scoring call so we have visibility into performance regressions on large
  // documents. The 1,243-line function runs synchronously on the main thread;
  // if it exceeds PERF_WARN_MS we warn in dev mode so we catch freezes before
  // users do. The measurement is zero-cost in production (guard on NODE_ENV).
  const __t0 = typeof performance !== "undefined" ? performance.now() : 0;
  const result = runScoringImpl({ doc, viewportWidth });
  if (process.env.NODE_ENV !== "production") {
    const __t1 = typeof performance !== "undefined" ? performance.now() : 0;
    const __dur = __t1 - __t0;
    if (__dur > PERF_WARN_MS) {
      console.warn(
        `[Forge Studio] runScoring took ${__dur.toFixed(1)}ms (> ${PERF_WARN_MS}ms threshold). ` +
        `DOM size: ${doc.querySelectorAll("*").length} elements. ` +
        `Consider memoizing or moving to a Web Worker if this regresses.`
      );
    }
  }
  return result;
}

/** Threshold (ms) above which runScoring logs a dev-mode perf warning. */
export const PERF_WARN_MS = 500;

function runScoringImpl({ doc, viewportWidth = 1280 }: ScoringInput): ScoreData {
  const issues: Issue[] = [];
  const cats: Record<Category, CategoryScore> = {
    seo: { earned: 0, total: 0 },
    content: { earned: 0, total: 0 },
    a11y: { earned: 0, total: 0 },
    structure: { earned: 0, total: 0 },
    perf: { earned: 0, total: 0 },
  };

  function pushIssue(cat: Category, issue: Omit<Issue, "cat" | "priority">) {
    const imp = issue.impact || 2;
    const vis = issue.visibility || 2;
    const eas = issue.ease || 2;
    const full: Issue = {
      ...issue,
      cat,
      priority: imp * vis * eas,
    };
    cats[cat].total += issue.max;
    cats[cat].earned += issue.pts;
    issues.push(full);
  }

  function fullPoints(cat: Category, pts: number) {
    cats[cat].total += pts;
    cats[cat].earned += pts;
  }

  try {
    if (!doc.body || !doc.documentElement) {
      return emptyScore();
    }
    const bodyText = doc.body.textContent?.toLowerCase() ?? "";
    const h1s = Array.from(doc.querySelectorAll("h1"));
    const ctaEls = Array.from(
      doc.querySelectorAll('a[href], button, [role="button"], input[type="submit"], input[type="button"]')
    );
    const imgs = Array.from(doc.querySelectorAll("img"));
    const links = Array.from(doc.querySelectorAll("a"));
    const styleEls = Array.from(doc.querySelectorAll("style"));

    /* ═══ CATEGORY 1: SEO & META (20 pts) ═══ */
    try {
      // 1a. H1 Tag (8 pts)
      if (h1s.length === 0) {
        pushIssue("seo", {
          id: "h1-missing", title: "Missing H1 Tag",
          desc: "No H1 tag found on the page. The H1 is the most important heading for SEO and accessibility.",
          fix: "Add exactly one H1 tag with a clear, descriptive heading.",
          severity: "error", selector: null, pts: 0, max: 8, quickFix: "fixMissingH1",
          impact: 3, visibility: 3, ease: 2,
        });
      } else if (h1s.length > 1) {
        pushIssue("seo", {
          id: "h1-multiple", title: `${h1s.length} H1 Tags Found`,
          desc: `Found ${h1s.length} H1 tags. Only one should exist as the main page heading.`,
          fix: "Keep one H1 as the main heading, change others to H2 or H3.",
          severity: "warning", selector: "h1", pts: 4, max: 8, quickFix: "fixMultipleH1",
          impact: 3, visibility: 3, ease: 2,
        });
      } else {
        const txt = h1s[0].textContent?.trim() ?? "";
        if (txt.length < 3) {
          pushIssue("seo", {
            id: "h1-short", title: "H1 Too Short",
            desc: `H1 text is "${txt}" — too brief to describe the page.`,
            fix: "Write a descriptive H1 with 5-15 words that communicates the page purpose.",
            severity: "warning", selector: "h1", pts: 4, max: 8, quickFix: "fixShortH1",
            impact: 2, visibility: 3, ease: 2,
          });
        } else {
          fullPoints("seo", 8);
        }
      }

      // 1b. Meta Description (6 pts)
      const metaEl = doc.querySelector('meta[name="description"]');
      if (!metaEl || !(metaEl.getAttribute("content") || "").trim()) {
        pushIssue("seo", {
          id: "meta-missing", title: "Missing Meta Description",
          desc: "No meta description tag found. This is critical for search engine result snippets.",
          fix: "Add a meta description with 50-160 characters.",
          severity: "error", selector: null, pts: 0, max: 6, quickFix: "addMeta",
          impact: 3, visibility: 2, ease: 3,
        });
      } else {
        const len = (metaEl.getAttribute("content") || "").trim().length;
        if (len < 50) {
          pushIssue("seo", {
            id: "meta-short", title: "Meta Description Too Short",
            desc: `Only ${len} characters. Search engines prefer 50-160 characters for snippets.`,
            fix: "Expand your meta description to at least 50 characters.",
            severity: "warning", selector: null, pts: 3, max: 6, quickFix: "fixShortMeta",
            impact: 2, visibility: 2, ease: 2,
          });
        } else if (len > 160) {
          pushIssue("seo", {
            id: "meta-long", title: "Meta Description Too Long",
            desc: `${len} characters — search engines may truncate it.`,
            fix: "Shorten to under 160 characters for best display.",
            severity: "warning", selector: null, pts: 4, max: 6, quickFix: "fixLongMeta",
            impact: 1, visibility: 2, ease: 2,
          });
        } else {
          fullPoints("seo", 6);
        }
      }

      // 1c. Page Title (3 pts)
      const titleEl = doc.querySelector("title");
      const titleText = titleEl ? (titleEl.textContent || "").trim() : "";
      if (!titleText) {
        pushIssue("seo", {
          id: "title-missing", title: "Missing Page Title",
          desc: "No <title> tag found. This is the headline shown in search results and browser tabs.",
          fix: "Add a <title> tag with 30-60 characters describing the page.",
          severity: "error", selector: null, pts: 0, max: 3, quickFix: "addTitle",
          impact: 3, visibility: 2, ease: 3,
        });
      } else if (titleText.length < 10) {
        pushIssue("seo", {
          id: "title-short", title: "Page Title Too Short",
          desc: `Title is "${titleText}" (${titleText.length} chars) — too short to be descriptive in search results.`,
          fix: "Aim for 30-60 characters that include your main keyword.",
          severity: "warning", selector: null, pts: 1, max: 3, quickFix: "fixShortTitle",
          impact: 2, visibility: 2, ease: 2,
        });
      } else {
        fullPoints("seo", 3);
      }

      // 1d. Language Attribute (3 pts)
      const htmlEl = doc.documentElement;
      const langAttr = htmlEl.getAttribute("lang") || "";
      if (!langAttr) {
        pushIssue("seo", {
          id: "lang-missing", title: "Missing Language Attribute",
          desc: "The <html> tag has no lang attribute. Screen readers use this to choose the correct pronunciation.",
          fix: 'Add lang="en" (or the appropriate language code) to the <html> tag.',
          severity: "warning", selector: null, pts: 0, max: 3, quickFix: "addLang",
          impact: 1, visibility: 1, ease: 3,
        });
      } else {
        fullPoints("seo", 3);
      }

      // 1e. Open Graph Tags (5 pts)
      const ogTitle = doc.querySelector('meta[property="og:title"]');
      const ogDesc = doc.querySelector('meta[property="og:description"]');
      const ogImage = doc.querySelector('meta[property="og:image"]');
      const ogCount = [ogTitle, ogDesc, ogImage].filter(Boolean).length;
      if (ogCount === 0) {
        pushIssue("seo", {
          id: "og-missing", title: "Missing Open Graph Tags",
          desc: "No Open Graph tags found. When someone shares this page on social media, there will be no preview image, title, or description — just a bare link.",
          fix: "Add og:title, og:description, and og:image meta tags to the <head>.",
          severity: "warning", selector: null, pts: 0, max: 5, quickFix: "addOpenGraph",
          impact: 2, visibility: 2, ease: 3,
        });
      } else if (ogCount < 3) {
        pushIssue("seo", {
          id: "og-partial", title: "Incomplete Open Graph Tags",
          desc: `Only ${ogCount} of 3 essential Open Graph tags found (og:title, og:description, og:image). Social previews will be incomplete.`,
          fix: "Add the missing og:title, og:description, and og:image tags.",
          severity: "warning", selector: null, pts: 2, max: 5, quickFix: "addOpenGraph",
          impact: 2, visibility: 2, ease: 3,
        });
      } else {
        fullPoints("seo", 5);
      }

      // 1f. Favicon (3 pts)
      const favicon = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
      if (!favicon) {
        pushIssue("seo", {
          id: "favicon-missing", title: "Missing Favicon",
          desc: "No favicon found. Favicons appear in browser tabs, bookmarks, and search results — they build brand recognition and trust.",
          fix: 'Add a <link rel="icon" href="favicon.ico"> tag to the <head>.',
          severity: "warning", selector: null, pts: 0, max: 3, quickFix: "addFavicon",
          impact: 1, visibility: 2, ease: 3,
        });
      } else {
        fullPoints("seo", 3);
      }
    } catch (e) {
      console.error("PixelForge: SEO scoring error", e);
    }

    /* ═══ CATEGORY 2: CONTENT & CONVERSION (25 pts) ═══ */
    try {
      // 2a. CTA Above Fold (8 pts)
      const ctaWords = ["get", "start", "try", "buy", "sign", "join", "download", "free", "now", "subscribe", "learn", "discover", "create", "order", "book", "schedule", "claim", "unlock"];
      // Match whole words only so "now" doesn't fire on "knowledge" / "snow" / "nowhere".
      const ctaRe = new RegExp(`\\b(${ctaWords.join("|")})\\b`, "i");
      let ctaFound = false;
      let ctaCopyStrength = 0;
      for (const el of ctaEls) {
        if (ctaFound) break;
        const r = (el as HTMLElement).getBoundingClientRect();
        if (r.top > 600 || r.height === 0 || r.width === 0) continue;
        if (el.closest("nav")) continue;
        const t = (el.textContent || "").trim().toLowerCase();
        if (ctaRe.test(t) || el.tagName === "BUTTON" || (el as HTMLInputElement).type === "submit") {
          ctaFound = true;
          if (t.length >= 2 && t.length <= 30) ctaCopyStrength = 2;
          else if (t.length > 0) ctaCopyStrength = 1;
        }
      }
      if (ctaFound) {
        fullPoints("content", 8);
      } else {
        let anyLink = false;
        ctaEls.forEach((el) => {
          const r = (el as HTMLElement).getBoundingClientRect();
          if (r.top < 600 && r.height > 0 && !el.closest("nav")) anyLink = true;
        });
        if (anyLink) {
          pushIssue("content", {
            id: "cta-weak", title: "Weak CTA Above Fold",
            desc: "Clickable elements exist above the fold but lack strong call-to-action language.",
            fix: 'Use action-oriented text like "Get Started Free" or "Try It Now" for your main CTA.',
            severity: "warning", selector: null, pts: 3, max: 8, quickFix: "fixCTACopy",
            impact: 3, visibility: 3, ease: 3,
          });
        } else {
          pushIssue("content", {
            id: "cta-missing", title: "No CTA Above Fold",
            desc: "No call-to-action button or link is visible without scrolling.",
            fix: 'Add a prominent CTA button above the fold with action text like "Get Started" or "Sign Up Free".',
            severity: "error", selector: null, pts: 0, max: 8, quickFix: "fixMissingCTA",
            impact: 3, visibility: 3, ease: 2,
          });
        }
      }

      // 2b. CTA Copy Strength (5 pts)
      if (ctaCopyStrength >= 2) {
        fullPoints("content", 5);
      } else if (ctaCopyStrength === 1) {
        pushIssue("content", {
          id: "cta-copy-weak", title: "CTA Copy Could Be Stronger",
          desc: 'Your CTA text is long or vague. The best CTAs are 2-5 action words like "Start Free Trial" or "Get Yours Now".',
          fix: "Shorten your main CTA to 2-5 action-oriented words.",
          severity: "warning", selector: null, pts: 2, max: 5, quickFix: "fixCTACopy",
          impact: 2, visibility: 3, ease: 3,
        });
      } else {
        pushIssue("content", {
          id: "cta-copy-none", title: "No Compelling CTA Copy",
          desc: "No clear call-to-action text found above the fold. Visitors need explicit direction on what to do next.",
          fix: 'Add a button with concise action text like "Start Free" or "Join Now".',
          severity: "error", selector: null, pts: 0, max: 5, quickFix: "fixNoCTACopy",
          impact: 3, visibility: 3, ease: 2,
        });
      }

      // 2c. Value Proposition (7 pts)
      const h1Text = h1s.length > 0 ? (h1s[0].textContent || "").trim().toLowerCase() : "";
      const heroText = (() => {
        const sections = doc.querySelectorAll("section, header, [class*='hero']");
        if (sections.length === 0) return bodyText.substring(0, 500);
        return Array.from(sections).slice(0, 2).map((s) => (s.textContent || "").trim().toLowerCase()).join(" ");
      })();

      const genericValueWords = ["faster", "easier", "better", "simple", "quick", "powerful", "amazing", "best", "great", "efficient"];
      const hasGenericClaim = genericValueWords.some((w) => heroText.includes(w));

      const specificClaimPatterns = [
        /\d+x\s*(faster|more|better|increase)/i,
        /\d+%\s*(more|less|faster|better|increase|reduce)/i,
        /save\s+\d+\s*(hour|minute|day|week|month)/i,
        /in\s+(under\s+)?\d+\s*(second|minute|hour)/i,
        /\$\d+(\.\d+)?\s*(per|\/|a\s+)(month|year|week)/i,
        /\d+\+?\s*(customer|user|client|star|review)/i,
        /free\s+(trial|plan|start|forever)/i,
        /no\s+(credit\s*card|commitment|risk)/i,
        /guarantee(ed)?\s+(result|satisfaction|outcome)/i,
        /\d+\s*(day|week|month)\s+(money\s*-?\s*back|guarantee)/i,
        /(under|less\s+than)\s+\$\d+/i,
        /\d+\s*(feature|template|integration)s?/i,
      ];
      const matchedSpecificClaims = specificClaimPatterns.filter((p) => p.test(heroText));
      const hasSpecificClaims = matchedSpecificClaims.length > 0;

      const outcomePatterns = [
        /grow\s+(your\s+)?(audience|revenue|business|traffic)/i,
        /increase\s+(your\s+)?(sales|conversion|traffic|revenue)/i,
        /reduce\s+(cost|time|expense)/i,
        /automate\s+(your\s+)?\w+/i,
        /eliminate\s+\w+/i,
        /double\s+(your\s+)?\w+/i,
        /triple\s+(your\s+)?\w+/i,
      ];
      const hasOutcomeClaims = outcomePatterns.some((p) => p.test(heroText));

      let valueScore = 0;
      let claimType: "none" | "generic" | "specific" | "outcome" = "none";
      if (h1Text.length > 10) valueScore += 1;
      if (hasGenericClaim && !hasSpecificClaims) {
        valueScore += 1;
        claimType = "generic";
      }
      if (hasSpecificClaims) {
        valueScore += Math.min(4, 2 + matchedSpecificClaims.length);
        claimType = "specific";
      }
      if (hasOutcomeClaims) {
        valueScore += 2;
        claimType = "outcome";
      }

      if (valueScore >= 5) {
        fullPoints("content", 7);
      } else if (claimType === "generic") {
        pushIssue("content", {
          id: "value-generic", title: "Generic Claims Need Specifics",
          desc: 'Your page uses vague claims like "faster" and "easier" without specifics. These don\'t differentiate you from competitors — everyone says this. Specific numbers create credibility and urgency.',
          fix: 'Replace "faster" with "3x faster". Replace "easier" with "done in 5 minutes". Add real numbers: "Save 5 hours/week", "Join 50,000+ users", "4.9★ rating".',
          severity: "warning", selector: "h1", pts: valueScore, max: 7, quickFix: null,
          impact: 3, visibility: 3, ease: 1,
        });
      } else if (valueScore >= 3 || claimType === "specific") {
        pushIssue("content", {
          id: "value-moderate", title: "Value Proposition Could Be Stronger",
          desc: "Your headline has some specific claims but could be more compelling. Add outcome-focused benefits to strengthen conversion.",
          fix: 'Lead with the outcome: "Grow Your Revenue 3x Faster" beats "Marketing Tool". Add a secondary benefit: "Save 10 hours/week on manual tasks".',
          severity: "warning", selector: "h1", pts: valueScore, max: 7, quickFix: null,
          impact: 3, visibility: 3, ease: 1,
        });
      } else {
        pushIssue("content", {
          id: "value-weak", title: "Weak Value Proposition",
          desc: "The page lacks a clear, compelling statement of what the user gains. Visitors decide in 3 seconds whether to stay.",
          fix: 'Rewrite your H1 with a specific, measurable benefit: "Write Better Content 3x Faster" beats "AI Writer Pro". Add proof: "Used by 10,000+ marketers".',
          severity: "error", selector: "h1", pts: valueScore, max: 7, quickFix: null,
          impact: 3, visibility: 3, ease: 1,
        });
      }

      // 2d. Trust Signals (5 pts)
      let trust = 0;
      if (
        ["testimonial", "review", "what our users say", "what people say", "customer story", "rated", "stars"].some((k) => bodyText.includes(k)) ||
        doc.querySelector('[class*="testimonial"],[class*="review"],blockquote')
      ) trust += 2;
      if (["guarantee", "warranty", "money back", "risk-free", "satisfaction", "refund"].some((k) => bodyText.includes(k))) trust += 1;
      if (["contact", "email", "phone", "address", "support"].some((k) => bodyText.includes(k)) || /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(bodyText)) trust += 2;
      cats.content.total += 5;
      cats.content.earned += trust;
      if (trust < 5) {
        const miss: string[] = [];
        if (trust < 2) miss.push("testimonials");
        else if (trust < 3) miss.push("guarantee");
        if (!bodyText.includes("contact") && !bodyText.includes("email") && !bodyText.includes("@") && !bodyText.includes("phone")) miss.push("contact info");
        pushIssue("content", {
          id: "trust", title: "Missing Trust Signals",
          desc: `Add ${miss.join(", ")} to build visitor confidence.`,
          fix: "Include customer testimonials, a satisfaction guarantee, and clear contact information.",
          severity: trust === 0 ? "error" : "warning", selector: null, pts: trust, max: 5, quickFix: "fixTrustSignals",
          impact: 2, visibility: 2, ease: 3,
        });
      }
    } catch (e) {
      console.error("PixelForge: Content scoring error", e);
    }

    /* ═══ CATEGORY 3: ACCESSIBILITY (25 pts) ═══ */
    try {
      // 3a. Image Alt Text (7 pts)
      if (imgs.length === 0) {
        fullPoints("a11y", 7);
      } else {
        let ok = 0;
        const bad: HTMLImageElement[] = [];
        imgs.forEach((img) => {
          const alt = (img.getAttribute("alt") || "").trim();
          if (alt.length > 0 && alt.toLowerCase() !== "image" && alt.toLowerCase() !== "photo" && alt.toLowerCase() !== "picture") ok++;
          else bad.push(img);
        });
        const pts = Math.round((ok / imgs.length) * 7);
        cats.a11y.earned += pts;
        cats.a11y.total += 7;
        if (bad.length > 0) {
          const sel = bad[0] ? getSelector(bad[0]) : null;
          pushIssue("a11y", {
            id: "alt-missing", title: `${bad.length} Image${bad.length > 1 ? "s" : ""} Missing Alt`,
            desc: `${bad.length} of ${imgs.length} images have missing or unhelpful alt attributes. Screen readers skip these entirely.`,
            fix: "Add descriptive alt text to all images for accessibility and SEO.",
            severity: bad.length === imgs.length ? "error" : "warning", selector: sel, pts, max: 7, quickFix: "fixAltText",
            impact: 2, visibility: 1, ease: 3,
          });
        }
      }

      // 3b. Form Labels & ARIA (6 pts)
      const inputs = Array.from(
        doc.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select')
      );
      if (inputs.length === 0) {
        fullPoints("a11y", 6);
      } else {
        let labeled = 0;
        let unlabeled = 0;
        inputs.forEach((inp) => {
          const id = inp.getAttribute("id");
          const hasLabel = id && doc.querySelector(`label[for="${id}"]`);
          const hasAriaLabel = inp.getAttribute("aria-label") || inp.getAttribute("aria-labelledby");
          const hasTitle = inp.getAttribute("title");
          const hasPlaceholder = inp.getAttribute("placeholder");
          if (hasLabel || hasAriaLabel || hasTitle) {
            labeled++;
          } else if (hasPlaceholder) {
            labeled += 0.5;
          } else {
            unlabeled++;
          }
        });
        const pts = Math.round((labeled / inputs.length) * 6);
        cats.a11y.earned += pts;
        cats.a11y.total += 6;
        if (unlabeled > 0) {
          pushIssue("a11y", {
            id: "form-labels", title: `${unlabeled} Form Field${unlabeled > 1 ? "s" : ""} Missing Label`,
            desc: `${unlabeled} of ${inputs.length} form inputs have no associated <label>, aria-label, or title. Screen readers cannot identify these fields.`,
            fix: "Add a <label for=\"id\"> for each input, or add aria-label attribute.",
            severity: unlabeled === inputs.length ? "error" : "warning", selector: null, pts, max: 6, quickFix: "fixFormLabels",
            impact: 2, visibility: 1, ease: 3,
          });
        }
      }

      // 3c. Link Text Quality (5 pts)
      const badLinkTexts = ["click here", "read more", "learn more", "here", "more", "link", "this", "go", "see more", "continue", "click"];
      let goodLinks = 0;
      const badLinks: HTMLAnchorElement[] = [];
      links.forEach((a) => {
        const t = (a.textContent || "").trim().toLowerCase();
        if (!t) { badLinks.push(a); return; }
        if (badLinkTexts.includes(t)) { badLinks.push(a); return; }
        if (t.length < 3 && !a.querySelector("img[alt]")) { badLinks.push(a); return; }
        goodLinks++;
      });
      if (links.length === 0) {
        fullPoints("a11y", 5);
      } else {
        const pts = Math.round((goodLinks / links.length) * 5);
        cats.a11y.earned += pts;
        cats.a11y.total += 5;
        if (badLinks.length > 0) {
          const sel = badLinks[0] ? getSelector(badLinks[0]) : null;
          pushIssue("a11y", {
            id: "link-text", title: `${badLinks.length} Vague Link${badLinks.length > 1 ? "s" : ""}`,
            desc: 'Links like "click here" or "read more" tell screen readers nothing about the destination. Use descriptive text instead.',
            fix: 'Replace vague link text with descriptive text: "Read our pricing guide" instead of "Click here".',
            severity: badLinks.length > links.length / 2 ? "error" : "warning", selector: sel, pts, max: 5, quickFix: "fixLinkText",
            impact: 1, visibility: 2, ease: 3,
          });
        }
      }

      // 3d. Color Contrast (4 pts)
      let cOk = 0;
      let cTotal = 0;
      const cFails: Element[] = [];
      const textEls = doc.querySelectorAll("p,h1,h2,h3,h4,h5,h6,a,span,li,label,button");
      const sample = Array.from(textEls).slice(0, 25);
      sample.forEach((el) => {
        try {
          const dv = doc.defaultView;
          if (!dv) return;
          const cs = dv.getComputedStyle(el as HTMLElement);
          const fg = cs.color;
          const bg = cs.backgroundColor;
          if (fg && bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
            cTotal++;
            if (getContrastRatio(fg, bg) >= 4.5) cOk++;
            else if (cFails.length < 2) cFails.push(el);
          }
        } catch {
          /* skip */
        }
      });
      if (cTotal === 0) {
        fullPoints("a11y", 4);
      } else {
        const pts = Math.round((cOk / cTotal) * 4);
        cats.a11y.earned += pts;
        cats.a11y.total += 4;
        if (cOk < cTotal) {
          const sel = cFails[0] ? getSelector(cFails[0]) : null;
          pushIssue("a11y", {
            id: "contrast", title: "Low Color Contrast",
            desc: `${cTotal - cOk} text element${cTotal - cOk > 1 ? "s" : ""} have insufficient contrast against their background. WCAG requires 4.5:1 for body text.`,
            fix: "Increase contrast between text and background. Dark text on light backgrounds (or vice versa) is safest.",
            severity: cOk / cTotal < 0.5 ? "error" : "warning", selector: sel, pts, max: 4, quickFix: "fixContrast",
            impact: 2, visibility: 3, ease: 3,
          });
        }
      }

      // 3e. Focus Indicators (3 pts)
      const focusStyles = doc.querySelectorAll('[style*="outline:none"],[style*="outline: none"],[style*="outline:0"],[style*="outline: 0"]');
      let outlineNoneInCSS = false;
      styleEls.forEach((s) => {
        if (/:focus\s*\{[^}]*outline\s*:\s*(none|0)/i.test(s.textContent || "")) outlineNoneInCSS = true;
      });
      let hasCustomFocus = false;
      styleEls.forEach((s) => {
        if (/:focus-visible|:focus\s*\{[^}]*outline\s*:\s*(?!none|0)/i.test(s.textContent || "")) hasCustomFocus = true;
      });
      if (focusStyles.length === 0 && !outlineNoneInCSS) {
        fullPoints("a11y", 3);
      } else if (hasCustomFocus) {
        fullPoints("a11y", 3);
      } else {
        pushIssue("a11y", {
          id: "focus", title: "Missing Focus Indicators",
          desc: `${focusStyles.length} element${focusStyles.length > 1 ? "s" : ""} have outline:none, and no custom :focus styles are defined. Keyboard users cannot see which element is selected.`,
          fix: "Remove outline:none, or add custom :focus-visible styles that are visually distinct.",
          severity: "warning", selector: focusStyles[0] ? getSelector(focusStyles[0]) : null, pts: 1, max: 3, quickFix: "fixFocusStyles",
          impact: 1, visibility: 1, ease: 3,
        });
      }
    } catch (e) {
      console.error("PixelForge: A11y scoring error", e);
    }

    /* ═══ CATEGORY 4: STRUCTURE & MOBILE (20 pts) ═══ */
    try {
      // 4a. Heading Hierarchy (5 pts)
      const headings = Array.from(doc.querySelectorAll("h1,h2,h3,h4,h5,h6"));
      if (headings.length <= 1) {
        fullPoints("structure", 5);
      } else {
        const levels = headings.map((h) => parseInt(h.tagName[1]));
        let ok = true;
        let skipIdx = -1;
        for (let i = 1; i < levels.length; i++) {
          if (levels[i] > levels[i - 1] + 1) {
            ok = false;
            skipIdx = i;
            break;
          }
        }
        if (ok) {
          fullPoints("structure", 5);
        } else {
          const badHeading = headings[skipIdx];
          const prevHeading = headings[skipIdx - 1];
          const sel = getSelector(badHeading);
          const recommendedLevel = levels[skipIdx - 1] + 1;
          const recommendedTag = "H" + recommendedLevel;
          const badTag = "H" + levels[skipIdx];
          const badText = (badHeading.textContent || "").trim().substring(0, 40);
          const prevText = (prevHeading.textContent || "").trim().substring(0, 40);
          pushIssue("structure", {
            id: "heading-hierarchy", title: "Heading Hierarchy Skip",
            desc: `After "${prevText}" (${prevHeading.tagName.toUpperCase()}), the next heading "${badText}" uses <${badTag}>, but it should be <${recommendedTag}> to maintain sequential order.`,
            fix: `Change this <${badTag}> to <${recommendedTag}> — it follows an ${prevHeading.tagName.toUpperCase()} so it must be one level deeper.`,
            severity: "warning", selector: sel, pts: 1, max: 5, quickFix: "fixHeading:" + recommendedTag.toLowerCase(),
            impact: 2, visibility: 2, ease: 3,
          });
        }
      }

      // 4b. Viewport Meta Tag (5 pts)
      const viewportEl = doc.querySelector('meta[name="viewport"]');
      const viewportContent = viewportEl ? viewportEl.getAttribute("content") || "" : "";
      if (!viewportEl) {
        pushIssue("structure", {
          id: "viewport-missing", title: "Missing Viewport Meta Tag",
          desc: "No viewport meta tag found. Without it, mobile browsers render the page at desktop width and zoom out, making text tiny and unreadable.",
          fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head>.',
          severity: "error", selector: null, pts: 0, max: 5, quickFix: "addViewport",
          impact: 3, visibility: 3, ease: 3,
        });
      } else if (!viewportContent.includes("width=device-width")) {
        pushIssue("structure", {
          id: "viewport-width", title: "Viewport Missing device-width",
          desc: "The viewport meta exists but doesn't set width=device-width. The page may not adapt properly to mobile screens.",
          fix: "Add width=device-width to your viewport meta content attribute.",
          severity: "warning", selector: null, pts: 2, max: 5, quickFix: "addViewport",
          impact: 2, visibility: 2, ease: 3,
        });
      } else {
        fullPoints("structure", 5);
      }

      // 4c. Touch Targets (5 pts)
      const touchEls = Array.from(doc.querySelectorAll('a, button, [role="button"], input[type="submit"], input[type="button"]'));
      let touchOk = 0;
      const touchBad: Element[] = [];
      touchEls.forEach((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (r.width >= 36 && r.height >= 36) touchOk++;
        else touchBad.push(el);
      });
      const touchTotal = touchOk + touchBad.length;
      if (touchTotal === 0) {
        fullPoints("structure", 5);
      } else {
        const pts = Math.round((touchOk / touchTotal) * 5);
        cats.structure.earned += pts;
        cats.structure.total += 5;
        if (touchBad.length > 0) {
          const sel = touchBad[0] ? getSelector(touchBad[0]) : null;
          pushIssue("structure", {
            id: "touch-targets", title: `${touchBad.length} Touch Target${touchBad.length > 1 ? "s" : ""} Too Small`,
            desc: `${touchBad.length} of ${touchTotal} interactive elements are smaller than 36x36px. Mobile users will struggle to tap them accurately.`,
            fix: "Increase button/link padding to at least 36x36px (44x44 is the WCAG recommended minimum).",
            severity: touchBad.length > touchTotal / 2 ? "error" : "warning", selector: sel, pts, max: 5, quickFix: "fixTouchTargets",
            impact: 2, visibility: 2, ease: 3,
          });
        }
      }

      // 4d. Hero Section (5 pts)
      const hasHero = (() => {
        if (h1s.length === 0) return 0;
        const h1Rect = h1s[0].getBoundingClientRect();
        if (h1Rect.top > 300) return 0;
        let heroCta = false;
        ctaEls.forEach((el) => {
          const r = (el as HTMLElement).getBoundingClientRect();
          if (r.top < 400 && r.height > 0 && !el.closest("nav")) heroCta = true;
        });
        let heroSupport = false;
        const h1Parent = h1s[0].parentElement;
        if (h1Parent) {
          const siblings = h1Parent.querySelectorAll("p, h2");
          if (siblings.length > 0) heroSupport = true;
        }
        let score = 0;
        if (h1Rect.top < 300) score += 2;
        if (heroCta) score += 2;
        if (heroSupport) score += 1;
        return score;
      })();
      cats.structure.earned += hasHero;
      cats.structure.total += 5;
      if (hasHero < 5) {
        const miss: string[] = [];
        if (hasHero < 2) miss.push("H1 at the top");
        if (hasHero < 4) miss.push("CTA near the headline");
        if (hasHero < 5) miss.push("supporting subtext");
        pushIssue("structure", {
          id: "hero", title: "Incomplete Hero Section",
          desc: `Your hero section is missing: ${miss.join(", ")}. The hero is the first thing visitors see — it needs a strong headline, supporting text, and a clear CTA.`,
          fix: "Restructure the top of your page: H1 headline → supporting paragraph → CTA button, all visible without scrolling.",
          severity: hasHero < 2 ? "error" : "warning", selector: "h1", pts: hasHero, max: 5, quickFix: null,
          impact: 3, visibility: 3, ease: 1,
        });
      }
    } catch (e) {
      console.error("PixelForge: Structure scoring error", e);
    }

    /* ═══ CATEGORY 5: PERFORMANCE & MOBILE (30 pts) ═══ */
    try {
      // 5a. DOM Complexity (4 pts)
      const allNodes = doc.querySelectorAll("*").length;
      if (allNodes < 500) {
        fullPoints("perf", 4);
      } else if (allNodes < 1000) {
        pushIssue("perf", {
          id: "dom-size", title: "Large DOM Size",
          desc: `${allNodes} DOM elements found. Pages over 500 elements render slower, especially on mobile devices.`,
          fix: "Remove unnecessary wrapper divs and reduce nesting depth. Aim for under 500 elements.",
          severity: "warning", selector: null, pts: 2, max: 4, quickFix: null,
          impact: 1, visibility: 1, ease: 1,
        });
      } else {
        pushIssue("perf", {
          id: "dom-size", title: "Very Large DOM Size",
          desc: `${allNodes} DOM elements found. This will cause slow rendering and high memory usage on mobile devices.`,
          fix: "Drastically reduce DOM elements. Remove unnecessary wrappers, merge sections, simplify structure.",
          severity: "error", selector: null, pts: 0, max: 4, quickFix: null,
          impact: 2, visibility: 1, ease: 1,
        });
      }

      // 5b. Image Size Attributes / CLS (3 pts)
      if (imgs.length === 0) {
        fullPoints("perf", 3);
      } else {
        let imgsSized = 0;
        imgs.forEach((img) => {
          if (img.getAttribute("width") || img.getAttribute("height") || (img as HTMLImageElement).style.width || (img as HTMLImageElement).style.height) imgsSized++;
        });
        const pts = Math.round((imgsSized / imgs.length) * 3);
        cats.perf.earned += pts;
        cats.perf.total += 3;
        const unsized = imgs.length - imgsSized;
        if (unsized > 0) {
          pushIssue("perf", {
            id: "img-size", title: `${unsized} Image${unsized > 1 ? "s" : ""} Missing Size Attributes`,
            desc: `${unsized} of ${imgs.length} images have no width/height attributes. This causes layout shift (CLS) as images load — a key Google Core Web Vitals metric.`,
            fix: "Add width and height attributes to all <img> tags so the browser reserves space before loading.",
            severity: unsized === imgs.length ? "error" : "warning", selector: null, pts, max: 3, quickFix: "fixImgSize",
            impact: 2, visibility: 1, ease: 3,
          });
        }
      }

      // 5c. External Resource Count (3 pts)
      const extStylesheets = doc.querySelectorAll('link[rel="stylesheet"]');
      const extScripts = doc.querySelectorAll("script[src]");
      const totalResources = extStylesheets.length + extScripts.length;
      let renderBlocking = extStylesheets.length;
      extScripts.forEach((s) => {
        if (!(s as HTMLScriptElement).async && !(s as HTMLScriptElement).defer && !(s.getAttribute("type") || "").includes("module")) renderBlocking++;
      });
      if (totalResources <= 3) {
        fullPoints("perf", 3);
      } else if (totalResources <= 8) {
        pushIssue("perf", {
          id: "resources", title: "Many External Resources",
          desc: `${totalResources} external resources (${extStylesheets.length} CSS, ${extScripts.length} JS). Each adds a network request that delays page load, especially on mobile.`,
          fix: "Combine and minify CSS/JS files where possible. Use async/defer on non-critical scripts.",
          severity: "warning", selector: null, pts: 1, max: 3, quickFix: "fixExternalResources",
          impact: 1, visibility: 1, ease: 3,
        });
      } else {
        pushIssue("perf", {
          id: "resources", title: "Too Many External Resources",
          desc: `${totalResources} external resources (${extStylesheets.length} CSS, ${extScripts.length} JS). This significantly slows mobile page load.`,
          fix: "Drastically reduce external files. Combine CSS into one file, use async/defer on all scripts, and remove unused resources.",
          severity: "error", selector: null, pts: 0, max: 3, quickFix: "fixExternalResources",
          impact: 2, visibility: 1, ease: 3,
        });
      }

      // 5d. font-display: swap on Google Fonts (3 pts)
      const gFontsLinks = Array.from(doc.querySelectorAll('link[href*="fonts.googleapis.com"]'));
      if (gFontsLinks.length === 0) {
        fullPoints("perf", 3);
      } else {
        const allSwap = gFontsLinks.every((l) => (l.getAttribute("href") || "").includes("display=swap"));
        if (allSwap) {
          fullPoints("perf", 3);
        } else {
          pushIssue("perf", {
            id: "font-display", title: "Google Fonts Missing display=swap",
            desc: "Google Fonts without display=swap blocks text rendering on mobile while fonts download, causing a blank screen flash (FOIT). This is one of the most common reasons mobile scores tank vs desktop.",
            fix: "Add &display=swap to your Google Fonts URL. e.g. fonts.googleapis.com/css2?family=Inter&display=swap",
            severity: "error", selector: null, pts: 0, max: 3, quickFix: "fixFontDisplay",
            impact: 3, visibility: 3, ease: 3,
          });
        }
      }

      // 5e. Lazy Loading below-fold images (3 pts)
      if (imgs.length === 0) {
        fullPoints("perf", 3);
      } else {
        let lazyCount = 0;
        let belowFoldCount = 0;
        imgs.forEach((img) => {
          const r = (img as HTMLImageElement).getBoundingClientRect();
          if (r.top > 600) {
            belowFoldCount++;
            if (img.getAttribute("loading") === "lazy") lazyCount++;
          }
        });
        if (belowFoldCount === 0) {
          fullPoints("perf", 3);
        } else {
          const pts = Math.round((lazyCount / belowFoldCount) * 3);
          cats.perf.earned += pts;
          cats.perf.total += 3;
          const missing = belowFoldCount - lazyCount;
          if (missing > 0) {
            pushIssue("perf", {
              id: "lazy-load", title: `${missing} Below-fold Image${missing > 1 ? "s" : ""} Not Lazy Loaded`,
              desc: `${missing} of ${belowFoldCount} below-fold images load eagerly. On mobile, this wastes bandwidth and delays page load for images the user hasn't scrolled to yet.`,
              fix: 'Add loading="lazy" to all images below the fold.',
              severity: missing === belowFoldCount ? "error" : "warning", selector: null, pts, max: 3, quickFix: "fixLazyLoad",
              impact: 3, visibility: 2, ease: 3,
            });
          }
        }
      }

      // 5f. Hero Image Preload / LCP (3 pts)
      const heroImg = (() => {
        const result: { value: { el: Element; area: number } | null } = { value: null };
        imgs.forEach((img) => {
          const r = (img as HTMLImageElement).getBoundingClientRect();
          if (r.top < 600 && r.width > 100 && r.height > 80) {
            if (!result.value || r.width * r.height > result.value.area) {
              result.value = { el: img as Element, area: r.width * r.height };
            }
          }
        });
        return result.value ? result.value.el : null;
      })();
      if (!heroImg) {
        fullPoints("perf", 3);
      } else {
        const src = heroImg.getAttribute("src") || "";
        const preloadExists = Array.from(doc.querySelectorAll('link[rel="preload"][as="image"]')).some((l) => l.getAttribute("href") === src);
        if (preloadExists) {
          fullPoints("perf", 3);
        } else {
          pushIssue("perf", {
            id: "hero-preload", title: "Hero Image Not Preloaded (LCP)",
            desc: "Your largest above-fold image is the Largest Contentful Paint (LCP) element — the metric Google weights most heavily in PageSpeed. Without a preload hint, mobile browsers discover it late, causing slow LCP.",
            fix: '<link rel="preload" as="image" href="your-hero.jpg"> in the <head> to tell browsers to fetch it immediately.',
            severity: "error", selector: null, pts: 0, max: 3, quickFix: "fixHeroPreload",
            impact: 3, visibility: 3, ease: 3,
          });
        }
      }

      // 5g. Responsive Images — srcset (3 pts)
      if (imgs.length === 0) {
        fullPoints("perf", 3);
      } else {
        let srcsetCount = 0;
        imgs.forEach((img) => {
          if (img.getAttribute("srcset") || img.closest("picture")) srcsetCount++;
        });
        const pts = Math.round((srcsetCount / imgs.length) * 3);
        cats.perf.earned += pts;
        cats.perf.total += 3;
        const missing = imgs.length - srcsetCount;
        if (missing > 0) {
          pushIssue("perf", {
            id: "srcset-missing", title: `${missing} Image${missing > 1 ? "s" : ""} Missing srcset`,
            desc: `${missing} of ${imgs.length} images have no srcset attribute. Mobile devices download the full-size desktop image even though they only need a smaller version — wasting bandwidth and slowing load time.`,
            fix: 'Add srcset with multiple sizes, e.g. srcset="img-400.jpg 400w, img-800.jpg 800w". Use WebP format for best results.',
            severity: "warning", selector: null, pts, max: 3, quickFix: "fixSrcset",
            impact: 2, visibility: 1, ease: 2,
          });
        }
      }

      // 5h. Defer/Async on Scripts (2 pts)
      if (extScripts.length === 0) {
        fullPoints("perf", 2);
      } else {
        const blocking = Array.from(extScripts).filter((s) => !(s as HTMLScriptElement).async && !(s as HTMLScriptElement).defer && !(s.getAttribute("type") || "").includes("module"));
        if (blocking.length === 0) {
          fullPoints("perf", 2);
        } else {
          pushIssue("perf", {
            id: "script-blocking", title: `${blocking.length} Render-Blocking Script${blocking.length > 1 ? "s" : ""}`,
            desc: `${blocking.length} external script${blocking.length > 1 ? "s" : ""} lack async or defer. The browser stops parsing HTML to download and execute them, directly delaying mobile page load.`,
            fix: "Add defer to all non-critical scripts. Use async only for scripts that don't depend on the DOM.",
            severity: "error", selector: null, pts: 0, max: 2, quickFix: "fixScriptDefer",
            impact: 3, visibility: 2, ease: 3,
          });
        }
      }

      // 5i. Responsive CSS Media Queries (2 pts)
      const allStyles = styleEls.map((s) => s.textContent || "").join(" ");
      const hasMediaQueries = /@media\s*\(\s*(max|min)-width/i.test(allStyles);
      const hasFlexOrGrid = /display\s*:\s*(flex|grid)/i.test(allStyles);
      if (hasMediaQueries || hasFlexOrGrid) {
        fullPoints("perf", 2);
      } else {
        pushIssue("perf", {
          id: "no-responsive-css", title: "No Responsive CSS Detected",
          desc: "No CSS media queries or flex/grid layout detected. Your page may not adapt to mobile screen sizes, forcing users to zoom and scroll horizontally.",
          fix: "Add @media (max-width: 768px) breakpoints for mobile layouts. At minimum, set images to max-width:100% and stack columns vertically.",
          severity: "warning", selector: null, pts: 0, max: 2, quickFix: "fixResponsiveCSS",
          impact: 2, visibility: 2, ease: 2,
        });
      }

      // 5j. Theme Color Meta (1 pt)
      const themeColor = doc.querySelector('meta[name="theme-color"]');
      if (themeColor) {
        fullPoints("perf", 1);
      } else {
        pushIssue("perf", {
          id: "theme-color", title: "Missing Theme Color",
          desc: "No theme-color meta tag found. This controls the browser chrome color on Android and is a minor signal in mobile browser experience.",
          fix: '<meta name="theme-color" content="#yourcolor"> matching your brand color.',
          severity: "warning", selector: null, pts: 0, max: 1, quickFix: "fixThemeColor",
          impact: 1, visibility: 1, ease: 3,
        });
      }

      // 5k. Font Size (2 pts)
      const bodyStyle = doc.body ? (doc.defaultView || window).getComputedStyle(doc.body) : null;
      const baseFontSize = bodyStyle ? parseFloat(bodyStyle.fontSize) : 16;
      if (baseFontSize >= 15) {
        fullPoints("perf", 2);
      } else {
        pushIssue("perf", {
          id: "font-size", title: `Base Font Too Small (${baseFontSize}px)`,
          desc: `Body text is ${baseFontSize}px. Google flags text under 16px as too small to read on mobile without pinch-zooming, hurting both UX and mobile PageSpeed score.`,
          fix: "Set body { font-size: 16px; } or higher. Never go below 14px for body text.",
          severity: "warning", selector: "body", pts: 0, max: 2, quickFix: "fixFontSize",
          impact: 2, visibility: 2, ease: 3,
        });
      }

      // 5l. Autocomplete on Form Inputs (1 pt)
      const formInputs = doc.querySelectorAll('input[type="email"], input[type="tel"], input[type="text"], input[name]');
      if (formInputs.length === 0) {
        fullPoints("perf", 1);
      } else {
        const noAutocomplete = Array.from(formInputs).filter((i) => !i.getAttribute("autocomplete"));
        if (noAutocomplete.length === 0) {
          fullPoints("perf", 1);
        } else {
          pushIssue("perf", {
            id: "autocomplete", title: "Form Inputs Missing Autocomplete",
            desc: `${noAutocomplete.length} input${noAutocomplete.length > 1 ? "s" : ""} have no autocomplete attribute. On mobile, autocomplete speeds up form completion and is flagged by Google Lighthouse.`,
            fix: 'Add autocomplete="email", autocomplete="name", etc. to relevant inputs.',
            severity: "warning", selector: null, pts: 0, max: 1, quickFix: "fixAutocomplete",
            impact: 1, visibility: 1, ease: 3,
          });
        }
      }

      // 5m. DNS Prefetch (1 pt)
      const extDomains = new Set<string>();
      doc.querySelectorAll('link[href*="://"], script[src*="://"]').forEach((el) => {
        try {
          const u = new URL(el.getAttribute("href") || el.getAttribute("src") || "");
          extDomains.add(u.hostname);
        } catch {
          /* skip */
        }
      });
      const prefetchLinks = doc.querySelectorAll('link[rel="dns-prefetch"], link[rel="preconnect"]');
      if (extDomains.size === 0 || prefetchLinks.length >= Math.min(extDomains.size, 2)) {
        fullPoints("perf", 1);
      } else {
        pushIssue("perf", {
          id: "dns-prefetch", title: "Missing DNS Prefetch for External Domains",
          desc: `${extDomains.size} external domain${extDomains.size > 1 ? "s" : ""} found but no dns-prefetch or preconnect hints. Each external domain costs a DNS lookup on mobile — prefetching eliminates this delay.`,
          fix: '<link rel="dns-prefetch" href="//fonts.googleapis.com"> for each external domain in the <head>.',
          severity: "warning", selector: null, pts: 0, max: 1, quickFix: "fixDnsPrefetch",
          impact: 1, visibility: 1, ease: 3,
        });
      }

      // 5n. Icon Font Warning (1 pt)
      const usesIconFont = Array.from(extStylesheets).some((l) => {
        const h = (l.getAttribute("href") || "").toLowerCase();
        return h.includes("font-awesome") || h.includes("fontawesome") || h.includes("cdnjs.cloudflare.com/ajax/libs/font-awesome");
      });
      if (!usesIconFont) {
        fullPoints("perf", 1);
      } else {
        pushIssue("perf", {
          id: "icon-font", title: "FontAwesome CDN Detected",
          desc: "FontAwesome via CDN loads 600KB+ of CSS and fonts, most of which is unused. On mobile, this is one of the heaviest avoidable performance penalties.",
          fix: "Replace FontAwesome with inline SVG icons for only the icons you use. Tools like iconify.design let you copy individual SVGs.",
          severity: "warning", selector: null, pts: 0, max: 1, quickFix: null,
          impact: 2, visibility: 1, ease: 1,
        });
      }
    } catch (e) {
      console.error("PixelForge: Perf scoring error", e);
    }

    // Calculate totals
    let earned = 0;
    let total = 0;
    for (const k of CATEGORIES) {
      earned += cats[k].earned;
      total += cats[k].total;
    }
    const score = scaleTo100(earned, total);

    // Mobile penalty
    let mobilePenalty = 0;
    issues.forEach((iss) => {
      if (MOBILE_PENALTY_ISSUES.includes(iss.id) && iss.pts < iss.max) {
        const missing = iss.max - iss.pts;
        const penaltyWeight = iss.impact >= 3 ? 2 : iss.impact >= 2 ? 1.5 : 1;
        mobilePenalty += missing * penaltyWeight;
      }
    });
    const desktopScore = score;
    const mobileScore = Math.max(0, Math.round(score - mobilePenalty * 1.5));

    return { score, desktopScore, mobileScore, issues, earned, total, cats };
  } catch (e) {
    console.error("PixelForge: scoring error", e);
    return emptyScore();
  }
}

function emptyScore(): ScoreData {
  return {
    score: 0,
    desktopScore: 0,
    mobileScore: 0,
    issues: [],
    earned: 0,
    total: 0,
    cats: {
      seo: { earned: 0, total: 0 },
      content: { earned: 0, total: 0 },
      a11y: { earned: 0, total: 0 },
      structure: { earned: 0, total: 0 },
      perf: { earned: 0, total: 0 },
    },
  };
}

// ─── Helpers (ported 1:1 from v19) ─────────────────────────────────────

export function getSelector(el: Element | null, _doc?: Document): string | null {
  if (!el || !el.tagName) return null;
  if (el.id) {
    return "#" + (typeof CSS !== "undefined" && CSS.escape ? CSS.escape(el.id) : el.id.replace(/([^\w-])/g, "\\$1"));
  }
  const p = el.parentElement;
  if (!p) return el.tagName.toLowerCase();
  const sibs = Array.from(p.children).filter((c) => c.tagName === el.tagName);
  return sibs.length === 1
    ? el.tagName.toLowerCase()
    : `${el.tagName.toLowerCase()}:nth-of-type(${sibs.indexOf(el) + 1})`;
}

export function getContrastRatio(fg: string, bg: string): number {
  try {
    const f = parseColor(fg);
    const b = parseColor(bg);
    if (!f || !b) return 4;
    const l1 = lum(f);
    const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  } catch {
    return 4;
  }
}

const NAMED_COLORS: Record<string, ColorRGB> = {
  red: { r: 255, g: 0, b: 0 }, green: { r: 0, g: 128, b: 0 },
  blue: { r: 0, g: 0, b: 255 }, white: { r: 255, g: 255, b: 255 },
  black: { r: 0, g: 0, b: 0 }, yellow: { r: 255, g: 255, b: 0 },
  orange: { r: 255, g: 165, b: 0 }, purple: { r: 128, g: 0, b: 128 },
  pink: { r: 255, g: 192, b: 203 }, gray: { r: 128, g: 128, b: 128 },
  grey: { r: 128, g: 128, b: 128 }, cyan: { r: 0, g: 255, b: 255 },
  magenta: { r: 255, g: 0, b: 255 }, lime: { r: 0, g: 255, b: 0 },
  navy: { r: 0, g: 0, b: 128 }, teal: { r: 0, g: 128, b: 128 },
  maroon: { r: 128, g: 0, b: 0 }, olive: { r: 128, g: 128, b: 0 },
  aqua: { r: 0, g: 255, b: 255 }, silver: { r: 192, g: 192, b: 192 },
};

export function parseColor(str: string | null | undefined): ColorRGB | null {
  if (!str) return null;
  str = str.trim().toLowerCase();
  if (str === "transparent" || /^rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)$/.test(str)) return null;
  if (NAMED_COLORS[str]) return NAMED_COLORS[str];
  let m: RegExpMatchArray | null;
  m = str.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  if (m) return { r: parseInt(m[1] + m[1], 16), g: parseInt(m[2] + m[2], 16), b: parseInt(m[3] + m[3], 16) };
  m = str.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/);
  if (m) return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  m = str.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/);
  if (m) return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  m = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) };
  m = str.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
  if (m) {
    const h = parseInt(m[1]) / 360;
    const s = parseInt(m[2]) / 100;
    const l = parseInt(m[3]) / 100;
    if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v }; }
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return {
      r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      g: Math.round(hue2rgb(p, q, h) * 255),
      b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    };
  }
  return null;
}

export function lum(c: ColorRGB): number {
  const [r, g, b] = [c.r / 255, c.g / 255, c.b / 255].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ─── Bonus analyzers (page speed, above-fold, conversion) ──────────────

export function calculatePageSpeed(doc: Document): import("../types").PageSpeedResult {
  const imgs = doc.querySelectorAll("img");
  const scripts = doc.querySelectorAll("script[src]");
  const styles = doc.querySelectorAll('link[rel="stylesheet"]');
  const allNodes = doc.querySelectorAll("*").length;

  const domTime = Math.round(allNodes * 0.05); // ~50μs per node
  const imgTime = imgs.length * 80;
  const scriptTime = scripts.length * 120;
  const cssTime = styles.length * 60;
  const baseTime = 200;
  const totalTime = baseTime + domTime + imgTime + scriptTime + cssTime;

  const badge: "fast" | "moderate" | "slow" = totalTime < 1500 ? "fast" : totalTime < 3000 ? "moderate" : "slow";

  return {
    totalTime,
    badge,
    breakdown: [
      { label: "DOM parsing", value: domTime, rating: domTime < 50 ? "fast" : domTime < 150 ? "moderate" : "slow" },
      { label: "Images", value: imgTime, rating: imgTime < 300 ? "fast" : imgTime < 800 ? "moderate" : "slow" },
      { label: "Scripts", value: scriptTime, rating: scriptTime < 300 ? "fast" : scriptTime < 800 ? "moderate" : "slow" },
      { label: "Stylesheets", value: cssTime, rating: cssTime < 200 ? "fast" : cssTime < 500 ? "moderate" : "slow" },
    ],
  };
}

export function analyzeAboveFold(doc: Document): import("../types").AboveFoldResult {
  const issues: string[] = [];
  let score = 100;
  const h1s = doc.querySelectorAll("h1");
  if (h1s.length === 0) {
    issues.push("No H1");
    score -= 30;
  } else {
    const r = h1s[0].getBoundingClientRect();
    if (r.top > 400) {
      issues.push("H1 below fold");
      score -= 20;
    }
  }
  const ctaEls = doc.querySelectorAll('a[href], button, [role="button"]');
  let hasAboveFoldCta = false;
  ctaEls.forEach((el) => {
    const r = (el as HTMLElement).getBoundingClientRect();
    if (r.top < 600 && r.height > 0 && !el.closest("nav")) hasAboveFoldCta = true;
  });
  if (!hasAboveFoldCta) {
    issues.push("No CTA above fold");
    score -= 25;
  }
  const imgs = doc.querySelectorAll("img");
  let bigImg = false;
  imgs.forEach((img) => {
    const r = (img as HTMLImageElement).getBoundingClientRect();
    if (r.top < 600 && r.width > 200) bigImg = true;
  });
  if (!bigImg && imgs.length > 0) {
    issues.push("No visual hero");
    score -= 15;
  }
  const ps = doc.querySelectorAll("p");
  let hasLead = false;
  ps.forEach((p) => {
    const r = (p as HTMLElement).getBoundingClientRect();
    if (r.top < 600 && (p.textContent || "").length > 30) hasLead = true;
  });
  if (!hasLead) {
    issues.push("No lead paragraph");
    score -= 10;
  }
  return {
    score: Math.max(0, score),
    issues,
    description: issues.length === 0
      ? "Strong above-the-fold: headline, visual, supporting text, and CTA all visible without scrolling."
      : `Above-fold needs work: ${issues.join(", ")}.`,
  };
}

export function calculateConversionScore(scoreData: ScoreData): import("../types").ConversionResult {
  const factors: import("../types").ConversionFactor[] = [];
  const ctaIssue = scoreData.issues.find((i) => i.id.startsWith("cta-"));
  factors.push({
    label: "Clear CTA",
    score: ctaIssue ? Math.round((ctaIssue.pts / ctaIssue.max) * 100) : 100,
    weight: 25,
  });
  const valueIssue = scoreData.issues.find((i) => i.id.startsWith("value-"));
  factors.push({
    label: "Value proposition",
    score: valueIssue ? Math.round((valueIssue.pts / valueIssue.max) * 100) : 100,
    weight: 25,
  });
  const trustIssue = scoreData.issues.find((i) => i.id === "trust");
  factors.push({
    label: "Trust signals",
    score: trustIssue ? Math.round((trustIssue.pts / trustIssue.max) * 100) : 100,
    weight: 20,
  });
  const heroIssue = scoreData.issues.find((i) => i.id === "hero");
  factors.push({
    label: "Hero section",
    score: heroIssue ? Math.round((heroIssue.pts / heroIssue.max) * 100) : 100,
    weight: 15,
  });
  factors.push({
    label: "Mobile UX",
    score: scoreData.mobileScore,
    weight: 15,
  });
  const weighted = factors.reduce((sum, f) => sum + (f.score * f.weight) / 100, 0);
  const description = weighted >= 80
    ? "Strong conversion probability. Visitors have clear direction, compelling value, and trust signals."
    : weighted >= 60
    ? "Moderate conversion probability. Address the weakest factors below to lift conversions."
    : "Low conversion probability. The page is missing key elements visitors need to take action.";
  return { score: Math.round(weighted), factors, description };
}

// NOTE: server-side scoring (runScoringFromHTML) lives in ./server.ts, NOT here.
// engine.ts is imported by client components (Preview.tsx, ScorePanel.tsx), so
// any jsdom import here would be pulled into the client bundle and break it
// (jsdom depends on Node-only modules like whatwg-url). The server-only entry
// point keeps the heavy DOM implementation out of the browser bundle.
