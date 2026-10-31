/**
 * Calendar-date helpers.
 *
 * Event dates are plain `YYYY-MM-DD` strings interpreted in the event's own
 * time zone (default Asia/Kolkata). All arithmetic happens on UTC epoch days,
 * so daylight-saving shifts can never move a deadline by one day.
 * Nothing in here reads the system clock: callers pass `today` in (see ADR-0003).
 */
export type IsoDate = string & { readonly __brand: 'IsoDate' };

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export function isIsoDate(value: string): value is IsoDate {
  const match = ISO_DATE_RE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  // Round-trip check rejects impossible dates such as 2026-02-30.
  return (
    probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day
  );
}

export function asIsoDate(value: string): IsoDate {
  if (!isIsoDate(value)) throw new RangeError(`Invalid ISO date: "${value}"`);
  return value;
}

/** Whole days since 1970-01-01 (UTC). */
export function toEpochDay(date: IsoDate): number {
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return Math.round(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

export function fromEpochDay(epochDay: number): IsoDate {
  const probe = new Date(epochDay * MS_PER_DAY);
  const yyyy = String(probe.getUTCFullYear()).padStart(4, '0');
  const mm = String(probe.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(probe.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}` as IsoDate;
}

export function addDays(date: IsoDate, days: number): IsoDate {
  if (!Number.isInteger(days)) throw new RangeError(`addDays expects an integer, got ${days}`);
  return fromEpochDay(toEpochDay(date) + days);
}

/** Signed number of days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return toEpochDay(to) - toEpochDay(from);
}

/** ISO dates sort lexicographically, so plain string comparison is correct. */
export function compareDates(a: IsoDate, b: IsoDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Day of week, Sunday = 0. */
export function weekday(date: IsoDate): number {
  return new Date(toEpochDay(date) * MS_PER_DAY).getUTCDay();
}

export function isWeekend(date: IsoDate): boolean {
  const day = weekday(date);
  return day === 0 || day === 6;
}

/** "Today" as seen on a wall clock in `timeZone`. The only place a `Date` enters the domain. */
export function todayInZone(now: Date, timeZone: string): IsoDate {
  // The en-CA locale formats dates as YYYY-MM-DD.
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return asIsoDate(formatted);
}
