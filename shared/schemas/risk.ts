import { z } from 'zod';

export const RiskSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const RiskStatusSchema = z.enum(['open', 'mitigating', 'resolved', 'accepted', 'identified']);

export const RiskSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  dedupeKey: z.string().default(''),
  ruleId: z.string().optional(),
  category: z.string().optional(),
  title: z.string().min(1).max(120),
  detail: z.string().max(500).default(''),
  severity: RiskSeveritySchema,
  status: RiskStatusSchema.default('open'),
  mitigation: z.string().max(300).default(''),
  mitigationPlan: z.string().max(300).optional(),
  source: z.string().default('rule'),
  refs: z.array(z.string()).default([]),
  decisionNote: z.string().max(300).optional(),
  decidedAtSeverity: RiskSeveritySchema.optional(),
});

export type Risk = z.input<typeof RiskSchema>;
