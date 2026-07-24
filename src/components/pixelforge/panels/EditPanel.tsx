"use client";

import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import { useEffect, useState, useRef } from "react";
import { Pencil } from "lucide-react";
import type { CSSProperties } from "react";

interface EditPanelProps {
  onToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function EditPanel({ onToast }: EditPanelProps) {
  const { selectedSelector, setHTML, pushHistory, currentHTML } = usePFStore();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    content: true, typography: false, colors: false, spacing: false, size: false, layout: false, position: false, border: false,
  });
  // `element` is a live DOM reference (not React state) — stored in a ref so we
  // never mutate a state-held value (satisfies react-hooks/immutability).
  const elementRef = useRef<HTMLElement | null>(null);
  // `hasElement` is derived from the store selector during render (no setState-in-effect).
  const hasElement = !!selectedSelector;
  const [tagName, setTagName] = useState("");
  const [textContent, setTextContent] = useState("");
  const [attrs, setAttrs] = useState<Record<string, string>>({});
  const [computedStyle, setComputedStyle] = useState<Partial<CSSStyleDeclaration>>({});

  // Refresh element state when selector changes. This syncs external DOM state
  // (the selected iframe element's attributes/styles) into React state for the
  // editable form below. This is the canonical "subscribe to external system"
  // pattern from https://react.dev/learn/you-might-not-need-an-effect — the
  // rule's heuristic flags it, but useSyncExternalStore would be overkill for
  // a selection that changes only on user click.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!selectedSelector) {
      elementRef.current = null;
      return;
    }
    const iframe = document.querySelector("iframe[title='preview']") as HTMLIFrameElement | null;
    const doc = iframe?.contentDocument;
    if (!doc) return;
    try {
      const el = doc.querySelector(selectedSelector) as HTMLElement | null;
      if (!el) {
        elementRef.current = null;
        return;
      }
      elementRef.current = el;
      setTagName(el.tagName.toLowerCase());
      setTextContent(el.textContent || "");
      const a: Record<string, string> = {};
      for (const attr of Array.from(el.attributes)) a[attr.name] = attr.value;
      setAttrs(a);
      const cs = doc.defaultView?.getComputedStyle(el);
      if (cs) {
        setComputedStyle({
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          fontFamily: cs.fontFamily,
          textAlign: cs.textAlign,
          lineHeight: cs.lineHeight,
          padding: cs.padding,
          margin: cs.margin,
          width: cs.width,
          height: cs.height,
          display: cs.display,
          position: cs.position,
          border: cs.border,
          borderRadius: cs.borderRadius,
        });
      }
    } catch {
      elementRef.current = null;
    }
  }, [selectedSelector, currentHTML]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const syncHTML = () => {
    if (!elementRef.current) return;
    const iframe = document.querySelector("iframe[title='preview']") as HTMLIFrameElement | null;
    const doc = iframe?.contentDocument;
    if (!doc) return;
    pushHistory();
    setHTML("<!DOCTYPE html>\n" + doc.documentElement.outerHTML);
  };

  const updateAttr = (name: string, value: string) => {
    const el = elementRef.current;
    if (!el) return;
    if (value) el.setAttribute(name, value);
    else el.removeAttribute(name);
    setAttrs((a) => ({ ...a, [name]: value }));
    syncHTML();
  };

  const updateText = (v: string) => {
    const el = elementRef.current;
    if (!el) return;
    // Mutate the live DOM node (not a state-held value) before serializing.
    el.textContent = v;
    setTextContent(v);
    syncHTML();
  };

  const updateStyle = (prop: string, value: string) => {
    const el = elementRef.current;
    if (!el) return;
    // Mutate the live DOM node's inline style before serializing.
    (el.style as unknown as Record<string, string>)[prop] = value;
    setComputedStyle((s) => ({ ...s, [prop]: value }));
    syncHTML();
  };

  const toggleGroup = (g: string) => setOpenGroups((s) => ({ ...s, [g]: !s[g] }));

  if (!hasElement) {
    return (
      <div className="text-center text-[var(--pf-text-dim)] py-9 px-3 text-[12.5px] leading-relaxed">
        <Pencil className="w-7 h-7 mx-auto mb-1.5 opacity-25" />
        Select an element in the preview to edit its properties
      </div>
    );
  }

  return (
    <div>
      {/* Element info */}
      <div className="px-3.5 py-2.5 border-b border-[var(--pf-border)] flex items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-[rgba(92,141,239,0.1)] text-[var(--pf-accent)]">
          &lt;{tagName}&gt;
        </span>
        {attrs.id && <span className="text-[10px] text-[var(--pf-text-dim)]">#{attrs.id}</span>}
        {attrs.class && <span className="text-[10px] text-[var(--pf-text-dim)] truncate max-w-[120px]">.{attrs.class.split(" ")[0]}</span>}
      </div>

      {/* CONTENT GROUP */}
      <EditGroup id="content" label="Content" open={openGroups.content} onToggle={toggleGroup}>
        <Field label="Tag">
          <select
            className="pf-edit-input"
            value={tagName}
            onChange={(e) => {
              const el = elementRef.current;
              if (!el) return;
              const newTag = e.target.value;
              const newEl = el.ownerDocument!.createElement(newTag);
              while (el.firstChild) newEl.appendChild(el.firstChild);
              for (const attr of Array.from(el.attributes)) newEl.setAttribute(attr.name, attr.value);
              el.parentNode?.replaceChild(newEl, el);
              elementRef.current = newEl;
              setTagName(newTag);
              syncHTML();
              onToast(`Changed <${tagName}> → <${newTag}>`, "success");
            }}
          >
            {["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "div", "a", "button", "img", "section", "header", "footer", "nav", "ul", "li", "blockquote"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        {tagName !== "img" && (
          <Field label="Text content">
            <textarea
              className="pf-edit-input"
              rows={3}
              value={textContent}
              onChange={(e) => updateText(e.target.value)}
              placeholder="Element text…"
            />
          </Field>
        )}
        {tagName === "img" && (
          <>
            <Field label="src">
              <input className="pf-edit-input" value={attrs.src || ""} onChange={(e) => updateAttr("src", e.target.value)} placeholder="https://…" />
            </Field>
            <Field label="alt">
              <input className="pf-edit-input" value={attrs.alt || ""} onChange={(e) => updateAttr("alt", e.target.value)} placeholder="Descriptive alt text" />
            </Field>
            <div className="grid grid-cols-2 gap-1.5">
              <Field label="width">
                <input className="pf-edit-input" value={attrs.width || ""} onChange={(e) => updateAttr("width", e.target.value)} placeholder="auto" />
              </Field>
              <Field label="height">
                <input className="pf-edit-input" value={attrs.height || ""} onChange={(e) => updateAttr("height", e.target.value)} placeholder="auto" />
              </Field>
            </div>
          </>
        )}
        {(tagName === "a" || tagName === "button") && (
          <Field label="href / action">
            <input className="pf-edit-input" value={attrs.href || ""} onChange={(e) => updateAttr("href", e.target.value)} placeholder="#" />
          </Field>
        )}
      </EditGroup>

      {/* TYPOGRAPHY GROUP */}
      <EditGroup id="typography" label="Typography" open={openGroups.typography} onToggle={toggleGroup}>
        <div className="grid grid-cols-2 gap-1.5">
          <Field label="Font size">
            <input className="pf-edit-input" value={(computedStyle.fontSize as string) || ""} onChange={(e) => updateStyle("fontSize", e.target.value)} placeholder="16px" />
          </Field>
          <Field label="Weight">
            <select className="pf-edit-input" value={(computedStyle.fontWeight as string) || ""} onChange={(e) => updateStyle("fontWeight", e.target.value)}>
              {["300", "400", "500", "600", "700", "800", "900"].map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Font family">
          <input className="pf-edit-input" value={(computedStyle.fontFamily as string) || ""} onChange={(e) => updateStyle("fontFamily", e.target.value)} placeholder="Inter, sans-serif" />
        </Field>
        <Field label="Line height">
          <input className="pf-edit-input" value={(computedStyle.lineHeight as string) || ""} onChange={(e) => updateStyle("lineHeight", e.target.value)} placeholder="1.5" />
        </Field>
        <Field label="Text align">
          <div className="flex gap-1">
            {["left", "center", "right", "justify"].map((a) => (
              <button
                key={a}
                onClick={() => updateStyle("textAlign", a)}
                className={`flex-1 px-2 py-1 rounded text-[11px] font-semibold border transition-colors ${
                  computedStyle.textAlign === a
                    ? "bg-[rgba(92,141,239,0.15)] text-[var(--pf-accent)] border-[rgba(92,141,239,0.3)]"
                    : "bg-white/[0.04] text-[var(--pf-text-dim)] border-transparent hover:bg-white/10"
                }`}
              >
                {a[0].toUpperCase()}
              </button>
            ))}
          </div>
        </Field>
      </EditGroup>

      {/* COLORS GROUP */}
      <EditGroup id="colors" label="Colors" open={openGroups.colors} onToggle={toggleGroup}>
        <Field label="Text color">
          <ColorInput value={(computedStyle.color as string) || "#000000"} onChange={(v) => updateStyle("color", v)} />
        </Field>
        <Field label="Background">
          <ColorInput value={(computedStyle.backgroundColor as string) || "#ffffff"} onChange={(v) => updateStyle("backgroundColor", v)} />
        </Field>
      </EditGroup>

      {/* SPACING GROUP */}
      <EditGroup id="spacing" label="Spacing" open={openGroups.spacing} onToggle={toggleGroup}>
        <Field label="Padding">
          <input className="pf-edit-input" value={(computedStyle.padding as string) || ""} onChange={(e) => updateStyle("padding", e.target.value)} placeholder="0" />
        </Field>
        <Field label="Margin">
          <input className="pf-edit-input" value={(computedStyle.margin as string) || ""} onChange={(e) => updateStyle("margin", e.target.value)} placeholder="0" />
        </Field>
      </EditGroup>

      {/* SIZE GROUP */}
      <EditGroup id="size" label="Size" open={openGroups.size} onToggle={toggleGroup}>
        <div className="grid grid-cols-2 gap-1.5">
          <Field label="Width">
            <input className="pf-edit-input" value={(computedStyle.width as string) || ""} onChange={(e) => updateStyle("width", e.target.value)} placeholder="auto" />
          </Field>
          <Field label="Height">
            <input className="pf-edit-input" value={(computedStyle.height as string) || ""} onChange={(e) => updateStyle("height", e.target.value)} placeholder="auto" />
          </Field>
        </div>
      </EditGroup>

      {/* LAYOUT GROUP */}
      <EditGroup id="layout" label="Layout" open={openGroups.layout} onToggle={toggleGroup}>
        <Field label="Display">
          <select className="pf-edit-input" value={(computedStyle.display as string) || ""} onChange={(e) => updateStyle("display", e.target.value)}>
            {["block", "inline", "inline-block", "flex", "grid", "none"].map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
      </EditGroup>

      {/* BORDER GROUP */}
      <EditGroup id="border" label="Border & radius" open={openGroups.border} onToggle={toggleGroup}>
        <Field label="Border">
          <input className="pf-edit-input" value={(computedStyle.border as string) || ""} onChange={(e) => updateStyle("border", e.target.value)} placeholder="1px solid #ccc" />
        </Field>
        <Field label="Border radius">
          <input className="pf-edit-input" value={(computedStyle.borderRadius as string) || ""} onChange={(e) => updateStyle("borderRadius", e.target.value)} placeholder="0" />
        </Field>
      </EditGroup>

      {/* POSITION GROUP */}
      <EditGroup id="position" label="Position" open={openGroups.position} onToggle={toggleGroup}>
        <Field label="Position">
          <select className="pf-edit-input" value={(computedStyle.position as string) || ""} onChange={(e) => updateStyle("position", e.target.value)}>
            {["static", "relative", "absolute", "fixed", "sticky"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
      </EditGroup>
    </div>
  );
}

function EditGroup({ id, label, open, onToggle, children }: { id: string; label: string; open: boolean; onToggle: (g: string) => void; children: React.ReactNode }) {
  return (
    <div className={`pf-edit-group ${open ? "open" : ""}`}>
      <button onClick={() => onToggle(id)} className="pf-edit-group-header w-full">
        <span className="gtitle">{label}</span>
        <span className="garrow">▼</span>
      </button>
      <div className="pf-edit-group-body space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="pf-edit-label">{label}</label>
      {children}
    </div>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Try to extract a hex from the value
  const hex = useMemo(() => rgbToHex(value), [value]);
  return (
    <div className="flex gap-1 items-center">
      <input
        type="color"
        value={hex}
        onChange={(e) => onChange(e.target.value)}
        className="w-7 h-7 rounded border border-[var(--pf-border)] bg-white/[0.04] cursor-pointer p-px shrink-0"
      />
      <input
        className="pf-edit-input flex-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
      />
    </div>
  );
}

function rgbToHex(rgb: string): string {
  const m = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return "#000000";
  return "#" + [m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, "0")).join("");
}

import { useMemo } from "react";
