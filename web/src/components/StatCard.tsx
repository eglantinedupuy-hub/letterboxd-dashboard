"use client";

import { useCountUp } from "@/hooks/useCountUp";
import { Card } from "./Card";

type StatCardProps = {
  label: string;
  value: number;
  decimals?: number; // e.g. 2 for an average rating
  suffix?: string; // e.g. "★"
  note?: string;
  href?: string;
};

/** A big animated number with a label. */
export function StatCard({ label, value, decimals = 0, suffix, note, href }: StatCardProps) {
  const animated = useCountUp(value);
  return (
    <Card href={href}>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
        {animated.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
        {suffix && <span className="ml-1 text-xl text-star">{suffix}</span>}
      </p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </Card>
  );
}
