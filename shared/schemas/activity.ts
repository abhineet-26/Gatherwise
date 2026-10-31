import { z } from 'zod';

export const ActivityEntrySchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  at: z.string().default(() => new Date().toISOString()),
  timestamp: z.string().optional(),
  actor: z.enum(['user', 'assistant_proposal', 'system']).default('user'),
  summary: z.string().max(200),
  commandType: z.string().optional(),
  commandTypes: z.array(z.string()).default([]),
  inverse: z.any().nullable().default(null),
  undone: z.boolean().default(false),
  reversible: z.boolean().optional(),
});

export type ActivityEntry = z.infer<typeof ActivityEntrySchema>;
