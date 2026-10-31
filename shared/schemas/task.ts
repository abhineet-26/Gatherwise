import { z } from 'zod';
import { IsoDateSchema } from './event';

export const TaskPrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export const TaskStatusSchema = z.enum(['todo', 'in_progress', 'done', 'skipped']);

export const TaskSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  subEventId: z.string().optional(),
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  category: z.string().min(1).max(60),
  priority: TaskPrioritySchema.default('medium'),
  dueDate: IsoDateSchema,
  dueDateLocked: z.boolean().default(false),
  isLocked: z.boolean().optional(),
  completedAt: z.string().optional(),
  status: TaskStatusSchema.default('todo'),
  assignee: z.string().max(60).optional(),
  dependsOn: z.array(z.string()).default([]),
  notes: z.string().max(500).default(''),
  effort: z.enum(['S', 'M', 'L']).default('M'),
  origin: z.object({
    kind: z.enum(['template', 'user', 'ai']),
    templateId: z.string().optional(),
    proposalId: z.string().optional(),
  }).default({ kind: 'template' }),
  anchor: z.object({
    to: z.enum(['event', 'subEvent']),
    subEventId: z.string().optional(),
    leadDays: z.number().int().nonnegative(),
    minLeadDays: z.number().int().nonnegative(),
  }).optional(),
  whyExplanation: z.string().max(300).optional(),
  whyThis: z.string().max(300).optional(),
});

export type Task = z.input<typeof TaskSchema>;
