import Link from "next/link";
import { connection } from "next/server";
import { ChallengeCard } from "@/components/ChallengeCard";
import { FilmCard } from "@/components/FilmCard";
import { ReviewCarousel } from "@/components/ReviewCarousel";
import { StatCard } from "@/components/StatCard";
import { Throwback } from "@/components/Throwback";
import { config, letterboxdSearchUrl } from "@/config";
import { getDiary, getFavourites, getReviews, getSummary, getTmdb } from "@/lib/data";
import { dayOfYear, daySeed, daysInYear, todayISO, weekStart } from "@/lib/dates";
import { monthLabel } from "@/lib/format";

export default async function OverviewPage() {
  await connection(); // render on each visit so "this week / today" use the real current date
  const [summary, diary, reviews, tmdb, favourites] = await Promise.all([getSummary(), getDiary(), getReviews(), getTmdb(), getFavourites()]);
  const posterOf = (key: string) => tmdb[key]?.poster ?? null;

  const today = todayISO();
  const year = Number(today.slice(0, 4));
  const month = today.slice(0, 7);
  const mm = month.slice(5);
  const monthName = monthLabel(month).split(" ")[0];
  const monday = weekStart(today);

  const thisYear = diary.filter((d) => d.date.startsWith(String(year)));
  const thisMonth = diary.filter((d) => d.date.startsWith(month));
  const thisWeek = diary.filter((d) => d.date >= monday && d.date <= today);
  const sameMonthLastYear = diary.filter((d) => d.date.startsWith(`${year - 1}-${mm}`)).length;

  // Throwback: the same calendar month in previous years, grouped by year (newest first)
  const throwback = new Map<number, typeof diary>();
  for (const d of diary) {
    const y = Number(d.date.slice(0, 4));
    if (d.date.slice(5, 7) === mm && y < year) throwback.set(y, [...(throwback.get(y) ?? []), d]);
  }
  const throwbackYears = [...throwback.keys()].sort((a, b) => b - a);

  const recent = diary.slice(0, 8); // diary is newest-first
  const dataAge = summary.last_logged ? Math.round((Date.parse(today) - Date.parse(summary.last_logged)) / 86_400_000) : null;

  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm text-muted">
          @{summary.username} · {summary.films_watched} films · diary up to {summary.last_logged}
          {dataAge !== null && dataAge > 14 && <span className="text-accent"> (time to re-export)</span>}
        </p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">My films</h1>
      </section>

      <section className="grid gap-3 sm:gap-4 lg:grid-cols-5">
        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:col-span-3">
          <StatCard label="This week" value={thisWeek.length} note="since Monday" />
          <StatCard label="This month" value={thisMonth.length} note={`${sameMonthLastYear} in ${monthName} ${year - 1}`} />
          <StatCard label="This year" value={thisYear.length} note={`avg ${avg(thisYear.map((d) => d.rating))}★`} href="/stats" />
        </div>
        <div className="lg:col-span-2">
          <ChallengeCard year={year} done={thisYear.length} goal={config.challengeGoal} dayOfYear={dayOfYear(today)} daysInYear={daysInYear(year)} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">All-time favourites</h2>
        <div className="grid max-w-2xl grid-cols-4 gap-3">
          {favourites.map((f) => (
            <FilmCard key={f.name} name={f.name} year={f.year} url={f.url ?? letterboxdSearchUrl(f.name)} poster={posterOf(`favourite:${f.name}`)} liked />
          ))}
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">From my diary</h2>
          <ReviewCarousel reviews={reviews.map((r) => ({ ...r, poster: posterOf(r.url) }))} startIndex={daySeed(today)} />
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-bold">{monthName} in past years</h2>
        {throwbackYears.length === 0 ? (
          <p className="text-sm text-muted">Nothing logged in {monthName} in earlier years.</p>
        ) : (
          <Throwback
            groups={throwbackYears.map((y) => ({
              year: y,
              films: throwback.get(y)!.map((d) => ({ ...d, poster: posterOf(d.url) })),
            }))}
          />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold">Recently watched</h2>
          <Link href="/pick" className="text-sm text-muted hover:text-foreground">What should I watch next? →</Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {recent.map((d) => (
            <FilmCard key={`${d.date}-${d.url}`} {...d} poster={posterOf(d.url)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function avg(values: (number | null)[]): string {
  const v = values.filter((x): x is number => x != null);
  return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "–";
}
