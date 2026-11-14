import { Stars } from "./Stars";
import { MONTH_SHORT } from "@/lib/format";

type Props = {
  name: string;
  year: number | null;
  url: string;
  date?: string; // "YYYY-MM-DD" watched date
  rating?: number | null;
  liked?: boolean;
  rewatch?: boolean;
  showYearInDate?: boolean;
};

const fmt = (d: string, withYear?: boolean) =>
  `${MONTH_SHORT[Number(d.slice(5, 7)) - 1]} ${Number(d.slice(8, 10))}${withYear ? `, ${d.slice(0, 4)}` : ""}`;

/** Small clickable film tile that opens the film on Letterboxd. */
export function FilmCard({ name, year, url, date, rating, liked, rewatch, showYearInDate }: Props) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl bg-card p-4 transition hover:-translate-y-0.5 hover:bg-card-hover"
    >
      {date && (
        <p className="text-xs text-muted">
          {fmt(date, showYearInDate)}
          {rewatch && <span title="rewatch"> · ↻</span>}
        </p>
      )}
      <p className="mt-1 line-clamp-2 font-semibold" title={name}>{name}</p>
      <p className="text-sm text-muted">{year}</p>
      <p className="mt-2 text-sm">
        <Stars rating={rating ?? null} />
        {liked && <span className="ml-2 text-liked" aria-label="liked">♥</span>}
      </p>
    </a>
  );
}
