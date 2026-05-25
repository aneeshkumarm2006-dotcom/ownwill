"use client";

import { useState } from "react";
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
  const selected = options.find((o) => o.value === value);

  return (
    <div style={{ position: "relative" }}>
      <button type="button" id={id} className="ow-trigger" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}>
        <span className={selected ? "ow-trigger-val" : "ow-trigger-ph"}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={16} className="ow-trigger-icon" />
      </button>
      {open && (
        <>
          <div className="ow-pop-scrim" onClick={() => setOpen(false)} />
          <div className="ow-pop" role="listbox" style={{ maxHeight: 280, overflowY: "auto", padding: 6 }}>
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                className="ow-opt"
                onClick={() => { onChange(o.value); setOpen(false); }}
              >
                <span>{o.label}</span>
                {o.value === value && <Check size={16} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
