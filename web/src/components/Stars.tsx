/** Letterboxd-style rating: 3.5 -> "★★★½" in green. Null -> nothing. */
export function Stars({ rating, className = "" }: { rating: number | null; className?: string }) {
  if (rating == null) return null;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className={`whitespace-nowrap text-star ${className}`} aria-label={`${rating} out of 5 stars`} title={`${rating} / 5`}>
      {"★".repeat(full)}
      {half ? "½" : ""}
    </span>
  );
}
