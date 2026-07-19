import { describe, it, expect } from "vitest";
import { sanitizeFilename, stripActiveContent } from "./sanitize";

describe("sanitizeFilename", () => {
  it("passes through clean names", () => {
    expect(sanitizeFilename("my-page.html")).toBe("my-page.html");
    expect(sanitizeFilename("report_2024.csv")).toBe("report_2024.csv");
  });

  it("strips path separators (header-injection defense)", () => {
    // Dots are preserved (in the allowlist); only separators are stripped.
    expect(sanitizeFilename("evil/../../etc/passwd")).toBe("evil....etcpasswd");
    expect(sanitizeFilename("a\\b\\c.txt")).toBe("abc.txt");
  });

  it("strips quote characters (response-splitting defense)", () => {
    expect(sanitizeFilename('x"; evil-header: "value')).toBe("x evil-header value");
    expect(sanitizeFilename("a\r\nb")).toBe("ab");
  });

  it("returns fallback for empty / dot-only names", () => {
    expect(sanitizeFilename("")).toBe("download");
    expect(sanitizeFilename("...")).toBe("download");
    expect(sanitizeFilename(null)).toBe("download");
    expect(sanitizeFilename(undefined)).toBe("download");
    expect(sanitizeFilename("///")).toBe("download");
  });

  it("uses the provided fallback", () => {
    expect(sanitizeFilename("", "site")).toBe("site");
    expect(sanitizeFilename(null, "index.html")).toBe("index.html");
  });

  it("caps length to 200 chars", () => {
    const long = "a".repeat(500);
    expect(sanitizeFilename(long).length).toBe(200);
  });

  it("collapses runs of whitespace", () => {
    expect(sanitizeFilename("my   page   name.html")).toBe("my page name.html");
  });
});

describe("stripActiveContent", () => {
  it("removes <script> blocks with content", () => {
    const out = stripActiveContent('<p>hi</p><script>alert(1)</script><p>bye</p>');
    expect(out).not.toContain("<script");
    expect(out).not.toContain("alert");
    expect(out).toContain("<p>hi</p>");
    expect(out).toContain("<p>bye</p>");
  });

  it("removes unpaired <script src=...> tags", () => {
    const out = stripActiveContent('<script src="evil.js"></script><p>ok</p>');
    expect(out).not.toContain("<script");
    expect(out).toContain("<p>ok</p>");
  });

  it("strips on* event handlers", () => {
    const out = stripActiveContent('<img src="x.jpg" onerror="alert(1)" onload="evil()">');
    expect(out).not.toContain("onerror");
    expect(out).not.toContain("onload");
    expect(out).toContain('src="x.jpg"');
  });

  it("neutralizes javascript: URIs in href/src", () => {
    const out = stripActiveContent('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toContain("javascript:");
    expect(out).toContain('href="#"');
  });

  it("removes <object>, <embed>, <base>", () => {
    const out = stripActiveContent('<object data="evil.swf"></object><embed src="x"><base href="//evil.com">');
    expect(out.toLowerCase()).not.toContain("<object");
    expect(out.toLowerCase()).not.toContain("<embed");
    expect(out.toLowerCase()).not.toContain("<base");
  });

  it("removes meta http-equiv refresh", () => {
    const out = stripActiveContent('<meta http-equiv="refresh" content="0;url=//evil.com">');
    expect(out.toLowerCase()).not.toContain("refresh");
  });

  it("leaves benign content intact", () => {
    const html = '<h1>Title</h1><p>Hello <a href="https://example.com">world</a></p>';
    expect(stripActiveContent(html)).toBe(html);
  });
});
