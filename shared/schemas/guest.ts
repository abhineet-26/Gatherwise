import { z } from 'zod';
import { DietTagSchema, AccessTagSchema } from './event';

export const RsvpStatusSchema = z.enum(['pending', 'attending', 'declined', 'tentative']);

export const SubEventInvitationSchema = z.object({
  invited: z.boolean().default(true),
  status: RsvpStatusSchema.default('pending'),
  confirmedParty: z.number().int().nonnegative().optional(),
});

export const GuestSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  name: z.string().min(1).max(80),
  group: z.string().max(40).optional(),
  side: z.enum(['a', 'b', 'shared']).default('shared'),
  partySize: z.number().int().min(1).default(1),
  childrenUnder5: z.number().int().nonnegative().default(0),
  children5to12: z.number().int().nonnegative().default(0),
  contact: z.object({
    phone: z.string().max(20).optional(),
    email: z.string().email().optional().or(z.literal('')),
  }).default({}),
  inviteSent: z.enum(['not_sent', 'sent']).default('not_sent'),
  invitations: z.record(SubEventInvitationSchema).default({}),
  dietary: z.array(DietTagSchema).default([]),
  accessibility: z.array(AccessTagSchema).default([]),
  accessibilityNote: z.string().max(200).optional(),
  table: z.string().max(40).optional(),
  notes: z.string().max(300).default(''),
}).refine(data => data.childrenUnder5 + data.children5to12 <= data.partySize, {
  message: 'Children counts cannot exceed total party size (INV-06)',
});

export type Guest = z.infer<typeof GuestSchema>;
