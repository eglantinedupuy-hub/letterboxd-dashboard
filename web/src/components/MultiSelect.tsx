"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  label: string; // e.g. "Language" (shown when nothing is selected: "Any language")
  options: [value: string, label: string][];
  selected: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
};

/** Pill-shaped dropdown with checkboxes. Nothing ticked = no filter ("Any …"). */
export function MultiSelect({ label, options, selected, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // close when clicking anywhere else or pressing Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  const names = options.filter(([v]) => selected.includes(v)).map(([, l]) => l);
  const summary = names.length === 0 ? `Any ${label.toLowerCase()}` : names.length <= 2 ? names.join(", ") : `${label}: ${names.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
          selected.length ? "bg-white text-black" : "bg-card text-foreground hover:bg-card-hover"
        }`}
      >
        <span className="max-w-[16rem] truncate">{summary}</span>
        <span aria-hidden className="text-xs opacity-60">▾</span>
      </button>
      {open && (
        <div role="listbox" aria-multiselectable className="absolute left-0 z-20 mt-2 max-h-72 min-w-48 overflow-y-auto rounded-xl bg-card-hover p-2 shadow-xl">
          {options.map(([v, l]) => (
            <label key={v} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white/10">
              <input type="checkbox" checked={selected.includes(v)} onChange={() => toggle(v)} className="accent-[#ff8000]" />
              {l}
            </label>
          ))}
          {selected.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs text-muted hover:bg-white/10">
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
