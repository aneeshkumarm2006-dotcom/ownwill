"use client";

import { useState } from "react";
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
  const label = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <div style={{ position: "relative" }}>
      <button type="button" id={id} className="ow-trigger" onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open}>
        <span className={value ? "ow-trigger-val" : "ow-trigger-ph"}>{label || placeholder}</span>
        <CalendarIcon size={16} className="ow-trigger-icon" />
      </button>
      {open && (
        <>
          <div className="ow-pop-scrim" onClick={() => setOpen(false)} />
          <div className="ow-pop">
            <Calendar
              value={value}
              onSelect={(iso) => {
                onChange(iso);
                if (iso) setOpen(false);
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
