import { config } from "@/config";

/** Today's date as "YYYY-MM-DD" in my time zone. */
export function todayISO(): string {
  // en-CA formats dates as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: config.timeZone }).format(new Date());
}

/** Monday of the week containing `iso` ("YYYY-MM-DD"). */
export function weekStart(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  const offset = (d.getUTCDay() + 6) % 7; // Mon=0 ... Sun=6
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}

/** Day of year, 1-based. */
export function dayOfYear(iso: string): number {
  const d = Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
  return Math.floor((d - Date.UTC(+iso.slice(0, 4), 0, 1)) / 86_400_000) + 1;
}

export const daysInYear = (y: number) => ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365);

/** A number that changes once per day — used to pick "today's" random item the same way on server and browser. */
export function daySeed(iso: string): number {
  return Number(iso.replaceAll("-", ""));
}
