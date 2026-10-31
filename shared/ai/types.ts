import { z } from 'zod';
import type { BaseCommand } from 'shared/commands/types';
import type { ImpactPreview } from 'shared/commands/preview';

export type AiErrorCode =
  | 'AI_UNAVAILABLE'
  | 'AI_QUOTA_EXCEEDED'
  | 'AI_TIMEOUT'
  | 'AI_INVALID_OUTPUT'
  | 'AI_REJECTED';

export class AiError extends Error {
  constructor(
    public readonly code: AiErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'AiError';
  }
}

export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolName: string;
  data: Record<string, unknown>;
  display?: Record<string, string>;
  truncated?: boolean;
}

export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

export interface Usage {
  promptTokens?: number;
  completionTokens?: number;
}

export interface ProposalItem {
  id: string;
  title: string;
  whyThis: string;
  commands: BaseCommand[];
  impact?: ImpactPreview;
}

export interface AiResponse {
  text: string;
  evidence: string[];
  proposals: ProposalItem[];
  toolTrace: string[];
  unverifiedNumbers?: string[];
  source: 'gemini' | 'fallback';
}

/**
 * Strict schema for PII-minimised context
 * (AI-DESIGN.md §4)
 */
export const AiContextSchema = z.object({
  event: z.object({
    id: z.string(),
    type: z.string(),
    subtype: z.string().optional(),
    date: z.string(),
    daysToEvent: z.number().int(),
    city: z.string(),
    budgetTarget: z.number().int().nonnegative(),
    contingencyPct: z.number().default(10),
    setting: z.string().optional(),
    priorities: z.array(z.string()).default([]),
    dietaryTags: z.array(z.string()).default([]),
  }),
  subEvents: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      date: z.string(),
    })
  ).default([]),
  budgetLines: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
      estimate: z.number().int().nonnegative(),
      locked: z.boolean().default(false),
    })
  ).default([]),
  commitments: z.array(
    z.object({
      id: z.string(),
      budgetLineId: z.string(),
      amount: z.number().int().nonnegative(),
      status: z.string(),
    })
  ).default([]),
  payments: z.array(
    z.object({
      id: z.string(),
      budgetLineId: z.string(),
      amount: z.number().int().nonnegative(),
      status: z.string(),
      dueDate: z.string().optional(),
    })
  ).default([]),
  vendors: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      status: z.string(),
    })
  ).default([]),
  quotes: z.array(
    z.object({
      id: z.string(),
      vendorId: z.string(),
      title: z.string(),
      pricingModel: z.string(),
      baseAmount: z.number().int().nonnegative(),
      taxMode: z.string(),
      gstPct: z.number().optional(),
      inclusions: z.record(z.boolean()).default({}),
      validUntil: z.string().optional(),
      status: z.string(),
    })
  ).default([]),
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      category: z.string(),
      priority: z.string(),
      dueDate: z.string(),
      status: z.string(),
      dueDateLocked: z.boolean().default(false),
      assigned: z.boolean().default(false),
    })
  ).default([]),
  risks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      severity: z.string(),
      status: z.string(),
    })
  ).default([]),
  guestAggregates: z.object({
    totalGuests: z.number().int().nonnegative(),
    confirmedYes: z.number().int().nonnegative(),
    unrepliedPending: z.number().int().nonnegative(),
    dietaryCounts: z.record(z.number().int().nonnegative()).default({}),
  }),
  today: z.string(),
}).strict();

export type AiContext = z.infer<typeof AiContextSchema>;
