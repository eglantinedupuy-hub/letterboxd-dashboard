/** Full TMDB image URL from a poster path. Sizes: w92, w154, w185, w342, w500, w780, original. */
export const posterUrl = (path: string | null | undefined, size = "w342") =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
