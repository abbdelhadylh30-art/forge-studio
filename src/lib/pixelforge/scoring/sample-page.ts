/**
 * PixelForge v19 — Sample demo page
 * The exact same "AI Writer Pro" demo page from v19's loadSamplePage().
 */

export const SAMPLE_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Writer Pro - Write Better, Faster</title>
</head>
<body style="margin:0;font-family:system-ui,sans-serif;color:#1a1a2e;background:#f8f9ff">
  <header style="background:#1a1a2e;color:#fff;padding:16px 40px;display:flex;align-items:center;justify-content:space-between">
    <div style="font-size:22px;font-weight:700">AI Writer Pro</div>
    <nav style="display:flex;gap:24px;font-size:14px">
      <a href="#" style="color:#ccc;text-decoration:none">Features</a>
      <a href="#" style="color:#ccc;text-decoration:none">Pricing</a>
      <a href="#" style="color:#ccc;text-decoration:none">About</a>
    </nav>
  </header>
  <section style="text-align:center;padding:80px 40px 60px;background:linear-gradient(135deg,#1a1a2e,#16213e)">
    <h1 style="font-size:52px;font-weight:800;color:#fff;margin:0 0 16px">Write Better. Write Faster.</h1>
    <p style="font-size:20px;color:#a0aec0;max-width:600px;margin:0 auto 32px">AI-powered writing assistant that helps you create stunning content in seconds. Join 50,000+ writers.</p>
    <a href="#signup" style="display:inline-block;padding:16px 40px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;font-size:18px;font-weight:600">Start Writing Free</a>
  </section>
  <section style="padding:60px 40px;text-align:center">
    <h2 style="font-size:32px;font-weight:700;margin:0 0 12px">Powerful Features</h2>
    <p style="color:#666;margin:0 0 40px">Everything you need to supercharge your writing</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px;max-width:900px;margin:0 auto">
      <div style="padding:32px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
        <img src="https://placehold.co/80x80/4f46e5/fff?text=AI" alt="Smart Suggestions icon showing AI brain" width="80" height="80" style="margin-bottom:12px;border-radius:8px">
        <h3 style="font-size:18px;font-weight:600;margin:0 0 8px">Smart Suggestions</h3>
        <p style="color:#666;font-size:14px;margin:0">Get real-time suggestions to improve your writing style and clarity.</p>
      </div>
      <div style="padding:32px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
        <img src="https://placehold.co/80x80/10b981/fff?text=EN" width="80" height="80" style="margin-bottom:12px;border-radius:8px">
        <h3 style="font-size:18px;font-weight:600;margin:0 0 8px">Multi-Language</h3>
        <p style="color:#666;font-size:14px;margin:0">Write in 30+ languages with native-level quality and fluency.</p>
      </div>
      <div style="padding:32px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
        <img src="https://placehold.co/80x80/f59e0b/fff?text=SEO" width="80" height="80" style="margin-bottom:12px;border-radius:8px">
        <h3 style="font-size:18px;font-weight:600;margin:0 0 8px">SEO Optimized</h3>
        <p style="color:#666;font-size:14px;margin:0">Automatically optimize your content for search engines and readability.</p>
      </div>
    </div>
  </section>
  <section id="signup" style="padding:60px 40px;background:#f0f0ff;text-align:center">
    <h2 style="font-size:28px;font-weight:700;margin:0 0 8px">Try It Free Today</h2>
    <p style="color:#666;margin:0 0 24px">No credit card required. Start writing in seconds.</p>
    <form style="max-width:400px;margin:0 auto;display:flex;gap:8px" action="#" method="post">
      <input type="email" placeholder="Enter your email" style="flex:1;padding:12px 16px;border:1px solid #ddd;border-radius:8px;font-size:15px">
      <button type="submit" style="padding:12px 24px;background:#4f46e5;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer">Sign Up</button>
    </form>
  </section>
  <section style="padding:60px 40px;text-align:center">
    <h2 style="font-size:28px;font-weight:700;margin:0 0 24px">What Our Users Say</h2>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px;max-width:700px;margin:0 auto">
      <div style="padding:24px;background:#fff;border-radius:12px;text-align:left">
        <p style="font-style:italic;color:#444;margin:0 0 12px">"AI Writer Pro cut my writing time in half. It's like having a professional editor on standby 24/7."</p>
        <p style="font-weight:600;margin:0;color:#1a1a2e">Sarah Chen</p>
      </div>
      <div style="padding:24px;background:#fff;border-radius:12px;text-align:left">
        <p style="font-style:italic;color:#444;margin:0 0 12px">"The suggestions are spot-on. My blog traffic increased 40% since I started using it."</p>
        <p style="font-weight:600;margin:0;color:#1a1a2e">Marcus Johnson</p>
      </div>
    </div>
  </section>
  <footer style="background:#1a1a2e;color:#a0aec0;padding:40px;text-align:center;font-size:13px">
    <p style="margin:0 0 8px">Contact us: hello@aiwriterpro.com</p>
    <p style="margin:0">&copy; ${new Date().getFullYear()} AI Writer Pro. All rights reserved.</p>
  </footer>
</body>
</html>`;

/**
 * Build a sanitized HTML document string from raw imported HTML.
 * Strips script tags that aren't from a known-safe list.
 * Mirrors v19's sanitizeImportedHTML.
 */
export function sanitizeImportedHTML(html: string): string {
  // Remove script tags entirely (we don't execute imported JS)
  let out = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  // Remove event handler attributes (on*)
  out = out.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // Remove javascript: URLs
  out = out.replace(/(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*')/gi, '$1="#"');
  return out;
}
