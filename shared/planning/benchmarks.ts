import type { EventType, CityTier } from '../schemas';

export interface Benchmark {
  id: string;
  label: string;
  appliesTo: {
    type?: EventType;
    cityTier?: CityTier;
    subtype?: string;
  };
  value: {
    low?: number;
    high?: number;
    point?: number;
    unit: 'INR_per_guest' | 'percent' | 'INR_total' | 'ratio';
  };
  sourceNote: string;
  reliability: 'M' | 'L';
  asOf: string;
  verified: false;
}

export const BENCHMARKS: Benchmark[] = [
  {
    id: 'wed.perGuest.tier1.mid',
    label: 'All-in cost per guest, mid-range metro wedding',
    appliesTo: { type: 'wedding', cityTier: 'tier1' },
    value: { low: 1000000, high: 1800000, unit: 'INR_per_guest' }, // in paise
    sourceNote: 'Planning guide (100-guest example), commercial wedding calculators',
    reliability: 'L',
    asOf: '2026',
    verified: false,
  },
  {
    id: 'wed.perGuest.tier1.wide',
    label: 'Wider band across formats, metro wedding',
    appliesTo: { type: 'wedding', cityTier: 'tier1' },
    value: { low: 800000, high: 2500000, unit: 'INR_per_guest' },
    sourceNote: 'Guest-count cost guide (2025-2026)',
    reliability: 'L',
    asOf: '2026',
    verified: false,
  },
  {
    id: 'wed.share.venueCatering',
    label: 'Venue + catering share of total budget',
    appliesTo: { type: 'wedding' },
    value: { low: 55, high: 65, point: 57, unit: 'percent' },
    sourceNote: 'Industry overview reports (WedMeGood, Matrimony.com market reports)',
    reliability: 'M',
    asOf: '2026',
    verified: false,
  },
  {
    id: 'wed.share.decor',
    label: 'Decor & floral share of total budget',
    appliesTo: { type: 'wedding' },
    value: { low: 10, high: 15, point: 11, unit: 'percent' },
    sourceNote: 'Industry overview report across North & South Indian weddings',
    reliability: 'M',
    asOf: '2026',
    verified: false,
  },
  {
    id: 'wed.share.photo',
    label: 'Photography & videography share',
    appliesTo: { type: 'wedding' },
    value: { low: 8, high: 12, point: 8, unit: 'percent' },
    sourceNote: 'Derived from vendor sample survey brief',
    reliability: 'L',
    asOf: '2026',
    verified: false,
  },
  {
    id: 'att.local.pending',
    label: 'Attendance rate for local weddings',
    appliesTo: { type: 'wedding' },
    value: { low: 70, high: 85, point: 80, unit: 'percent' },
    sourceNote: 'RSVP guide heuristics; Indian wedding organizers advise local buffering',
    reliability: 'L',
    asOf: '2026',
    verified: false,
  },
  {
    id: 'att.buffer',
    label: 'Catering headcount buffer over expected attendance',
    appliesTo: {},
    value: { point: 5, unit: 'percent' },
    sourceNote: 'Standard Indian banquet catering practice',
    reliability: 'L',
    asOf: '2026',
    verified: false,
  },
  {
    id: 'bday.cost',
    label: 'Typical urban children birthday celebration cost',
    appliesTo: { type: 'birthday' },
    value: { low: 2500000, high: 10000000, unit: 'INR_total' },
    sourceNote: 'Press lifestyle survey; high variance based on home vs venue',
    reliability: 'L',
    asOf: '2026',
    verified: false,
  },
  {
    id: 'ctg.reserve',
    label: 'Contingency reserve default percentage',
    appliesTo: {},
    value: { low: 5, high: 10, point: 7, unit: 'percent' },
    sourceNote: 'Standard event risk management practice',
    reliability: 'L',
    asOf: '2026',
    verified: false,
  },
];

export function getPerGuestBenchmark(type: EventType, cityTier?: CityTier): { low: number; high: number } | null {
  const match = BENCHMARKS.find(
    b => b.appliesTo.type === type && (!b.appliesTo.cityTier || b.appliesTo.cityTier === cityTier) && b.value.unit === 'INR_per_guest'
  );
  if (!match || match.value.low === undefined || match.value.high === undefined) {
    return null;
  }
  return { low: match.value.low, high: match.value.high };
}
