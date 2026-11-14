"use client";

import { useCountUp } from "@/hooks/useCountUp";

type Props = {
  year: number;
  done: number;
  goal: number;
  dayOfYear: number;
  daysInYear: number;
};

/** Yearly challenge: progress bar, a marker for where I "should" be today, and the pace. */
export function ChallengeCard({ year, done, goal, dayOfYear, daysInYear }: Props) {
  const animated = useCountUp(done);
  const expected = (goal * dayOfYear) / daysInYear; // where I'd be at a steady pace
  const diff = Math.round(done - expected);
  const projected = Math.round((done / dayOfYear) * daysInYear);
  const pct = Math.min((done / goal) * 100, 100);
  const markerPct = Math.min((expected / goal) * 100, 100);
  const status =
    done >= goal ? "Challenge complete! 🎉" : diff >= 0 ? `${diff} ahead of pace` : `${-diff} behind pace`;

  return (
    <div className="rounded-2xl bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted">{year} challenge</p>
        <p className={`text-sm ${done >= goal || diff >= 0 ? "text-star" : "text-accent"}`}>{status}</p>
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums sm:text-4xl">
        {Math.round(animated)}
        <span className="text-xl font-medium text-muted"> / {goal} films</span>
      </p>

      {/* progress bar with a "today's target" tick */}
      <div className="relative mt-4 h-3 w-full rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={done}>
        <div className="h-3 rounded-full bg-accent transition-[width] duration-1000" style={{ width: `${pct}%` }} />
        <div className="absolute -top-1 h-5 w-0.5 rounded bg-white" style={{ left: `${markerPct}%` }} title={`Target for today: ${Math.round(expected)}`} />
      </div>
      <p className="mt-2 text-xs text-muted">
        White tick = where I’d be at a steady pace ({Math.round(expected)} today). At my current pace I’ll finish with about {projected} films.
      </p>
    </div>
  );
}
