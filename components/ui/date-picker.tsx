"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

export function DatePicker({
  value,
  onChange,
  id,
  placeholder = "Select a date",
}: {
  value: string;
  onChange: (iso: string) => void;
  id?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const popH = popRef.current?.offsetHeight ?? 340;
      const popW = popRef.current?.offsetWidth ?? Math.max(r.width, 280);
      const gap = 6;
      const spaceBelow = vh - r.bottom;
      const spaceAbove = r.top;
      const openUp = spaceBelow < popH + gap && spaceAbove > spaceBelow;
      const top = openUp
        ? Math.max(8, r.top - popH - gap)
        : Math.min(vh - popH - 8, r.bottom + gap);
      const left = Math.min(Math.max(8, r.left), vw - popW - 8);
      setPos({ top, left, width: r.width });
    };
    requestAnimationFrame(update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const label = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className="ow-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={value ? "ow-trigger-val" : "ow-trigger-ph"}>{label || placeholder}</span>
        <CalendarIcon size={16} className="ow-trigger-icon" />
      </button>
      {open && mounted && pos
        ? createPortal(
            <>
              <div className="ow-pop-scrim" onClick={() => setOpen(false)} />
              <div
                ref={popRef}
                className="ow-pop"
                style={{ position: "fixed", top: pos.top, left: pos.left, minWidth: pos.width }}
              >
                <Calendar
                  value={value}
                  onSelect={(iso) => {
                    onChange(iso);
                    if (iso) setOpen(false);
                  }}
                />
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
