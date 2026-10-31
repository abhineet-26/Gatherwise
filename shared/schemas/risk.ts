import { z } from 'zod';

export const RiskSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const RiskStatusSchema = z.enum(['open', 'mitigating', 'resolved', 'accepted']);

export const RiskSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  dedupeKey: z.string().min(1),
  ruleId: z.string().optional(),
  title: z.string().min(1).max(120),
  detail: z.string().max(500),
  severity: RiskSeveritySchema,
  status: RiskStatusSchema.default('open'),
  mitigation: z.string().max(300).default(''),
  source: z.enum(['rule', 'user', 'ai']).default('rule'),
  refs: z.array(z.string()).default([]),
  decisionNote: z.string().max(300).optional(),
  decidedAtSeverity: RiskSeveritySchema.optional(),
});

export type Risk = z.infer<typeof RiskSchema>;
