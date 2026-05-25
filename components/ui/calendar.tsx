"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NativeSelect } from "@/components/ui/native-select";
import { cls } from "@/lib/cls";

const WD = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function parseIso(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
const toIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const sameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function Calendar({ value, onSelect }: { value: string; onSelect: (iso: string) => void }) {
  const selected = parseIso(value);
  const [view, setView] = useState(() => selected ?? new Date());
  const year = view.getFullYear();
  const month = view.getMonth();
  const today = new Date();
  const startDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const thisYear = today.getFullYear();
  const years = Array.from({ length: thisYear - 1920 + 1 }, (_, i) => thisYear - i);

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className="ow-cal">
      <div className="ow-cal-head">
        <button type="button" className="ow-cal-nav" aria-label="Previous month" onClick={() => setView(new Date(year, month - 1, 1))}>
          <ChevronLeft size={16} />
        </button>
        <NativeSelect value={month} onChange={(e) => setView(new Date(year, Number(e.target.value), 1))} aria-label="Month">
          {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </NativeSelect>
        <NativeSelect value={year} onChange={(e) => setView(new Date(Number(e.target.value), month, 1))} aria-label="Year">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </NativeSelect>
        <button type="button" className="ow-cal-nav" aria-label="Next month" onClick={() => setView(new Date(year, month + 1, 1))}>
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="ow-cal-grid">
        {WD.map((w) => <div key={w} className="ow-cal-wd">{w}</div>)}
        {cells.map((d, i) =>
          d ? (
            <button
              key={i}
              type="button"
              className={cls("ow-cal-day", sameDay(d, selected) && "is-selected", sameDay(d, today) && "is-today")}
              onClick={() => onSelect(toIso(d))}
            >
              {d.getDate()}
            </button>
          ) : (
            <div key={i} />
          ),
        )}
      </div>
      <div className="ow-cal-foot">
        <button type="button" className="btn btn-link btn-sm" onClick={() => { const t = new Date(); setView(t); onSelect(toIso(t)); }}>Today</button>
        {value && <button type="button" className="btn btn-link btn-sm" onClick={() => onSelect("")}>Clear</button>}
      </div>
    </div>
  );
}
