"use client";

import { useState } from "react";
import { FilmCard } from "./FilmCard";
import type { DiaryEntry } from "@/lib/data";

type Group = { year: number; films: (DiaryEntry & { poster: string | null })[] };

/** "This month in past years": one tab per year, newest first. */
export function Throwback({ groups }: { groups: Group[] }) {
  const [year, setYear] = useState(groups[0]?.year);
  const current = groups.find((g) => g.year === year) ?? groups[0];
  if (!current) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="tablist">
        {groups.map((g) => (
          <button
            key={g.year}
            type="button"
            role="tab"
            aria-selected={g.year === current.year}
            onClick={() => setYear(g.year)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              g.year === current.year ? "bg-white text-black" : "bg-card text-muted hover:bg-card-hover hover:text-foreground"
            }`}
          >
            {g.year} <span className="opacity-60">· {g.films.length}</span>
          </button>
        ))}
      </div>
      <div key={current.year} className="grid animate-[fade_300ms_ease-out] grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {current.films.map((d) => (
          <FilmCard key={`${d.date}-${d.url}`} {...d} />
        ))}
      </div>
    </div>
  );
}
