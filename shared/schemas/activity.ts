import { z } from 'zod';

export const ActivityEntrySchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  at: z.string().datetime().default(() => new Date().toISOString()),
  actor: z.enum(['user', 'assistant_proposal', 'system']).default('user'),
  summary: z.string().max(200),
  commandTypes: z.array(z.string()),
  inverse: z.any().nullable().default(null),
  undone: z.boolean().default(false),
});

export type ActivityEntry = z.infer<typeof ActivityEntrySchema>;
