// Typed access to the JSON summaries in src/data (copied there by `npm run sync-data`).
// They are imported directly, so they're bundled into the build: works locally and on Vercel.
import summaryJson from "@/data/summary.json";
import monthlyJson from "@/data/monthly.json";
import yearlyJson from "@/data/yearly.json";
import weekdayJson from "@/data/weekday.json";
import ratingsJson from "@/data/rating_distribution.json";
import decadesJson from "@/data/release_decades.json";
import filmsJson from "@/data/films.json";
import watchlistJson from "@/data/watchlist.json";
import listsJson from "@/data/lists.json";
import diaryJson from "@/data/diary.json";
import reviewsJson from "@/data/reviews.json";
import tmdbJson from "@/data/tmdb.json";
import favouritesJson from "@/data/favourites.json";

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

export type DiaryEntry = { date: string; name: string; year: number | null; url: string; rating: number | null; rewatch: boolean; liked: boolean; tmdb_id?: number | null };
export type Review = { name: string; year: number | null; url: string; rating: number | null; date: string; text: string };

// `as unknown as T`: the JSON's inferred type is replaced by our hand-written types above.
const load = <T,>(json: unknown) => async () => json as T;

export const getSummary = load<Summary>(summaryJson);
export const getMonthly = load<MonthStat[]>(monthlyJson);
export const getYearly = load<YearStat[]>(yearlyJson);
export const getWeekday = load<{ day: string; films: number }[]>(weekdayJson);
export const getRatingDistribution = load<{ rating: number; films: number }[]>(ratingsJson);
export const getReleaseDecades = load<{ decade: number; films: number; avg_rating: number | null }[]>(decadesJson);
export const getFilms = load<Film[]>(filmsJson);
export const getWatchlist = load<WatchlistItem[]>(watchlistJson);
export const getLists = load<FilmList[]>(listsJson);
export const getDiary = load<DiaryEntry[]>(diaryJson);
/** Empty list unless the pipeline ran with --include-reviews. */
export const getReviews = load<Review[]>(reviewsJson);

export type Tmdb = {
  tmdb_id: number;
  poster: string | null;
  genres: string[];
  runtime: number | null;
  language: string | null;
  countries: string[];
  directors: string[];
  tmdb_rating: number | null;
  tmdb_votes: number | null;
  overview: string;
  companies?: string[];
  keywords?: string[];
  watch: { link: string | null; stream: string[]; rent: string[]; buy: string[] };
};
/** TMDB details keyed by Letterboxd film URL (or "favourite:<name>"). Empty until pipeline/enrich_tmdb.py has run. */
export const getTmdb = load<Record<string, Tmdb>>(tmdbJson);

export type FavouriteFilm = { name: string; year: number | null; url: string | null };
/** My 4 profile favourites (edit data/favourites.json). */
export const getFavourites = load<FavouriteFilm[]>(favouritesJson);
