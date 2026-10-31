import { z } from 'zod';
import { IsoDateSchema } from './event';

export const BudgetLineBasisSchema = z.enum(['template', 'user_estimate', 'quote']);

export const BudgetLineSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  category: z.string().min(1).max(60),
  subEventId: z.string().optional(),
  name: z.string().max(80).optional(),
  estimate: z.number().int().nonnegative(),
  basis: BudgetLineBasisSchema.default('template'),
  scalesWithHeadcount: z.boolean().default(false),
  notes: z.string().max(300).optional(),
});

export type BudgetLine = z.infer<typeof BudgetLineSchema>;

export const CommitmentStatusSchema = z.enum(['active', 'cancelled', 'completed']);

export const CommitmentSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  budgetLineId: z.string().min(1),
  vendorId: z.string().optional(),
  quotationId: z.string().optional(),
  amount: z.number().int().nonnegative(),
  status: CommitmentStatusSchema.default('active'),
  headcountAtAcceptance: z.number().int().positive().optional(),
  title: z.string().max(80).optional(),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type Commitment = z.infer<typeof CommitmentSchema>;

export const PaymentMethodSchema = z.enum([
  'upi',
  'cash',
  'bank_transfer',
  'cheque',
  'card',
  'other',
]);

export const PaymentStatusSchema = z.enum(['scheduled', 'paid', 'refunded', 'cancelled']);

export const PaymentSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  budgetLineId: z.string().min(1),
  commitmentId: z.string().optional(),
  amount: z.number().int().nonnegative(),
  status: PaymentStatusSchema.default('scheduled'),
  dueDate: IsoDateSchema.optional(),
  paidDate: IsoDateSchema.optional(),
  method: PaymentMethodSchema.default('upi'),
  reference: z.string().max(12).optional(),
  notes: z.string().max(200).optional(),
  isRefund: z.boolean().default(false),
});

export type Payment = z.infer<typeof PaymentSchema>;
