import Image from "next/image";
import { Stars } from "./Stars";
import { MONTH_SHORT } from "@/lib/format";
import { posterUrl } from "@/lib/poster";

type Props = {
  name: string;
  year: number | null;
  url: string;
  date?: string; // "YYYY-MM-DD" watched date
  rating?: number | null;
  liked?: boolean;
  rewatch?: boolean;
  showYearInDate?: boolean;
  poster?: string | null; // TMDB poster path, e.g. "/abc.jpg"
};

const fmt = (d: string, withYear?: boolean) =>
  `${MONTH_SHORT[Number(d.slice(5, 7)) - 1]} ${Number(d.slice(8, 10))}${withYear ? `, ${d.slice(0, 4)}` : ""}`;

/** Film tile with its poster that opens the film on Letterboxd. */
export function FilmCard({ name, year, url, date, rating, liked, rewatch, showYearInDate, poster }: Props) {
  const src = posterUrl(poster, "w342");
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-2xl bg-card transition hover:-translate-y-0.5 hover:bg-card-hover"
    >
      <div className="relative aspect-[2/3] w-full bg-card-hover">
        {src ? (
          <Image src={src} alt={`Poster for ${name}`} fill sizes="(min-width: 640px) 25vw, 50vw" unoptimized className="object-cover transition group-hover:brightness-110" />
        ) : (
          // no poster: show the title on a plain tile instead
          <div className="flex h-full items-center justify-center p-4 text-center text-sm font-semibold text-muted">{name}</div>
        )}
      </div>
      <div className="p-3">
        {date && (
          <p className="text-xs text-muted">
            {fmt(date, showYearInDate)}
            {rewatch && <span title="rewatch"> · ↻</span>}
          </p>
        )}
        <p className="mt-0.5 truncate text-sm font-semibold" title={name}>{name}</p>
        <p className="text-xs text-muted">{year}</p>
        {(rating != null || liked) && (
          <p className="mt-1 whitespace-nowrap text-xs">
            <Stars rating={rating ?? null} />
            {liked && <span className="ml-1.5 text-liked" aria-label="liked">♥</span>}
          </p>
        )}
      </div>
    </a>
  );
}
