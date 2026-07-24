"use client";

import React, { useState, useRef, useEffect, useContext, createContext } from "react";

interface SectionEditContextValue {
  sectionId: string;
  onEditField: (key: string, value: string) => void;
}

export const SectionEditContext = createContext<SectionEditContextValue | null>(null);

interface InlineTextProps {
  fieldKey: string;
  value: string;
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  multiline?: boolean;
  onInput?: (v: string) => void;
}

export function InlineText({
  fieldKey,
  value,
  as: Tag = "span",
  className,
  style,
  placeholder,
  multiline = false,
  onInput,
}: InlineTextProps) {
  const ctx = useContext(SectionEditContext);
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.textContent = value;
      ref.current.focus();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editing]);

  const enterEdit = (e: React.MouseEvent) => {
    if (!ctx) return;
    e.stopPropagation();
    e.preventDefault();
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    if (!ctx || !ref.current) return;
    const newValue = ref.current.textContent ?? "";
    if (newValue !== value) {
      ctx.onEditField(fieldKey, newValue);
    }
  };

  const cancel = () => {
    setEditing(false);
    if (ref.current) ref.current.textContent = value;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !multiline) {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  if (editing) {
    return (
      <Tag
        ref={ref as React.Ref<any>}
        contentEditable
        suppressContentEditableWarning
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={className}
        style={{
          ...style,
          outline: "2px solid #8b5cf6",
          outlineOffset: "2px",
          cursor: "text",
          borderRadius: "2px",
        }}
        role="textbox"
        aria-label={`Editing ${fieldKey}`}
      />
    );
  }

  const isEmpty = !value;
  const showHint = !!ctx;

  return (
    <Tag
      ref={ref as React.Ref<any>}
      onDoubleClick={enterEdit}
      className={className}
      style={{
        ...style,
        ...(showHint ? { cursor: "text" } : {}),
        ...(isEmpty && placeholder ? { opacity: 0.4, fontStyle: "italic" } : {}),
      }}
      title={showHint ? "Double-click to edit" : undefined}
      data-inline-text={fieldKey}
    >
      {value || placeholder || ""}
    </Tag>
  );
}
