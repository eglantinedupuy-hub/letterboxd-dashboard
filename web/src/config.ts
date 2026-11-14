// Personal settings — change these freely.
export const config = {
  /** Yearly film challenge: how many films I want to log this year. */
  challengeGoal: 52,
  /** Country for "where to watch" links (JustWatch site region). */
  watchRegion: "ca",
  /** My time zone, used for "this week / this month". */
  timeZone: "America/Toronto",
  letterboxdUser: "eglantinee",
  /** My 4 profile favourites (the export only has links for these, so names are typed here). */
  favourites: [
    { name: "The Little Hours", year: 2017 },
    { name: "Moonrise Kingdom", year: 2012 },
    { name: "Les Demoiselles de Rochefort", year: 1967 },
    { name: "LOL (Laughing Out Loud)", year: 2008, url: "https://boxd.it/2lxI" },
  ] as { name: string; year: number; url?: string }[],
};

/** "Pick a film" filter thresholds (TMDB ratings are out of 10). */
export const ratingBands = { high: 7.3, mid: 6.0 };

/**
 * Moods for "Pick a film". A mood is a starting set of filters (you can still change any filter
 * after picking it), plus optionally one of my Letterboxd lists whose films are added to the pool.
 */
export type MoodFilters = {
  era?: string; // "classic" | "8090" | "2000" | "2010" | "2020"
  language?: "fr" | "en" | "other";
  rating?: "high" | "mid";
  length?: "short" | "under2h" | "medium" | "long";
  indie?: boolean;
};
export type Mood = {
  id: string;
  label: string;
  emoji: string;
  genres?: string[]; // the mood's genre mix: a film matches if it has ANY of these TMDB genres
  filters?: MoodFilters;
  list?: string; // name of one of my lists (case-insensitive) whose films join the pool
};

export const moods: Mood[] = [
  { id: "lowbrain", label: "Low-brain night", emoji: "🍿", genres: ["Comedy", "Romance", "Animation", "Family"], filters: { length: "under2h" }, list: "feeling low brain movies" },
  { id: "smart", label: "Smarty pants", emoji: "🧠", genres: ["Documentary", "History", "Drama", "War"], filters: { rating: "high" }, list: "feeling smarty pants movies" },
  { id: "oldie", label: "Oldie", emoji: "🎞️", filters: { era: "classic" }, list: "feeling oldie movies" },
  { id: "french", label: "Soirée française", emoji: "🥐", filters: { language: "fr" } },
  { id: "short", label: "Short & sweet", emoji: "⏱️", filters: { length: "short" } },
  { id: "indie", label: "Indie gem", emoji: "💎", filters: { indie: true }, list: "indie movies" },
  { id: "docs", label: "Learn something", emoji: "📚", genres: ["Documentary"], list: "documentaries" },
];

/**
 * What counts as "indie" (any one is enough): in my Indie list, tagged "independent film" on TMDB,
 * made by one of these companies, or a lesser-known film (few TMDB votes) that's well rated.
 */
export const indieRules = {
  keywords: ["independent film"],
  companies: ["A24", "Neon", "IFC Films", "MUBI", "Magnolia Pictures", "Oscilloscope", "Utopia", "Kino Lorber", "Annapurna Pictures", "Sundance Institute", "Film4 Productions", "BBC Film"],
  hiddenGem: { maxVotes: 1500, minRating: 6.5 },
};

/** Letterboxd search link, for films where the export gives no link. */
export const letterboxdSearchUrl = (name: string) => `https://letterboxd.com/search/${encodeURIComponent(name)}/`;

/** Search link on JustWatch for a film (shows streaming / rent / buy options in my region). */
export const whereToWatchUrl = (name: string, year?: number | null) =>
  `https://www.justwatch.com/${config.watchRegion}/search?q=${encodeURIComponent(year ? `${name} ${year}` : name)}`;
