"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { indieRules, moods, ratingBands, whereToWatchUrl, type Mood } from "@/config";
import type { Tmdb } from "@/lib/data";
import { MultiSelect } from "./MultiSelect";

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

const ERAS: [string, string, (y: number) => boolean][] = [
  ["classic", "Before 1980", (y) => y < 1980],
  ["8090", "80s & 90s", (y) => y >= 1980 && y < 2000],
  ["2000", "2000s", (y) => y >= 2000 && y < 2010],
  ["2010", "2010s", (y) => y >= 2010 && y < 2020],
  ["2020", "2020s", (y) => y >= 2020],
];
const LANGS: [string, string][] = [["fr", "French"], ["en", "English"], ["other", "Other languages"]];
const RATINGS: [string, string][] = [["high", `Highly rated (${ratingBands.high}+)`], ["mid", `Mid rated (${ratingBands.mid}–${ratingBands.high})`]];
const DIRECTORS: [string, string][] = [["seen", "A director I know"], ["new", "A new director"]];
const LENGTHS: [string, string, (m: number) => boolean][] = [
  ["short", "~90 min (≤100)", (m) => m <= 100],
  ["under2h", "Under 2h", (m) => m <= 120],
  ["medium", "100–120 min", (m) => m > 100 && m <= 120],
  ["long", "120+ min", (m) => m > 120],
];

// Every filter is a list of ticked options: empty = anything. Options within a filter are OR, filters are AND.
type Filters = {
  era: string[];
  language: string[];
  genre: string[];
  rating: string[];
  director: string[];
  length: string[];
  indie: boolean; // set by the Indie gem mood
  oldestFirst: boolean;
};
const DEFAULTS: Filters = { era: [], language: [], genre: [], rating: [], director: [], length: [], indie: false, oldestFirst: false };

const poster = (path: string | null | undefined, size = "w342") => (path ? `https://image.tmdb.org/t/p/${size}${path}` : null);

/** Indie = in my Indie list, tagged "independent film", made by an indie company, or a well-rated lesser-known film. */
function isIndie(c: Candidate, indieList: Set<string>): boolean {
  if (indieList.has(c.url)) return true;
  const t = c.tmdb;
  if (!t) return false;
  if (t.keywords?.some((k) => indieRules.keywords.includes(k.toLowerCase()))) return true;
  if (t.companies?.some((co) => indieRules.companies.includes(co))) return true;
  const g = indieRules.hiddenGem;
  return !!(t.tmdb_votes && t.tmdb_votes <= g.maxVotes && (t.tmdb_rating ?? 0) >= g.minRating);
}

type Ctx = { seen: Set<string>; moodList: Set<string>; indieList: Set<string> };

/**
 * Does a film pass the filters? Filters that need TMDB data exclude films without it.
 * Films hand-picked in the active mood's own list skip the genre filter (they already fit the mood).
 */
function passes(c: Candidate, f: Filters, { seen, moodList, indieList }: Ctx): boolean {
  const t = c.tmdb;
  if (f.era.length && !(c.year != null && ERAS.some(([id, , test]) => f.era.includes(id) && test(c.year!)))) return false;
  if (f.language.length) {
    if (!t?.language) return false;
    const lang = ["fr", "en"].includes(t.language) ? t.language : "other";
    if (!f.language.includes(lang)) return false;
  }
  if (f.genre.length && !moodList.has(c.url) && !t?.genres.some((g) => f.genre.includes(g))) return false;
  if (f.rating.length) {
    const r = t?.tmdb_rating;
    if (r == null || !t?.tmdb_votes) return false;
    const band = r >= ratingBands.high ? "high" : r >= ratingBands.mid ? "mid" : "low";
    if (!f.rating.includes(band)) return false;
  }
  if (f.director.length) {
    if (!t?.directors.length) return false;
    const known = t.directors.some((d) => seen.has(d)) ? "seen" : "new";
    if (!f.director.includes(known)) return false;
  }
  if (f.length.length) {
    const m = t?.runtime;
    if (!m || !LENGTHS.some(([id, , test]) => f.length.includes(id) && test(m))) return false;
  }
  if (f.indie && !isIndie(c, indieList)) return false;
  return true;
}

