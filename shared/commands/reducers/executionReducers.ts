import type { WorkspaceState, BaseCommand, CommandResult } from '../types';
import type { RunOfShowItem } from '../../domain/runofshow/types';
import type { FundingSource } from '../../domain/funding/types';
import { applyDelay } from '../../domain/runofshow/delayCascade';

export function handleExecutionCommands(state: WorkspaceState, command: BaseCommand): CommandResult | null {
  const currentRunOfShow = state.runOfShow || [];
  const currentFunding = state.funding || [];

  switch (command.type) {
    case 'ADD_RUN_OF_SHOW_ITEM': {
      const item = command.payload as unknown as RunOfShowItem;
      const nextRunOfShow = [...currentRunOfShow, item];
      return {
        nextState: { ...state, runOfShow: nextRunOfShow },
        inverse: {
          type: 'DELETE_RUN_OF_SHOW_ITEM',
          eventId: command.eventId,
          payload: { id: item.id },
        },
        summary: `Added run-of-show item: ${item.title} at ${item.startTime}`,
      };
    }

    case 'UPDATE_RUN_OF_SHOW_ITEM': {
      const updated = command.payload as unknown as RunOfShowItem;
      const prev = currentRunOfShow.find(i => i.id === updated.id);
      if (!prev) return null;

      const nextRunOfShow = currentRunOfShow.map(i => (i.id === updated.id ? updated : i));
      return {
        nextState: { ...state, runOfShow: nextRunOfShow },
        inverse: {
          type: 'UPDATE_RUN_OF_SHOW_ITEM',
          eventId: command.eventId,
          payload: prev as unknown as Record<string, unknown>,
        },
        summary: `Updated run-of-show item: ${updated.title}`,
      };
    }

    case 'APPLY_RUN_OF_SHOW_DELAY': {
      const { itemId, delayMinutes } = command.payload as { itemId: string; delayMinutes: number };
      const prevItems = currentRunOfShow;
      const { updatedItems, conflicts } = applyDelay(currentRunOfShow, itemId, delayMinutes);

      const target = currentRunOfShow.find(i => i.id === itemId);
      const conflictMsg = conflicts.length > 0 ? ` (${conflicts.length} conflict(s) flagged)` : '';

      return {
        nextState: { ...state, runOfShow: updatedItems },
        inverse: {
          type: 'UPDATE_RUN_OF_SHOW_ITEM',
          eventId: command.eventId,
          payload: { items: prevItems } as unknown as Record<string, unknown>,
        },
        summary: `Delayed "${target?.title || itemId}" by ${delayMinutes} min${conflictMsg}`,
      };
    }

    case 'DELETE_RUN_OF_SHOW_ITEM': {
      const { id } = command.payload as { id: string };
      const prev = currentRunOfShow.find(i => i.id === id);
      if (!prev) return null;

      const nextRunOfShow = currentRunOfShow.filter(i => i.id !== id);
      return {
        nextState: { ...state, runOfShow: nextRunOfShow },
        inverse: {
          type: 'ADD_RUN_OF_SHOW_ITEM',
          eventId: command.eventId,
          payload: prev as unknown as Record<string, unknown>,
        },
        summary: `Deleted run-of-show item: ${prev.title}`,
      };
    }

    case 'ADD_FUNDING_SOURCE': {
      const source = command.payload as unknown as FundingSource;
      const nextFunding = [...currentFunding, source];
      return {
        nextState: { ...state, funding: nextFunding },
        inverse: {
          type: 'DELETE_FUNDING_SOURCE',
          eventId: command.eventId,
          payload: { id: source.id },
        },
        summary: `Added funding source: ${source.name} (${source.kind})`,
      };
    }

    case 'UPDATE_FUNDING_SOURCE': {
      const updated = command.payload as unknown as FundingSource;
      const prev = currentFunding.find(s => s.id === updated.id);
      if (!prev) return null;

      const nextFunding = currentFunding.map(s => (s.id === updated.id ? updated : s));
      return {
        nextState: { ...state, funding: nextFunding },
        inverse: {
          type: 'UPDATE_FUNDING_SOURCE',
          eventId: command.eventId,
          payload: prev as unknown as Record<string, unknown>,
        },
        summary: `Updated funding source: ${updated.name}`,
      };
    }

    case 'DELETE_FUNDING_SOURCE': {
      const { id } = command.payload as { id: string };
      const prev = currentFunding.find(s => s.id === id);
      if (!prev) return null;

      const nextFunding = currentFunding.filter(s => s.id !== id);
      return {
        nextState: { ...state, funding: nextFunding },
        inverse: {
          type: 'ADD_FUNDING_SOURCE',
          eventId: command.eventId,
          payload: prev as unknown as Record<string, unknown>,
        },
        summary: `Deleted funding source: ${prev.name}`,
      };
    }

    default:
      return null;
  }
}
