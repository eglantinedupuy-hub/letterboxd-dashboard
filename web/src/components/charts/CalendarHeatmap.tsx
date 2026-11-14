"use client";

import { useState } from "react";
import { MONTH_SHORT } from "@/lib/format";

type Entry = { date: string; name: string };
type Props = { entries: Entry[]; years: number[] };

// One hue (orange), dark -> bright = 0 -> 3+ films that day
const RAMP = ["rgba(255,255,255,0.06)", "#7a4210", "#c26410", "#ff8000"];

/** GitHub-style calendar: one square per day of the chosen year, coloured by films watched that day. */
export function CalendarHeatmap({ entries, years }: Props) {
  const [year, setYear] = useState(years[years.length - 1]);
  const [hover, setHover] = useState<string | null>(null);

  const byDay = new Map<string, string[]>();
  for (const e of entries) if (e.date.startsWith(String(year))) byDay.set(e.date, [...(byDay.get(e.date) ?? []), e.name]);

  // Build weeks (columns) of 7 days starting on Monday
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const start = new Date(jan1);
  start.setUTCDate(1 - ((jan1.getUTCDay() + 6) % 7));
  const weeks: (string | null)[][] = [];
  for (let d = new Date(start); d.getUTCFullYear() <= year; ) {
    const week: (string | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const iso = d.toISOString().slice(0, 10);
      week.push(d.getUTCFullYear() === year ? iso : null);
      d.setUTCDate(d.getUTCDate() + 1);
    }
    weeks.push(week);
  }

  const hovered = hover ? byDay.get(hover) ?? [] : null;
  const total = [...byDay.values()].reduce((s, v) => s + v.length, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {[...years].reverse().map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => setYear(y)}
            className={`rounded-full px-3 py-1 text-sm transition ${y === year ? "bg-white text-black" : "bg-card-hover text-muted hover:text-foreground"}`}
          >
            {y}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted">{total} films on {byDay.size} days</span>
      </div>
      <p className="mb-2 h-5 truncate text-sm" aria-live="polite">
        {hover ? (
          <>
            <span className="font-semibold">{MONTH_SHORT[+hover.slice(5, 7) - 1]} {+hover.slice(8, 10)}</span>
            <span className="text-muted"> — {hovered!.length ? hovered!.join(", ") : "no films"}</span>
          </>
        ) : (
          <span className="text-muted">Hover or tap a day</span>
        )}
      </p>
      <div className="overflow-x-auto">
        <div className="flex min-w-[680px] gap-[3px]">
          {weeks.map((week, w) => (
            <div key={w} className="flex flex-1 flex-col gap-[3px]">
              {week.map((iso, i) =>
                iso ? (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => setHover(iso)}
                    onFocus={() => setHover(iso)}
                    onClick={() => setHover(iso)}
                    onMouseLeave={() => setHover(null)}
                    aria-label={`${iso}: ${(byDay.get(iso) ?? []).length} films`}
                    className={`aspect-square w-full rounded-[3px] ${hover === iso ? "ring-2 ring-white" : ""}`}
                    style={{ background: RAMP[Math.min((byDay.get(iso) ?? []).length, 3)] }}
                  />
                ) : (
                  <span key={i} className="aspect-square w-full" />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
        <span>0</span>
        {RAMP.map((c) => (
          <span key={c} className="inline-block h-3 w-3 rounded-[3px]" style={{ background: c }} />
        ))}
        <span>3+ films</span>
      </div>
    </div>
  );
}