export function WatchlistShuffle({ watchlist, listFilms, seenDirectors, hasTmdb, seed }: Props) {
  const [filters, setFilters] = useState<Filters>(DEFAULTS);
  const [moodId, setMoodId] = useState<string | null>(null);
  const [offset, setOffset] = useState(seed); // new value on every shuffle; starts as "today's pick"
  const [focus, setFocus] = useState(0); // which of the 4 picks is shown in the big card
  const seen = useMemo(() => new Set(seenDirectors), [seenDirectors]);
  const indieList = useMemo(() => new Set((listFilms["indie movies"] ?? []).map((x) => x.url)), [listFilms]);
  const mood = moods.find((m) => m.id === moodId) ?? null;

  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setFocus(0);
  };
  function reset() {
    setFilters(DEFAULTS);
    setMoodId(null);
    setFocus(0);
  }
  // Picking a mood loads its filters (which you can then change); clicking it again resets everything.
  const pickMood = (m: Mood) => {
    if (moodId === m.id) return reset();
    const mf = m.filters ?? {};
    setMoodId(m.id);
    setFocus(0);
    setFilters({
      ...DEFAULTS,
      genre: m.genres ?? [],
      era: mf.era ? [mf.era] : [],
      language: mf.language ? [mf.language] : [],
      rating: mf.rating ? [mf.rating] : [],
      length: mf.length ? [mf.length] : [],
      indie: !!mf.indie,
    });
  };

  const genres = useMemo(() => [...new Set(watchlist.flatMap((c) => c.tmdb?.genres ?? []))].sort(), [watchlist]);

  const pool = useMemo(() => {
    let list = watchlist;
    const moodFilms = mood?.list ? listFilms[mood.list] ?? [] : [];
    const moodList = new Set(moodFilms.map((x) => x.url));
    if (moodFilms.length) list = [...watchlist, ...moodFilms.filter((x) => !watchlist.some((w) => w.url === x.url))];
    list = list.filter((c) => passes(c, filters, { seen, moodList, indieList }));
    if (filters.oldestFirst) {
      list = [...list].sort((a, b) => (a.added ?? "9").localeCompare(b.added ?? "9")).slice(0, Math.max(4, Math.ceil(list.length / 4)));
    }
    return list;
  }, [watchlist, listFilms, filters, mood, seen, indieList]);

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

  const shuffle = () => {
    setOffset(Math.floor(Math.random() * 1_000_000));
    setFocus(0);
  };
  const main = picks[Math.min(focus, picks.length - 1)];
  const backups = picks.filter((p) => p !== main);
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
              onClick={() => pickMood(m)}
              title={m.id === "indie" ? "My Indie list, films tagged independent, indie studios (A24, Neon…) and well-rated lesser-known films" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm transition ${moodId === m.id ? "bg-accent text-black" : "bg-card text-foreground hover:bg-card-hover"}`}
            >
              <span aria-hidden>{m.emoji}</span> {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters: tick as many options as you like in each */}
      <div className="flex flex-wrap items-center gap-2" title={hasTmdb ? undefined : "Needs TMDB data — run pipeline/enrich_tmdb.py"}>
        <MultiSelect label="Era" options={ERAS.map(([id, l]) => [id, l])} selected={filters.era} onChange={(v) => update({ era: v })} />
        <MultiSelect label="Language" options={LANGS} selected={filters.language} onChange={(v) => update({ language: v })} disabled={!hasTmdb} />
        <MultiSelect label="Genre" options={genres.map((g) => [g, g])} selected={filters.genre} onChange={(v) => update({ genre: v })} disabled={!hasTmdb} />
        <MultiSelect label="Rating" options={RATINGS} selected={filters.rating} onChange={(v) => update({ rating: v })} disabled={!hasTmdb} />
        <MultiSelect label="Director" options={DIRECTORS} selected={filters.director} onChange={(v) => update({ director: v })} disabled={!hasTmdb} />
        <MultiSelect label="Length" options={LENGTHS.map(([id, l]) => [id, l])} selected={filters.length} onChange={(v) => update({ length: v })} disabled={!hasTmdb} />
        <label className="flex cursor-pointer items-center gap-2 px-2 text-sm text-muted">
          <input type="checkbox" checked={filters.oldestFirst} onChange={(e) => update({ oldestFirst: e.target.checked })} className="accent-[#ff8000]" />
          Waiting the longest
        </label>
        {active && (
          <button type="button" onClick={reset} className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
            Reset
          </button>
        )}
      </div>
      <p className="text-sm text-muted">
        {pool.length} film{pool.length === 1 ? "" : "s"} match
        {filters.indie && " · indie & hidden gems only"}
      </p>

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
                  {isIndie(main, indieList) && <span className="rounded-full bg-card-hover px-2.5 py-1 text-link">Indie / hidden gem</span>}
                </div>
              )}
              {main.tmdb?.overview && <p className="mt-4 line-clamp-5 max-w-2xl text-sm leading-relaxed text-muted">{main.tmdb.overview}</p>}
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
              <p className="text-sm text-muted">Or maybe… <span className="text-xs">(click one to see its details)</span></p>
              <div className="grid gap-3 sm:grid-cols-3">
                {backups.map((b) => (
                  <button
                    key={b.url}
                    type="button"
                    onClick={() => setFocus(picks.indexOf(b))}
                    className="flex gap-3 rounded-2xl bg-card p-4 text-left transition hover:-translate-y-0.5 hover:bg-card-hover"
                  >
                    {poster(b.tmdb?.poster, "w154") && (
                      <Image src={poster(b.tmdb?.poster, "w154")!} alt="" width={60} height={90} unoptimized className="h-[90px] w-[60px] shrink-0 rounded-md object-cover" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold">{b.name}</p>
                      <p className="text-sm text-muted">
                        {b.year}
                        {b.tmdb?.runtime ? ` · ${b.tmdb.runtime} min` : ""}
                      </p>
                      {b.tmdb?.genres.length ? <p className="mt-1 truncate text-xs text-muted">{b.tmdb.genres.slice(0, 3).join(" · ")}</p> : null}
                    </div>
                  </button>
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
