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
 * Moods for "Pick a film". Each mood is a preset of filters, and can also pull in films
 * from one of my Letterboxd lists (matched by list name, case-insensitive).
 */
export type Mood = {
  id: string;
  label: string;
  emoji: string;
  genres?: string[]; // film matches if it has ANY of these TMDB genres
  maxRuntime?: number;
  minRating?: number;
  language?: "fr" | "en" | "other";
  era?: string; // id from ERAS in WatchlistShuffle
  list?: string; // name of one of my lists to include
};

export const moods: Mood[] = [
  { id: "lowbrain", label: "Low-brain night", emoji: "🍿", genres: ["Comedy", "Romance", "Animation", "Family"], maxRuntime: 115, list: "feeling low brain movies" },
  { id: "smart", label: "Smarty pants", emoji: "🧠", genres: ["Documentary", "History", "Drama", "War"], minRating: 7.0, list: "feeling smarty pants movies" },
  { id: "oldie", label: "Oldie", emoji: "🎞️", era: "classic", list: "feeling oldie movies" },
  { id: "tense", label: "Edge of my seat", emoji: "😱", genres: ["Thriller", "Horror", "Mystery", "Crime"] },
  { id: "french", label: "Soirée française", emoji: "🥐", language: "fr" },
  { id: "short", label: "Short & sweet", emoji: "⏱️", maxRuntime: 100 },
  { id: "indie", label: "Indie gem", emoji: "💎", list: "indie movies" },
  { id: "docs", label: "Learn something", emoji: "📚", genres: ["Documentary"], list: "documentaries" },
];

/** Letterboxd search link, for films where the export gives no link. */
export const letterboxdSearchUrl = (name: string) => `https://letterboxd.com/search/${encodeURIComponent(name)}/`;

/** Search link on JustWatch for a film (shows streaming / rent / buy options in my region). */
export const whereToWatchUrl = (name: string, year?: number | null) =>
  `https://www.justwatch.com/${config.watchRegion}/search?q=${encodeURIComponent(year ? `${name} ${year}` : name)}`;
