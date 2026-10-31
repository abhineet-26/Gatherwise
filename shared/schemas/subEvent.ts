import { z } from 'zod';
import { IsoDateSchema } from './event';

export const SubEventKindSchema = z.enum([
  'ceremony',
  'reception',
  'pre_event',
  'day',
  'session',
  'other',
]);
export type SubEventKind = z.infer<typeof SubEventKindSchema>;

export const SubEventSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  name: z.string().min(1).max(80),
  kind: SubEventKindSchema.default('ceremony'),
  date: IsoDateSchema,
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  venueLabel: z.string().max(100).optional(),
  dressCode: z.string().max(80).optional(),
  headcountMode: z.enum(['from_guests', 'manual']).default('from_guests'),
  manualHeadcount: z.number().int().nonnegative().optional(),
  order: z.number().int().default(0),
  notes: z.string().max(500).optional(),
});

export type SubEvent = z.infer<typeof SubEventSchema>;
