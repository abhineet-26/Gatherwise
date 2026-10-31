import { z } from 'zod';
import { IsoDateSchema } from './event';

export const VendorStatusSchema = z.enum([
  'to_research',
  'shortlisted',
  'contacted',
  'quote_received',
  'booked',
  'completed',
  'cancelled',
]);

export const VendorSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  name: z.string().min(1).max(80),
  category: z.string().min(1).max(60),
  status: VendorStatusSchema.default('to_research'),
  contact: z.object({
    phone: z.string().max(20).optional(),
    whatsapp: z.string().max(20).optional(),
    email: z.string().email().optional().or(z.literal('')),
  }).default({}),
  city: z.string().max(60).optional(),
  notes: z.string().max(500).default(''),
  userRating: z.number().min(0).max(5).optional(),
});

export type Vendor = z.infer<typeof VendorSchema>;

export const PricingModelSchema = z.enum(['fixed', 'per_head', 'per_unit']);
export const TaxModeSchema = z.enum(['inclusive', 'exclusive', 'unknown']);
export const QuoteStatusSchema = z.enum(['received', 'shortlisted', 'accepted', 'rejected']);

export const QuotationSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  vendorId: z.string().min(1),
  budgetLineId: z.string().optional(),
  title: z.string().min(1).max(80),
  pricing: z.object({
    model: PricingModelSchema,
    baseAmount: z.number().int().nonnegative(),
    quantity: z.number().int().positive().optional(),
  }),
  taxMode: TaxModeSchema.default('exclusive'),
  gstPct: z.number().min(0).max(40).optional(),
  serviceChargePct: z.number().min(0).max(30).optional(),
  inclusions: z.record(z.boolean()).default({}),
  exclusionsNote: z.string().max(300).optional(),
  depositPct: z.number().min(0).max(100).optional(),
  paymentSchedule: z.array(z.object({
    label: z.string().max(60),
    pct: z.number().min(0).max(100),
    dueDate: IsoDateSchema.optional(),
  })).optional(),
  validUntil: IsoDateSchema.optional(),
  freeCancellationDaysBefore: z.number().int().nonnegative().optional(),
  cancellationNote: z.string().max(300).optional(),
  status: QuoteStatusSchema.default('received'),
  source: z.enum(['manual', 'scanner']).default('manual'),
  notes: z.string().max(500).default(''),
});

export type Quotation = z.infer<typeof QuotationSchema>;
