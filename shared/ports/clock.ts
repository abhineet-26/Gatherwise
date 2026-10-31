import { type IsoDate, asIsoDate } from '../domain/time/dates';

export interface Clock {
  today(): IsoDate;
  now(): string; // ISO 8601 UTC
}

export class SystemClock implements Clock {
  today(): IsoDate {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return asIsoDate(`${yyyy}-${mm}-${dd}`);
  }

  now(): string {
    return new Date().toISOString();
  }
}

export class FixedClock implements Clock {
  constructor(private readonly fixedDate: IsoDate, private readonly fixedNow = '2026-10-21T12:00:00.000Z') {}

  today(): IsoDate {
    return this.fixedDate;
  }

  now(): string {
    return this.fixedNow;
  }
}
