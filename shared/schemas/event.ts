import { z } from 'zod';
import { isIsoDate } from '../domain/time/dates';

export const IsoDateSchema = z.string().refine(isIsoDate, {
  message: 'Invalid IsoDate format (YYYY-MM-DD)',
});

export const EventTypeSchema = z.enum(['wedding', 'birthday', 'community']);
export type EventType = z.infer<typeof EventTypeSchema>;

export const VenueStatusSchema = z.enum([
  'not_started',
  'shortlisting',
  'booked',
  'home',
  'open_ground',
]);

export const SettingSchema = z.enum(['indoor', 'outdoor', 'mixed']);

export const CityTierSchema = z.enum(['tier1', 'tier2', 'tier3', 'other', 'unspecified']);
export type CityTier = z.infer<typeof CityTierSchema>;

export const PriorityTagSchema = z.enum([
  'food',
  'photography',
  'entertainment',
  'decor',
  'venue',
  'comfort',
  'savings',
  'sustainability',
  'accessibility',
]);

export const DietTagSchema = z.enum([
  'veg',
  'non_veg',
  'eggetarian',
  'jain',
  'vegan',
  'halal',
  'no_onion_garlic',
  'gluten_free',
  'lactose_free',
  'nut_allergy',
  'other',
]);

export const AccessTagSchema = z.enum([
  'wheelchair',
  'limited_mobility',
  'elder_seating',
  'hearing',
  'vision',
  'neurodiverse_quiet_space',
  'child_care',
  'other',
]);

export const EventSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.literal(1).default(1),
  ownerId: z.string().min(1).default('demo'),
  type: EventTypeSchema,
  subtype: z.string().max(60).optional(),
  name: z.string().min(1).max(80),
  date: IsoDateSchema,
  timezone: z.string().default('Asia/Kolkata'),
  currency: z.literal('INR').default('INR'),
  city: z.string().max(60),
  cityTier: CityTierSchema.default('tier2'),
  venueStatus: VenueStatusSchema.default('not_started'),
  setting: SettingSchema.default('indoor'),
  budgetTarget: z.number().int().nonnegative(),
  contingencyPct: z.number().min(0).max(50).default(7),
  fundingMode: z.enum(['self_funded', 'sponsored']).default('self_funded'),
  attendanceModel: z.enum(['invite_list', 'open_footfall']).default('invite_list'),
  audience: z.enum(['local', 'destination', 'house_party', 'public']).default('local'),
  attendanceAssumptions: z.object({
    pMaybe: z.number().min(0).max(1).default(0.5),
    pPending: z.number().min(0).max(1).default(0.8),
    bufferPct: z.number().min(0).max(0.3).default(0.05),
  }).default({ pMaybe: 0.5, pPending: 0.8, bufferPct: 0.05 }),
  style: z.object({
    theme: z.string().max(80).optional(),
    formality: z.enum(['casual', 'semi_formal', 'formal']).default('semi_formal'),
    vibe: z.array(z.string().max(40)).default([]),
  }).default({ formality: 'semi_formal', vibe: [] }),
  priorities: z.array(PriorityTagSchema).max(3).default([]),
  dietary: z.array(DietTagSchema).default([]),
  accessibilityNeeds: z.array(AccessTagSchema).default([]),
  culturalNotes: z.string().max(500).default(''),
  sideLabels: z.object({
    a: z.string().max(40).default('Side A'),
    b: z.string().max(40).default('Side B'),
  }).default({ a: 'Side A', b: 'Side B' }),
  presetId: z.string().optional(),
  honoreeAge: z.number().int().min(0).max(120).optional(),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type Event = z.infer<typeof EventSchema>;
