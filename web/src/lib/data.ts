// Server-side helpers that read the JSON summaries from public/data.
// These run at build/request time on the server, never in the browser.
import { readFile } from "node:fs/promises";
import path from "node:path";

export type Favourite = { name: string | null; year: number | null; url: string; rating: number | null };
export type Summary = {
  generated_at: string;
  member_since: string;
  username: string;
  films_watched: number;
  diary_entries: number;
  first_logged: string | null;
  last_logged: string | null;
  rated: number;
  avg_rating: number | null;
  liked: number;
  reviews: number;
  rewatches: number;
  watchlist: number;
  lists: number;
  favourites: Favourite[];
};
export type MonthStat = { month: string; films: number; avg_rating: number | null };
export type YearStat = { year: number; films: number; avg_rating: number | null; rewatches: number };
export type Film = {
  name: string;
  year: number | null;
  url: string;
  rating: number | null;
  liked: boolean;
  watched_on: string[]; // diary dates, oldest first
  rewatches: number;
  has_review: boolean;
  lists: string[];
};
export type WatchlistItem = { name: string; year: number | null; url: string; added: string; days_waiting: number | null };
export type FilmList = { name: string; created: string | null; url: string | null; description: string; films: { position: number; name: string; year: number | null; url: string }[] };

async function readJson<T>(name: string): Promise<T> {
  const file = path.join(process.cwd(), "public", "data", `${name}.json`);
  try {
    return JSON.parse(await readFile(file, "utf-8")) as T;
  } catch {
    throw new Error(`Could not read public/data/${name}.json — run "npm run sync-data" first.`);
  }
}

export const getSummary = () => readJson<Summary>("summary");
export const getMonthly = () => readJson<MonthStat[]>("monthly");
export const getYearly = () => readJson<YearStat[]>("yearly");
export const getWeekday = () => readJson<{ day: string; films: number }[]>("weekday");
export const getRatingDistribution = () => readJson<{ rating: number; films: number }[]>("rating_distribution");
export const getReleaseDecades = () => readJson<{ decade: number; films: number; avg_rating: number | null }[]>("release_decades");
export const getFilms = () => readJson<Film[]>("films");
export const getWatchlist = () => readJson<WatchlistItem[]>("watchlist");
export const getLists = () => readJson<FilmList[]>("lists");
