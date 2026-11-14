import Link from "next/link";
import { Card } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { Stars } from "@/components/Stars";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { chart } from "@/lib/chartTheme";
import { getFilms, getMonthly, getRatingDistribution, getReleaseDecades, getSummary, getYearly } from "@/lib/data";
import { MONTH_SHORT, monthLabel } from "@/lib/format";

// 3.5 -> "3½" (short enough to fit under each bar); full stars shown in the tooltip
const starLabel = (r: number) => `${Math.floor(r) || ""}${r % 1 ? "½" : ""}`;
const starsFull = (r: number) => `${"★".repeat(Math.floor(r))}${r % 1 ? "½" : ""}`;
const shortDate = (d: string) => `${MONTH_SHORT[Number(d.slice(5, 7)) - 1]} ${Number(d.slice(8, 10))}`;

export default async function OverviewPage() {
  const [summary, monthly, yearly, ratings, decades, films] = await Promise.all([
    getSummary(), getMonthly(), getYearly(), getRatingDistribution(), getReleaseDecades(), getFilms(),
  ]);

  const currentYear = Number((summary.last_logged ?? summary.generated_at).slice(0, 4));
  const thisYear = yearly.find((y) => y.year === currentYear);
  const lastYear = yearly.find((y) => y.year === currentYear - 1);
  const recent = films.filter((f) => f.watched_on.length).slice(0, 8); // films.json is newest-first
  const topDecade = decades.reduce((a, b) => (b.films > a.films ? b : a), decades[0]);

  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm text-muted">
          @{summary.username} · on Letterboxd since {summary.member_since}
        </p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">My films</h1>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Films watched" value={summary.films_watched} href="/films" />
        <StatCard label="Average rating" value={summary.avg_rating ?? 0} decimals={2} suffix="★" note={`${summary.rated} films rated`} href="/films" />
        <StatCard
          label={`Films in ${currentYear}`}
          value={thisYear?.films ?? 0}
          note={lastYear ? `${lastYear.films} in ${currentYear - 1}` : undefined}
          href="/films"
        />
        <StatCard label="On my watchlist" value={summary.watchlist} note={`${summary.liked} films liked ♥`} href="/watchlist" />
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Films per month</h2>
        <Card>
          <SimpleBarChart
            data={monthly.map((m) => ({
              x: `${MONTH_SHORT[Number(m.month.slice(5)) - 1]} ${m.month.slice(2, 4)}`,
              y: m.films,
              label: monthLabel(m.month),
              note: m.avg_rating ? `avg ${m.avg_rating}★` : undefined,
            }))}
            unit="films"
            minTickGap={24}
          />
          <p className="mt-2 text-xs text-muted">From diary entries (films logged with a date).</p>
        </Card>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="text-xl font-bold">How I rate <span className="text-sm font-normal text-muted">(stars)</span></h2>
          <Card>
            <SimpleBarChart
              data={ratings.map((r) => ({ x: starLabel(r.rating), y: r.films, label: `${starsFull(r.rating)}  (${r.rating})` }))}
              color={chart.star}
              unit="films"
              height={220}
            />
          </Card>
        </section>
        <section className="space-y-4">
          <h2 className="text-xl font-bold">When my films were made</h2>
          <Card>
            <SimpleBarChart
              data={decades.map((d) => ({ x: `${String(d.decade).slice(2)}s`, y: d.films, label: `${d.decade}s`, note: d.avg_rating ? `avg ${d.avg_rating}★` : undefined }))}
              unit="films"
              height={220}
            />
            <p className="mt-2 text-xs text-muted">Most of my films are from the {topDecade?.decade}s.</p>
          </Card>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold">Recently watched</h2>
          <Link href="/films" className="text-sm text-muted hover:text-foreground">All films →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {recent.map((f) => (
            <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-card p-4 transition hover:-translate-y-0.5 hover:bg-card-hover">
              <p className="text-xs text-muted">{shortDate(f.watched_on[f.watched_on.length - 1])}</p>
              <p className="mt-1 line-clamp-2 font-semibold" title={f.name}>{f.name}</p>
              <p className="text-sm text-muted">{f.year}</p>
              <p className="mt-2 text-sm">
                <Stars rating={f.rating} />
                {f.liked && <span className="ml-2 text-liked" aria-label="liked">♥</span>}
              </p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
