import type { WorkspaceState, BaseCommand, CommandResult } from '../types';
import type { BudgetLine, Commitment, Payment } from '../../schemas';

export function handleBudgetCommands(state: WorkspaceState, command: BaseCommand): CommandResult | null {
  const { type, payload } = command;

  switch (type) {
    case 'ADD_BUDGET_LINE': {
      const line = payload as unknown as BudgetLine;
      return {
        nextState: { ...state, budgetLines: [...state.budgetLines, line] },
        inverse: {
          type: 'DELETE_BUDGET_LINE',
          eventId: state.event.id,
          payload: { id: line.id },
          meta: { summary: `Undo add budget line ${line.category}` },
        },
        summary: `Added budget line for ${line.category}`,
      };
    }

    case 'UPDATE_BUDGET_LINE': {
      const linePayload = payload as { id: string } & Partial<BudgetLine>;
      const existing = state.budgetLines.find(b => b.id === linePayload.id);
      if (!existing) return { nextState: state, inverse: null, summary: 'Budget line not found' };

      const updated = { ...existing, ...linePayload };
      return {
        nextState: {
          ...state,
          budgetLines: state.budgetLines.map(b => (b.id === linePayload.id ? updated : b)),
        },
        inverse: {
          type: 'UPDATE_BUDGET_LINE',
          eventId: state.event.id,
          payload: existing as unknown as Record<string, unknown>,
          meta: { summary: `Undo update budget line ${existing.category}` },
        },
        summary: `Updated budget line for ${existing.category}`,
      };
    }

    case 'DELETE_BUDGET_LINE': {
      const id = payload['id'] as string;
      const existing = state.budgetLines.find(b => b.id === id);
      if (!existing) return { nextState: state, inverse: null, summary: 'Budget line not found' };

      return {
        nextState: {
          ...state,
          budgetLines: state.budgetLines.filter(b => b.id !== id),
        },
        inverse: {
          type: 'ADD_BUDGET_LINE',
          eventId: state.event.id,
          payload: existing as unknown as Record<string, unknown>,
          meta: { summary: `Restore budget line ${existing.category}` },
        },
        summary: `Deleted budget line for ${existing.category}`,
      };
    }

    case 'ADD_COMMITMENT': {
      const commitment = payload as unknown as Commitment;
      return {
        nextState: { ...state, commitments: [...state.commitments, commitment] },
        inverse: {
          type: 'CANCEL_COMMITMENT',
          eventId: state.event.id,
          payload: { id: commitment.id },
          meta: { summary: `Cancel commitment ${commitment.id}` },
        },
        summary: `Recorded commitment of ₹${(commitment.amount / 100).toLocaleString('en-IN')}`,
      };
    }

    case 'CANCEL_COMMITMENT': {
      const id = payload['id'] as string;
      const existing = state.commitments.find(c => c.id === id);
      if (!existing) return { nextState: state, inverse: null, summary: 'Commitment not found' };

      const revertQuoteId = payload['revertQuoteId'] as string | undefined;
      const prevQuoteStatus = (payload['prevQuoteStatus'] as any) || 'received';
      const revertVendorId = payload['revertVendorId'] as string | undefined;
      const prevVendorStatus = (payload['prevVendorStatus'] as any) || 'shortlisted';
      const paymentIds = payload['paymentIds'] as string[] | undefined;

      const quotes = revertQuoteId
        ? state.quotes.map(q => (q.id === revertQuoteId ? { ...q, status: prevQuoteStatus } : q))
        : state.quotes;
      const vendors = revertVendorId
        ? state.vendors.map(v => (v.id === revertVendorId ? { ...v, status: prevVendorStatus } : v))
        : state.vendors;
      const payments = paymentIds && paymentIds.length > 0
        ? state.payments.filter(p => !paymentIds.includes(p.id))
        : state.payments;

      return {
        nextState: {
          ...state,
          commitments: state.commitments.map(c => (c.id === id ? { ...c, status: 'cancelled' as const } : c)),
          quotes,
          vendors,
          payments,
        },
        inverse: {
          type: 'ADD_COMMITMENT',
          eventId: state.event.id,
          payload: existing as unknown as Record<string, unknown>,
          meta: { summary: `Restore commitment ${existing.id}` },
        },
        summary: `Cancelled commitment`,
      };
    }

    case 'RECORD_PAYMENT': {
      const payment = payload as unknown as Payment;
      return {
        nextState: { ...state, payments: [...state.payments, payment] },
        inverse: {
          type: 'DELETE_PAYMENT',
          eventId: state.event.id,
          payload: { id: payment.id },
          meta: { summary: `Undo payment ${payment.id}` },
        },
        summary: `Recorded payment of ₹${(payment.amount / 100).toLocaleString('en-IN')}`,
      };
    }

    case 'DELETE_PAYMENT': {
      const id = payload['id'] as string;
      const existing = state.payments.find(p => p.id === id);
      if (!existing) return { nextState: state, inverse: null, summary: 'Payment not found' };

      return {
        nextState: { ...state, payments: state.payments.filter(p => p.id !== id) },
        inverse: {
          type: 'RECORD_PAYMENT',
          eventId: state.event.id,
          payload: existing as unknown as Record<string, unknown>,
          meta: { summary: `Restore payment ${existing.id}` },
        },
        summary: `Deleted payment of ₹${(existing.amount / 100).toLocaleString('en-IN')}`,
      };
    }

    default:
      return null;
  }
}
