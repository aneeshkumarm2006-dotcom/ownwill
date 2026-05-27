"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export interface Option {
  value: string;
  label: string;
}

export function Dropdown({
  value,
  onChange,
  options,
  id,
  placeholder = "Select…",
}: {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  id?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; maxH: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const [activeIndex, setActiveIndex] = useState<number>(selectedIndex >= 0 ? selectedIndex : 0);

  useEffect(() => setMounted(true), []);

  // When opening, start active item at the current selection (or first).
  useEffect(() => {
    if (!open) return;
    const start = selectedIndex >= 0 ? selectedIndex : 0;
    setActiveIndex(start);
    requestAnimationFrame(() => {
      optionRefs.current[start]?.focus();
    });
  }, [open, selectedIndex]);

  function moveActive(delta: number) {
    if (options.length === 0) return;
    setActiveIndex((i) => {
      const next = (i + delta + options.length) % options.length;
      requestAnimationFrame(() => optionRefs.current[next]?.focus());
      return next;
    });
  }

  function onTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onListKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveActive(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveActive(-1);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        requestAnimationFrame(() => optionRefs.current[0]?.focus());
        break;
      case "End": {
        e.preventDefault();
        const last = options.length - 1;
        setActiveIndex(last);
        requestAnimationFrame(() => optionRefs.current[last]?.focus());
        break;
      }
      case "Enter":
      case " ": {
        e.preventDefault();
        const o = options[activeIndex];
        if (o) {
          onChange(o.value);
          setOpen(false);
          requestAnimationFrame(() => triggerRef.current?.focus());
        }
        break;
      }
      case "Escape":
      case "Tab":
        e.preventDefault();
        setOpen(false);
        requestAnimationFrame(() => triggerRef.current?.focus());
        break;
    }
  }

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const desired = popRef.current?.scrollHeight ?? 280;
      const popW = popRef.current?.offsetWidth ?? Math.max(r.width, 200);
      const gap = 6;
      const spaceBelow = vh - r.bottom - 8;
      const spaceAbove = r.top - 8;
      const openUp = spaceBelow < Math.min(desired, 280) + gap && spaceAbove > spaceBelow;
      const maxH = Math.min(280, Math.max(120, openUp ? spaceAbove - gap : spaceBelow - gap));
      const top = openUp ? Math.max(8, r.top - maxH - gap) : r.bottom + gap;
      const left = Math.min(Math.max(8, r.left), vw - popW - 8);
      setPos({ top, left, width: r.width, maxH });
    };
    update();
    requestAnimationFrame(update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className="ow-trigger"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? "ow-trigger-val" : "ow-trigger-ph"}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={16} className="ow-trigger-icon" />
      </button>
      {open && mounted && pos
        ? createPortal(
            <>
              <div className="ow-pop-scrim" onClick={() => setOpen(false)} />
              <div
                ref={popRef}
                className="ow-pop"
                role="listbox"
                tabIndex={-1}
                onKeyDown={onListKeyDown}
                style={{
                  position: "fixed",
                  top: pos.top,
                  left: pos.left,
                  minWidth: pos.width,
                  maxHeight: pos.maxH,
                  overflowY: "auto",
                  padding: 6,
                }}
              >
                {options.map((o, i) => (
                  <button
                    key={o.value}
                    ref={(el) => {
                      optionRefs.current[i] = el;
                    }}
                    type="button"
                    role="option"
                    aria-selected={o.value === value}
                    tabIndex={i === activeIndex ? 0 : -1}
                    className="ow-opt"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      requestAnimationFrame(() => triggerRef.current?.focus());
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    <span>{o.label}</span>
                    {o.value === value && <Check size={16} />}
                  </button>
                ))}
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
