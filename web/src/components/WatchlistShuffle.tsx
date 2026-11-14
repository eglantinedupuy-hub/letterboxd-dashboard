"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { moods, ratingBands, whereToWatchUrl, type Mood } from "@/config";
import type { Tmdb } from "@/lib/data";

export type Candidate = {
  name: string;
  year: number | null;
  url: string;
  added: string | null; // date added to the watchlist (null for list-only films)
  days_waiting: number | null;
  source: string; // "watchlist" or the name of the list it came from
  tmdb?: Tmdb;
};

type Props = {
  watchlist: Candidate[];
  listFilms: Record<string, Candidate[]>; // lowercase list name -> unwatched films in that list
  seenDirectors: string[];
  hasTmdb: boolean;
  seed: number;
};

const ERAS = [
  { id: "all", label: "Any era", test: () => true },
  { id: "classic", label: "Before 1980", test: (y: number) => y < 1980 },
  { id: "8090", label: "80s & 90s", test: (y: number) => y >= 1980 && y < 2000 },
  { id: "2000", label: "2000s", test: (y: number) => y >= 2000 && y < 2010 },
  { id: "2010", label: "2010s", test: (y: number) => y >= 2010 && y < 2020 },
  { id: "2020", label: "2020s", test: (y: number) => y >= 2020 },
];

type Filters = {
  era: string;
  language: "any" | "fr" | "en" | "other";
  genre: string;
  rating: "any" | "high" | "mid";
  director: "any" | "seen" | "new";
  length: "any" | "short" | "medium" | "long";
  oldestFirst: boolean;
};
const DEFAULTS: Filters = { era: "all", language: "any", genre: "any", rating: "any", director: "any", length: "any", oldestFirst: false };

const poster = (path: string | null | undefined, size = "w342") => (path ? `https://image.tmdb.org/t/p/${size}${path}` : null);

/** Does a film pass the dropdown filters? (Filters that need TMDB data exclude films without it.) */
function passes(c: Candidate, f: Filters, seen: Set<string>): boolean {
  const t = c.tmdb;
  if (f.era !== "all" && !(c.year != null && ERAS.find((e) => e.id === f.era)!.test(c.year))) return false;
  if (f.language !== "any") {
    if (!t?.language) return false;
    if (f.language === "other" ? ["fr", "en"].includes(t.language) : t.language !== f.language) return false;
  }
  if (f.genre !== "any" && !t?.genres.includes(f.genre)) return false;
  if (f.rating !== "any") {
    const r = t?.tmdb_rating;
    if (r == null || !t?.tmdb_votes) return false;
    if (f.rating === "high" && r < ratingBands.high) return false;
    if (f.rating === "mid" && (r < ratingBands.mid || r >= ratingBands.high)) return false;
  }
  if (f.director !== "any") {
    if (!t?.directors.length) return false;
    const known = t.directors.some((d) => seen.has(d));
    if (f.director === "seen" ? !known : known) return false;
  }
  if (f.length !== "any") {
    const m = t?.runtime;
    if (!m) return false;
    if (f.length === "short" && m > 100) return false;
    if (f.length === "medium" && (m <= 100 || m > 120)) return false;
    if (f.length === "long" && m <= 120) return false;
  }
  return true;
}

/** Does a film fit a mood? Films hand-picked in the mood's own list always fit. */
function fitsMood(c: Candidate, m: Mood, listUrls: Set<string>): boolean {
  if (listUrls.has(c.url)) return true;
  const hasRules = m.era || m.genres || m.maxRuntime || m.minRating || m.language;
  if (!hasRules) return false; // list-only mood: only the list's films
  const t = c.tmdb;
  if (m.era && !(c.year != null && ERAS.find((e) => e.id === m.era)!.test(c.year))) return false;
  if (m.genres && !t?.genres.some((g) => m.genres!.includes(g))) return false;
  if (m.maxRuntime && !(t?.runtime && t.runtime <= m.maxRuntime)) return false;
  if (m.minRating && !(t?.tmdb_rating && t.tmdb_rating >= m.minRating)) return false;
  if (m.language && !(t?.language && (m.language === "other" ? !["fr", "en"].includes(t.language) : t.language === m.language))) return false;
  return true;
}

