import { Card } from "@/components/Card";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { CalendarHeatmap } from "@/components/charts/CalendarHeatmap";
import { chart } from "@/lib/chartTheme";
import { getDiary, getFilms, getMonthly, getRatingDistribution, getReleaseDecades, getSummary, getWeekday, getYearly } from "@/lib/data";
import { MONTH_SHORT, monthLabel } from "@/lib/format";

// 3.5 -> "3½" (short enough to fit under each bar); full stars shown in the tooltip
const starLabel = (r: number) => `${Math.floor(r) || ""}${r % 1 ? "½" : ""}`;
const starsFull = (r: number) => `${"★".repeat(Math.floor(r))}${r % 1 ? "½" : ""}`;

export default async function StatsPage() {
  const [summary, monthly, yearly, ratings, decades, weekday, diary, films] = await Promise.all([
    getSummary(), getMonthly(), getYearly(), getRatingDistribution(), getReleaseDecades(), getWeekday(), getDiary(), getFilms(),
  ]);

  // --- fun facts ---
  const perDay = new Map<string, number>();
  for (const d of diary) perDay.set(d.date, (perDay.get(d.date) ?? 0) + 1);
  const [busiestDate, busiestCount] = [...perDay.entries()].reduce((a, b) => (b[1] > a[1] ? b : a), ["", 0]);
  const favDay = weekday.reduce((a, b) => (b.films > a.films ? b : a), weekday[0]);
  const oldest = films.filter((f) => f.year).reduce((a, b) => (b.year! < a.year! ? b : a), films[0]);
  const bestDecade = decades.filter((d) => d.films >= 3).reduce((a, b) => ((b.avg_rating ?? 0) > (a.avg_rating ?? 0) ? b : a), decades[0]);
  const ratedMonths = monthly.filter((m) => m.films >= 3 && m.avg_rating != null);
  const kindestMonth = ratedMonths.reduce((a, b) => (b.avg_rating! > a.avg_rating! ? b : a), ratedMonths[0]);
  const likedPct = Math.round((summary.liked / summary.films_watched) * 100);

  const facts = [
    { label: "Busiest movie day", value: `${busiestCount} films`, note: busiestDate },
    { label: "Favourite day to watch", value: favDay.day, note: `${favDay.films} diary entries` },
    { label: "Oldest film watched", value: String(oldest.year), note: oldest.name },
    { label: "Best-rated decade", value: `${bestDecade.decade}s`, note: `avg ${bestDecade.avg_rating}★ (3+ films)` },
    { label: "Most generous month", value: kindestMonth ? monthLabel(kindestMonth.month) : "–", note: kindestMonth ? `avg ${kindestMonth.avg_rating}★` : "" },
    { label: "Films I liked", value: `${likedPct}%`, note: `${summary.liked} of ${summary.films_watched}` },
  ];

  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm text-muted">From my Letterboxd diary · {summary.first_logged} to {summary.last_logged}</p>
        <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Stats</h1>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {facts.map((f) => (
          <Card key={f.label}>
            <p className="text-sm text-muted">{f.label}</p>
            <p className="mt-2 text-2xl font-bold">{f.value}</p>
            <p className="mt-1 truncate text-xs text-muted" title={f.note}>{f.note}</p>
          </Card>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">My year in films</h2>
        <Card>
          <CalendarHeatmap entries={diary.map((d) => ({ date: d.date, name: d.name }))} years={yearly.map((y) => y.year)} />
        </Card>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Films per year</h2>
          <Card>
            <SimpleBarChart data={yearly.map((y) => ({ x: String(y.year), y: y.films, note: y.avg_rating ? `avg ${y.avg_rating}★` : undefined }))} unit="films" height={220} />
          </Card>
        </section>
        <section className="space-y-4">
          <h2 className="text-xl font-bold">When I watch</h2>
          <Card>
            <SimpleBarChart data={weekday.map((w) => ({ x: w.day, y: w.films }))} unit="films" height={220} />
          </Card>
        </section>
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
          </Card>
        </section>
      </div>
    </div>
  );
}
