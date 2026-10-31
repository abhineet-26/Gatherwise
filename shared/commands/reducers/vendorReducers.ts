import type { WorkspaceState, BaseCommand, CommandResult } from '../types';
import type { Vendor, Quotation, Commitment, Payment } from '../../schemas';
import { allocateByWeights } from '../../domain/money/allocate';
import type { IsoDate } from '../../domain/time/dates';

export function handleVendorCommands(state: WorkspaceState, command: BaseCommand): CommandResult | null {
  const { type, payload } = command;

  switch (type) {
    case 'ADD_VENDOR': {
      const vendor = payload as unknown as Vendor;
      return {
        nextState: { ...state, vendors: [...state.vendors, vendor] },
        inverse: {
          type: 'DELETE_VENDOR',
          eventId: state.event.id,
          payload: { id: vendor.id },
          meta: { summary: `Undo add vendor ${vendor.name}` },
        },
        summary: `Added vendor "${vendor.name}"`,
      };
    }

    case 'UPDATE_VENDOR': {
      const vendorPayload = payload as { id: string } & Partial<Vendor>;
      const existing = state.vendors.find(v => v.id === vendorPayload.id);
      if (!existing) return { nextState: state, inverse: null, summary: 'Vendor not found' };

      const updated = { ...existing, ...vendorPayload };
      return {
        nextState: {
          ...state,
          vendors: state.vendors.map(v => (v.id === vendorPayload.id ? updated : v)),
        },
        inverse: {
          type: 'UPDATE_VENDOR',
          eventId: state.event.id,
          payload: existing as unknown as Record<string, unknown>,
          meta: { summary: `Undo update vendor ${existing.name}` },
        },
        summary: `Updated vendor "${existing.name}"`,
      };
    }

    case 'DELETE_VENDOR': {
      const id = payload['id'] as string;
      const existing = state.vendors.find(v => v.id === id);
      if (!existing) return { nextState: state, inverse: null, summary: 'Vendor not found' };

      return {
        nextState: { ...state, vendors: state.vendors.filter(v => v.id !== id) },
        inverse: {
          type: 'ADD_VENDOR',
          eventId: state.event.id,
          payload: existing as unknown as Record<string, unknown>,
          meta: { summary: `Restore vendor ${existing.name}` },
        },
        summary: `Deleted vendor "${existing.name}"`,
      };
    }

    case 'ADD_QUOTATION': {
      const quote = payload as unknown as Quotation;
      return {
        nextState: { ...state, quotes: [...state.quotes, quote] },
        inverse: {
          type: 'DELETE_QUOTATION',
          eventId: state.event.id,
          payload: { id: quote.id },
          meta: { summary: `Undo add quote ${quote.title}` },
        },
        summary: `Added quotation "${quote.title}"`,
      };
    }

    case 'ACCEPT_QUOTATION': {
      const { quoteId, commitmentAmount, headcountAtAcceptance, scheduleSplits } = payload as {
        quoteId: string;
        commitmentAmount: number;
        headcountAtAcceptance?: number;
        scheduleSplits?: { label: string; pct: number; dueDate?: IsoDate }[];
      };
      const quote = state.quotes.find(q => q.id === quoteId);
      if (!quote) return { nextState: state, inverse: null, summary: 'Quote not found' };

      const updatedQuote: Quotation = { ...quote, status: 'accepted' };
      const vendor = state.vendors.find(v => v.id === quote.vendorId);
      const updatedVendors = vendor
        ? state.vendors.map(v => (v.id === vendor.id ? { ...v, status: 'booked' as const } : v))
        : state.vendors;

      const newCommitment: Commitment = {
        id: `com_${quote.id}`,
        eventId: state.event.id,
        budgetLineId: quote.budgetLineId || 'general',
        vendorId: quote.vendorId,
        quotationId: quote.id,
        amount: commitmentAmount,
        status: 'active',
        headcountAtAcceptance: headcountAtAcceptance ?? state.event.guestCount,
        title: `Accepted: ${quote.title}`,
        createdAt: new Date().toISOString(),
      };

      const splits = scheduleSplits || (quote.paymentSchedule && quote.paymentSchedule.length > 0 ? quote.paymentSchedule : [
        { label: 'Advance Deposit', pct: quote.depositPct ?? 25 },
        { label: 'Final Settlement', pct: 100 - (quote.depositPct ?? 25) }
      ]);

      const allocatedPaise = allocateByWeights(
        commitmentAmount as any,
        splits.map(s => s.pct)
      );

      const generatedPayments: Payment[] = splits.map((s, idx) => ({
        id: `pay_${quote.id}_${idx + 1}`,
        eventId: state.event.id,
        budgetLineId: quote.budgetLineId || 'general',
        commitmentId: newCommitment.id,
        amount: allocatedPaise[idx] ?? 0,
        status: 'scheduled' as const,
        dueDate: s.dueDate,
        notes: `${s.label} (${s.pct}%) for ${quote.title}`,
      }));

      const paymentIds = generatedPayments.map(p => p.id);

      return {
        nextState: {
          ...state,
          quotes: state.quotes.map(q => (q.id === quoteId ? updatedQuote : q)),
          vendors: updatedVendors,
          commitments: [...state.commitments, newCommitment],
          payments: [...state.payments, ...generatedPayments],
        },
        inverse: {
          type: 'CANCEL_COMMITMENT',
          eventId: state.event.id,
          payload: {
            id: newCommitment.id,
            revertQuoteId: quote.id,
            prevQuoteStatus: quote.status,
            revertVendorId: vendor?.id,
            prevVendorStatus: vendor?.status,
            paymentIds,
          },
          meta: { summary: `Cancel acceptance of quote ${quote.title}` },
        },
        summary: `Accepted quote "${quote.title}" and created commitment with ${generatedPayments.length} scheduled payment(s)`,
      };
    }

    case 'DELETE_QUOTATION': {
      const id = payload['id'] as string;
      const existing = state.quotes.find(q => q.id === id);
      if (!existing) return { nextState: state, inverse: null, summary: 'Quote not found' };

      return {
        nextState: { ...state, quotes: state.quotes.filter(q => q.id !== id) },
        inverse: {
          type: 'ADD_QUOTATION',
          eventId: state.event.id,
          payload: existing as unknown as Record<string, unknown>,
          meta: { summary: `Restore quote ${existing.title}` },
        },
        summary: `Deleted quote "${existing.title}"`,
      };
    }

    default:
      return null;
  }
}
