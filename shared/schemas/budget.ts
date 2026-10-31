import { z } from 'zod';
import { IsoDateSchema } from './event';

export const BudgetLineBasisSchema = z.enum([
  'template',
  'user_estimate',
  'quote',
  'user',
  'actual',
  'commitment',
]);

export const BudgetLineSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  category: z.string().min(1).max(60),
  subEventId: z.string().optional(),
  name: z.string().max(80).optional(),
  estimate: z.number().int().nonnegative(),
  lowEstimate: z.number().int().nonnegative().optional(),
  highEstimate: z.number().int().nonnegative().optional(),
  basis: BudgetLineBasisSchema.default('template'),
  scalesWithHeadcount: z.boolean().default(false),
  notes: z.string().max(300).optional(),
  whyThis: z.string().max(300).optional(),
});

export type BudgetLine = z.input<typeof BudgetLineSchema>;

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
  createdAt: z.string().default(() => new Date().toISOString()),
});

export type Commitment = z.input<typeof CommitmentSchema>;

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
  budgetLineId: z.string().min(1).optional(),
  commitmentId: z.string().optional(),
  amount: z.number().int().nonnegative(),
  status: PaymentStatusSchema.default('scheduled'),
  dueDate: IsoDateSchema.optional(),
  paidDate: IsoDateSchema.optional(),
  paidAt: z.string().optional(),
  method: PaymentMethodSchema.default('upi'),
  mode: PaymentMethodSchema.default('upi'),
  recipient: z.string().max(80).optional(),
  reference: z.string().max(60).optional(),
  notes: z.string().max(200).optional(),
  isRefund: z.boolean().default(false),
});

export type Payment = z.input<typeof PaymentSchema>;
