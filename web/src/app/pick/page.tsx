import { connection } from "next/server";
import { WatchlistShuffle, type Candidate } from "@/components/WatchlistShuffle";
import { getDiary, getFilms, getLists, getTmdb, getWatchlist } from "@/lib/data";
import { daySeed, todayISO } from "@/lib/dates";

export default async function PickPage() {
  await connection(); // "today's pick" changes daily
  const [watchlist, lists, films, tmdb, diary] = await Promise.all([getWatchlist(), getLists(), getFilms(), getTmdb(), getDiary()]);
  const hasTmdb = Object.keys(tmdb).length > 0;

  // Everything I've already seen: films from the export + newer diary entries from the RSS feed.
  // Matched by Letterboxd link, TMDB id, or title + year, so a film I've just logged stops being suggested
  // even though my exported watchlist still has it.
  const key = (name: string, year: number | null) => `${name.trim().toLowerCase()}|${year ?? ""}`;
  const seenUrls = new Set([...films.map((f) => f.url), ...diary.map((d) => d.url)]);
  const seenIds = new Set(diary.map((d) => d.tmdb_id ?? tmdb[d.url]?.tmdb_id).filter(Boolean));
  const seenNames = new Set([...films.map((f) => key(f.name, f.year)), ...diary.map((d) => key(d.name, d.year))]);
  const alreadySeen = (url: string, name: string, year: number | null) =>
    seenUrls.has(url) || seenNames.has(key(name, year)) || (tmdb[url]?.tmdb_id != null && seenIds.has(tmdb[url].tmdb_id));

  const candidates: Candidate[] = watchlist
    .filter((w) => !alreadySeen(w.url, w.name, w.year))
    .map((w) => ({ ...w, source: "watchlist", tmdb: tmdb[w.url] }));
  const listFilms: Record<string, Candidate[]> = {};
  for (const l of lists) {
    listFilms[l.name.toLowerCase()] = l.films
      .filter((f) => !alreadySeen(f.url, f.name, f.year))
      .map((f) => ({ name: f.name, year: f.year, url: f.url, added: null, days_waiting: null, source: l.name, tmdb: tmdb[f.url] }));
  }

  // Directors of films I've already watched
  const seenDirectors = [...new Set(films.flatMap((f) => tmdb[f.url]?.directors ?? []))];

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm text-muted">{candidates.length} unwatched films on my watchlist</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">What should I watch?</h1>
      </section>
      {!hasTmdb && (
        <p className="rounded-2xl bg-card p-4 text-sm text-muted">
          Posters and the language / genre / rating / director / length filters appear once TMDB data is added
          (<code>python pipeline/enrich_tmdb.py</code>).
        </p>
      )}
      <WatchlistShuffle watchlist={candidates} listFilms={listFilms} seenDirectors={seenDirectors} hasTmdb={hasTmdb} seed={daySeed(todayISO())} />
    </div>
  );
}
