import type { WorkspaceState, BaseCommand, CommandResult } from '../types';
import type { Guest, Risk } from '../../schemas';

export function handleGuestAndRiskCommands(state: WorkspaceState, command: BaseCommand): CommandResult | null {
  const { type, payload } = command;

  switch (type) {
    case 'ADD_GUEST': {
      const guest = payload as unknown as Guest;
      return {
        nextState: { ...state, guests: [...state.guests, guest] },
        inverse: {
          type: 'DELETE_GUEST',
          eventId: state.event.id,
          payload: { id: guest.id },
          meta: { summary: `Undo add guest ${guest.name}` },
        },
        summary: `Added guest "${guest.name}" (${guest.partySize} pax)`,
      };
    }

    case 'UPDATE_GUEST': {
      const guestPayload = payload as { id: string } & Partial<Guest>;
      const existing = state.guests.find(g => g.id === guestPayload.id);
      if (!existing) return { nextState: state, inverse: null, summary: 'Guest not found' };

      const updated = { ...existing, ...guestPayload };
      return {
        nextState: {
          ...state,
          guests: state.guests.map(g => (g.id === guestPayload.id ? updated : g)),
        },
        inverse: {
          type: 'UPDATE_GUEST',
          eventId: state.event.id,
          payload: existing as unknown as Record<string, unknown>,
          meta: { summary: `Undo update guest ${existing.name}` },
        },
        summary: `Updated guest "${existing.name}"`,
      };
    }

    case 'SET_RSVP': {
      const { guestId, subEventId, status, confirmedParty } = payload as {
        guestId: string;
        subEventId: string;
        status: 'pending' | 'attending' | 'declined' | 'tentative';
        confirmedParty?: number;
      };
      const guest = state.guests.find(g => g.id === guestId);
      if (!guest) return { nextState: state, inverse: null, summary: 'Guest not found' };

      const prevInv = guest.invitations?.[subEventId] || { invited: true, status: 'pending' };
      const updatedGuest: Guest = {
        ...guest,
        invitations: {
          ...(guest.invitations || {}),
          [subEventId]: { invited: true, status, confirmedParty },
        },
      };

      return {
        nextState: {
          ...state,
          guests: state.guests.map(g => (g.id === guestId ? updatedGuest : g)),
        },
        inverse: {
          type: 'SET_RSVP',
          eventId: state.event.id,
          payload: {
            guestId,
            subEventId,
            status: prevInv.status,
            confirmedParty: prevInv.confirmedParty,
          },
          meta: { summary: `Revert RSVP for ${guest.name}` },
        },
        summary: `Set RSVP for "${guest.name}" to ${status}`,
      };
    }

    case 'DELETE_GUEST': {
      const id = payload['id'] as string;
      const existing = state.guests.find(g => g.id === id);
      if (!existing) return { nextState: state, inverse: null, summary: 'Guest not found' };

      return {
        nextState: { ...state, guests: state.guests.filter(g => g.id !== id) },
        inverse: {
          type: 'ADD_GUEST',
          eventId: state.event.id,
          payload: existing as unknown as Record<string, unknown>,
          meta: { summary: `Restore guest ${existing.name}` },
        },
        summary: `Deleted guest "${existing.name}"`,
      };
    }

    case 'UPDATE_RISK_STATUS': {
      const { riskId, status, decisionNote } = payload as { riskId: string; status: Risk['status']; decisionNote?: string };
      const existing = state.risks.find(r => r.id === riskId);
      if (!existing) return { nextState: state, inverse: null, summary: 'Risk not found' };

      const prevStatus = existing.status;
      const prevNote = existing.decisionNote;

      return {
        nextState: {
          ...state,
          risks: state.risks.map(r => (r.id === riskId ? { ...r, status, decisionNote } : r)),
        },
        inverse: {
          type: 'UPDATE_RISK_STATUS',
          eventId: state.event.id,
          payload: { riskId, status: prevStatus, decisionNote: prevNote },
          meta: { summary: `Undo risk status update` },
        },
        summary: `Updated risk "${existing.title}" to ${status}`,
      };
    }

    default:
      return null;
  }
}
