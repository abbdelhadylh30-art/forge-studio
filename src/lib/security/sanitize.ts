/**
 * Sanitization helpers — defense-in-depth for untrusted inputs.
 *
 * SWEBOK KA 3 §4.5 (Error Handling, Exception Handling, and Fault Tolerance)
 * and KA 2 §2.7 (Security): all inputs crossing a trust boundary must be
 * validated and/or sanitized before use.
 */

/**
 * Sanitize a filename for use in a Content-Disposition header.
 * Strips path separators, control chars, and quote characters that could
 * inject additional header fields. Returns a safe fallback if the result
 * is empty.
 */
export function sanitizeFilename(name: string | undefined | null, fallback = "download"): string {
  if (!name) return fallback;
  const cleaned = String(name)
    .replace(/[^\w.\- ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || /^\.+$/.test(cleaned)) return fallback;
  return cleaned.slice(0, 200);
}

/**
 * Strip a core set of active-content vectors from an HTML string fetched
 * from an untrusted URL. This is DEFENSE-IN-DEPTH — the primary mitigation
 * is the sandboxed iframe (no allow-scripts) in which the HTML is rendered.
 *
 * For full-strength sanitization, swap this for `isomorphic-dompurify` in
 * a future iteration (see ARCHITECTURE.md → Security).
 */
export function stripActiveContent(html: string): string {
  let out = html;
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "");
  out = out.replace(/<script\b[^>]*\/?>/gi, "");
  out = out.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // Neutralize javascript: URIs in any attribute that takes a URL.
  // Capture groups: (1) attr name, (2) = + opening quote, (3) closing quote.
  out = out.replace(
    /(href|src|formaction|xlink:href|action|data|poster)(\s*=\s*["'])javascript:[^"']*(["'])/gi,
    '$1$2#$3'
  );
  out = out.replace(/<(object|embed|base)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  out = out.replace(/<(object|embed|base)\b[^>]*\/?>/gi, "");
  out = out.replace(/<meta\b[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, "");
  return out;
}
