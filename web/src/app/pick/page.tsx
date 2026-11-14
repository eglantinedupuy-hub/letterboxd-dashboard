import { connection } from "next/server";
import { WatchlistShuffle, type Candidate } from "@/components/WatchlistShuffle";
import { getFilms, getLists, getTmdb, getWatchlist } from "@/lib/data";
import { daySeed, todayISO } from "@/lib/dates";

export default async function PickPage() {
  await connection(); // "today's pick" changes daily
  const [watchlist, lists, films, tmdb] = await Promise.all([getWatchlist(), getLists(), getFilms(), getTmdb()]);
  const hasTmdb = Object.keys(tmdb).length > 0;

  const candidates: Candidate[] = watchlist.map((w) => ({ ...w, source: "watchlist", tmdb: tmdb[w.url] }));

  // Films in my lists that I haven't watched yet (used by moods linked to a list)
  const watched = new Set(films.map((f) => f.url));
  const listFilms: Record<string, Candidate[]> = {};
  for (const l of lists) {
    listFilms[l.name.toLowerCase()] = l.films
      .filter((f) => !watched.has(f.url))
      .map((f) => ({ name: f.name, year: f.year, url: f.url, added: null, days_waiting: null, source: l.name, tmdb: tmdb[f.url] }));
  }

  // Directors of films I've already watched
  const seenDirectors = [...new Set(films.flatMap((f) => tmdb[f.url]?.directors ?? []))];

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm text-muted">{watchlist.length} films on my watchlist</p>
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