export function WatchlistShuffle({ watchlist, listFilms, seenDirectors, hasTmdb, seed }: Props) {
  const [filters, setFilters] = useState<Filters>(DEFAULTS);
  const [moodId, setMoodId] = useState<string | null>(null);
  const [offset, setOffset] = useState(seed); // new value on every shuffle; starts as "today's pick"
  const seen = useMemo(() => new Set(seenDirectors), [seenDirectors]);
  const mood = moods.find((m) => m.id === moodId) ?? null;
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters((f) => ({ ...f, [k]: v }));

  const genres = useMemo(
    () => [...new Set(watchlist.flatMap((c) => c.tmdb?.genres ?? []))].sort(),
    [watchlist],
  );

  const pool = useMemo(() => {
    let list = watchlist;
    const moodList = mood?.list ? listFilms[mood.list] ?? [] : [];
    const listUrls = new Set(moodList.map((x) => x.url));
    if (moodList.length) list = [...watchlist, ...moodList.filter((x) => !watchlist.some((w) => w.url === x.url))];
    list = list.filter((c) => passes(c, filters, seen) && (!mood || fitsMood(c, mood, listUrls)));
    if (filters.oldestFirst) {
      list = [...list].sort((a, b) => (a.added ?? "9").localeCompare(b.added ?? "9")).slice(0, Math.max(4, Math.ceil(list.length / 4)));
    }
    return list;
  }, [watchlist, listFilms, filters, mood, seen]);

  // 4 distinct picks derived from the offset (stable between renders, new on shuffle)
  const picks = useMemo(() => {
    const out: Candidate[] = [];
    let x = Math.abs(offset) || 1;
    for (let guard = 0; out.length < Math.min(4, pool.length) && guard < 1000; guard++) {
      x = (x * 9301 + 49297) % 233280;
      const item = pool[x % pool.length];
      if (!out.includes(item)) out.push(item);
    }
    return out;
  }, [pool, offset]);

  const shuffle = () => setOffset(Math.floor(Math.random() * 1_000_000));
  const reset = () => { setFilters(DEFAULTS); setMoodId(null); };
  const [main, ...backups] = picks;
  const active = moodId !== null || JSON.stringify(filters) !== JSON.stringify(DEFAULTS);

  // Letterboxd can import a CSV into a new list (letterboxd.com/import)
  const downloadCsv = () => {
    const rows = [["Title", "Year", "LetterboxdURI"], ...picks.map((p) => [p.name, String(p.year ?? ""), p.url])];
    const csv = rows.map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "my-shortlist.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const needsTmdb = hasTmdb ? "" : "Needs TMDB data — run pipeline/enrich_tmdb.py";

  return (
    <div className="space-y-6">
      {/* Moods */}
      <div className="space-y-2">
        <p className="text-sm text-muted">What’s the mood?</p>
        <div className="flex flex-wrap gap-2">
          {moods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMoodId(moodId === m.id ? null : m.id)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${moodId === m.id ? "bg-accent text-black" : "bg-card text-foreground hover:bg-card-hover"}`}
            >
              <span aria-hidden>{m.emoji}</span> {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters: one row of dropdowns */}
      <div className="flex flex-wrap items-center gap-2" title={needsTmdb}>
        <Select label="Era" value={filters.era} onChange={(v) => set("era", v)} options={ERAS.map((e) => [e.id, e.label])} />
        <Select label="Language" value={filters.language} disabled={!hasTmdb} onChange={(v) => set("language", v as Filters["language"])}
          options={[["any", "Any language"], ["fr", "French"], ["en", "English"], ["other", "Other languages"]]} />
        <Select label="Genre" value={filters.genre} disabled={!hasTmdb} onChange={(v) => set("genre", v)}
          options={[["any", "Any genre"], ...genres.map((g) => [g, g] as [string, string])]} />
        <Select label="Rating" value={filters.rating} disabled={!hasTmdb} onChange={(v) => set("rating", v as Filters["rating"])}
          options={[["any", "Any rating"], ["high", `Highly rated (${ratingBands.high}+)`], ["mid", `Mid rated (${ratingBands.mid}–${ratingBands.high})`]]} />
        <Select label="Director" value={filters.director} disabled={!hasTmdb} onChange={(v) => set("director", v as Filters["director"])}
          options={[["any", "Any director"], ["seen", "A director I know"], ["new", "A new director"]]} />
        <Select label="Length" value={filters.length} disabled={!hasTmdb} onChange={(v) => set("length", v as Filters["length"])}
          options={[["any", "Any length"], ["short", "~90 min (≤100)"], ["medium", "100–120 min"], ["long", "120+ min"]]} />
        <label className="flex cursor-pointer items-center gap-2 px-2 text-sm text-muted">
          <input type="checkbox" checked={filters.oldestFirst} onChange={(e) => set("oldestFirst", e.target.checked)} className="accent-[#ff8000]" />
          Waiting the longest
        </label>
        {active && (
          <button type="button" onClick={reset} className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
            Reset
          </button>
        )}
      </div>
      <p className="text-sm text-muted">{pool.length} film{pool.length === 1 ? "" : "s"} match</p>

      {!main ? (
        <p className="rounded-2xl bg-card p-6 text-muted">Nothing matches — try loosening a filter.</p>
      ) : (
        <>
          <div key={main.url} className="flex animate-[fade_400ms_ease-out] flex-col gap-6 rounded-2xl bg-card p-6 sm:flex-row sm:p-8">
            {poster(main.tmdb?.poster) && (
              <Image
                src={poster(main.tmdb?.poster)!}
                alt={`Poster for ${main.name}`}
                width={220}
                height={330}
                unoptimized
                className="h-auto w-40 shrink-0 self-start rounded-xl shadow-lg sm:w-52"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted">{mood ? `${mood.emoji} ${mood.label} pick` : "Tonight’s pick"}</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-5xl">{main.name}</h2>
              <p className="mt-1 text-lg text-muted">
                {main.year}
                {main.tmdb?.runtime ? ` · ${main.tmdb.runtime} min` : ""}
                {main.tmdb?.directors.length ? ` · ${main.tmdb.directors.join(", ")}` : ""}
              </p>
              {main.tmdb && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {main.tmdb.genres.map((g) => (
                    <span key={g} className="rounded-full bg-card-hover px-2.5 py-1 text-muted">{g}</span>
                  ))}
                  {main.tmdb.tmdb_rating ? <span className="rounded-full bg-card-hover px-2.5 py-1">TMDB {main.tmdb.tmdb_rating.toFixed(1)}</span> : null}
                  {main.tmdb.directors.some((d) => seen.has(d)) && <span className="rounded-full bg-card-hover px-2.5 py-1 text-star">Director I’ve seen</span>}
                </div>
              )}
              {main.tmdb?.overview && <p className="mt-4 line-clamp-4 max-w-2xl text-sm leading-relaxed text-muted">{main.tmdb.overview}</p>}
              <p className="mt-3 text-sm text-muted">
                {main.source === "watchlist"
                  ? `On my watchlist since ${main.added}${main.days_waiting != null ? ` · waiting ${main.days_waiting} days` : ""}`
                  : `From my list “${main.source}”`}
              </p>
              {main.tmdb?.watch && (main.tmdb.watch.stream.length > 0 || main.tmdb.watch.rent.length > 0) && (
                <p className="mt-3 text-sm">
                  {main.tmdb.watch.stream.length > 0 && <>Streaming on <span className="font-semibold">{main.tmdb.watch.stream.join(", ")}</span>. </>}
                  {main.tmdb.watch.stream.length === 0 && main.tmdb.watch.rent.length > 0 && <>Rent on {main.tmdb.watch.rent.slice(0, 3).join(", ")}. </>}
                  <span className="text-xs text-muted">(data: JustWatch)</span>
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-2">
                <button type="button" onClick={shuffle} className="rounded-full bg-accent px-5 py-2 font-semibold text-black transition hover:brightness-110">
                  Shuffle ↻
                </button>
                <a href={main.tmdb?.watch.link ?? whereToWatchUrl(main.name, main.year)} target="_blank" rel="noopener noreferrer" className="rounded-full bg-card-hover px-5 py-2 transition hover:bg-white hover:text-black">
                  Where to watch ↗
                </a>
                <a href={main.url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-card-hover px-5 py-2 transition hover:bg-white hover:text-black">
                  Letterboxd ↗
                </a>
              </div>
            </div>
          </div>

          {backups.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted">Or maybe…</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {backups.map((b) => (
                  <div key={b.url} className="flex gap-3 rounded-2xl bg-card p-4">
                    {poster(b.tmdb?.poster, "w154") && (
                      <Image src={poster(b.tmdb?.poster, "w154")!} alt="" width={60} height={90} unoptimized className="h-[90px] w-[60px] shrink-0 rounded-md object-cover" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold">{b.name}</p>
                      <p className="text-sm text-muted">
                        {b.year}
                        {b.tmdb?.runtime ? ` · ${b.tmdb.runtime} min` : ""}
                      </p>
                      <div className="mt-2 flex gap-3 text-sm">
                        <a href={b.tmdb?.watch.link ?? whereToWatchUrl(b.name, b.year)} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">Where to watch</a>
                        <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-foreground">Letterboxd</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={downloadCsv} className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
                Save these {picks.length} as a Letterboxd list (CSV) ↓
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Select({ label, value, options, onChange, disabled }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-full px-3 py-1.5 text-sm outline-none transition ${value !== options[0][0] ? "bg-white text-black" : "bg-card text-foreground hover:bg-card-hover"} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {options.map(([v, l]) => (
        <option key={v} value={v} className="bg-card text-foreground">{l}</option>
      ))}
    </select>
  );
}
