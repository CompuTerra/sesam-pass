/** Shared crack-time bucketing; only the unit words are localized per language. */

export interface DurationUnits {
  readonly instant: string;
  readonly uncrackable: string;
  readonly sec: string;
  readonly min: string;
  readonly hour: string;
  readonly day: string;
  readonly year: string;
  readonly thousandYears: string;
  readonly millionYears: string;
  readonly billionYears: string;
  readonly trillionYears: string;
}

const MIN = 60;
const HOUR = 3600;
const DAY = 86400;
const YEAR = 31_557_600; // 365.25 days

export function formatDuration(
  seconds: number,
  u: DurationUnits,
  fmt: (n: number) => string,
): string {
  if (!Number.isFinite(seconds)) return u.uncrackable;
  if (seconds < 1) return u.instant;
  if (seconds < MIN) return `${fmt(Math.round(seconds))} ${u.sec}`;
  if (seconds < HOUR) return `${fmt(Math.round(seconds / MIN))} ${u.min}`;
  if (seconds < DAY) return `${fmt(Math.round(seconds / HOUR))} ${u.hour}`;
  if (seconds < YEAR) return `${fmt(Math.round(seconds / DAY))} ${u.day}`;

  const years = seconds / YEAR;
  if (years < 1e3) return `${fmt(Math.round(years))} ${u.year}`;
  if (years < 1e6) return `${fmt(Math.round(years / 1e3))} ${u.thousandYears}`;
  if (years < 1e9) return `${fmt(Math.round(years / 1e6))} ${u.millionYears}`;
  if (years < 1e12) return `${fmt(Math.round(years / 1e9))} ${u.billionYears}`;
  if (years < 1e15) return `${fmt(Math.round(years / 1e12))} ${u.trillionYears}`;
  return u.uncrackable;
}
