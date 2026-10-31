import { describe, expect, it } from 'vitest';
import { addDays, asIsoDate, daysBetween, isIsoDate, isWeekend, todayInZone, weekday } from './dates';

const d = asIsoDate;

describe('dates', () => {
  it('rejects impossible calendar dates', () => {
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('26-01-01')).toBe(false);
    expect(isIsoDate('2028-02-29')).toBe(true);
    expect(() => asIsoDate('nope')).toThrow(RangeError);
  });

  it('adds days across month, year and leap-day boundaries', () => {
    expect(addDays(d('2026-10-31'), 1)).toBe('2026-11-01');
    expect(addDays(d('2026-12-31'), 1)).toBe('2027-01-01');
    expect(addDays(d('2028-02-28'), 1)).toBe('2028-02-29');
    expect(addDays(d('2026-03-01'), -1)).toBe('2026-02-28');
    expect(() => addDays(d('2026-03-01'), 1.5)).toThrow(RangeError);
  });

  it('counts signed days between dates', () => {
    expect(daysBetween(d('2026-10-21'), d('2027-01-29'))).toBe(100);
    expect(daysBetween(d('2026-10-21'), d('2026-10-20'))).toBe(-1);
  });

  it('computes today on the wall clock of the event time zone', () => {
    // 20:00 UTC on 20 Oct is already 01:30 on 21 Oct in India (UTC+5:30).
    const instant = new Date('2026-10-20T20:00:00Z');
    expect(todayInZone(instant, 'Asia/Kolkata')).toBe('2026-10-21');
    expect(todayInZone(instant, 'UTC')).toBe('2026-10-20');
  });

  it('knows weekends', () => {
    expect(weekday(d('2026-10-24'))).toBe(6);
    expect(isWeekend(d('2026-10-24'))).toBe(true);
    expect(isWeekend(d('2026-10-21'))).toBe(false);
  });
});
