import type { WorkspaceState, BaseCommand, CommandResult } from '../types';
import type { Task, SubEvent } from '../../schemas';

export function handleTaskAndEventCommands(state: WorkspaceState, command: BaseCommand): CommandResult | null {
  const { type, payload } = command;

  switch (type) {
    case 'UPDATE_EVENT': {
      const prevEvent = { ...state.event };
      const nextEvent = { ...state.event, ...payload, updatedAt: new Date().toISOString() };
      return {
        nextState: { ...state, event: nextEvent },
        inverse: {
          type: 'UPDATE_EVENT',
          eventId: state.event.id,
          payload: prevEvent,
          meta: { summary: 'Undo event update' },
        },
        summary: `Updated event details`,
      };
    }

    case 'ADD_SUB_EVENT': {
      const subEvent = payload as unknown as SubEvent;
      return {
        nextState: { ...state, subEvents: [...state.subEvents, subEvent] },
        inverse: {
          type: 'DELETE_SUB_EVENT',
          eventId: state.event.id,
          payload: { id: subEvent.id },
          meta: { summary: `Undo add sub-event ${subEvent.name}` },
        },
        summary: `Added function ${subEvent.name}`,
      };
    }

    case 'DELETE_SUB_EVENT': {
      const id = payload['id'] as string;
      const existing = state.subEvents.find(s => s.id === id);
      if (!existing) return { nextState: state, inverse: null, summary: 'SubEvent not found' };
      return {
        nextState: { ...state, subEvents: state.subEvents.filter(s => s.id !== id) },
        inverse: {
          type: 'ADD_SUB_EVENT',
          eventId: state.event.id,
          payload: existing as unknown as Record<string, unknown>,
          meta: { summary: `Restore sub-event ${existing.name}` },
        },
        summary: `Deleted function ${existing.name}`,
      };
    }

    case 'ADD_TASK': {
      const task = payload as unknown as Task;
      return {
        nextState: { ...state, tasks: [...state.tasks, task] },
        inverse: {
          type: 'DELETE_TASK',
          eventId: state.event.id,
          payload: { id: task.id },
          meta: { summary: `Undo add task ${task.title}` },
        },
        summary: `Added task "${task.title}"`,
      };
    }

    case 'UPDATE_TASK': {
      const taskPayload = payload as { id: string } & Partial<Task>;
      const existing = state.tasks.find(t => t.id === taskPayload.id);
      if (!existing) return { nextState: state, inverse: null, summary: 'Task not found' };

      const updated = { ...existing, ...taskPayload };
      return {
        nextState: { ...state, tasks: state.tasks.map(t => (t.id === taskPayload.id ? updated : t)) },
        inverse: {
          type: 'UPDATE_TASK',
          eventId: state.event.id,
          payload: existing as unknown as Record<string, unknown>,
          meta: { summary: `Undo update task ${existing.title}` },
        },
        summary: `Updated task "${existing.title}"`,
      };
    }

    case 'COMPLETE_TASK': {
      const id = payload['id'] as string;
      const existing = state.tasks.find(t => t.id === id);
      if (!existing) return { nextState: state, inverse: null, summary: 'Task not found' };

      const prevStatus = existing.status;
      return {
        nextState: {
          ...state,
          tasks: state.tasks.map(t => (t.id === id ? { ...t, status: 'done' as const } : t)),
        },
        inverse: {
          type: 'UPDATE_TASK',
          eventId: state.event.id,
          payload: { id, status: prevStatus },
          meta: { summary: `Mark task "${existing.title}" as ${prevStatus}` },
        },
        summary: `Completed task "${existing.title}"`,
      };
    }

    case 'DELETE_TASK': {
      const id = payload['id'] as string;
      const existing = state.tasks.find(t => t.id === id);
      if (!existing) return { nextState: state, inverse: null, summary: 'Task not found' };

      return {
        nextState: {
          ...state,
          tasks: state.tasks
            .filter(t => t.id !== id)
            .map(t => ({ ...t, dependsOn: (t.dependsOn || []).filter(depId => depId !== id) })),
        },
        inverse: {
          type: 'ADD_TASK',
          eventId: state.event.id,
          payload: existing as unknown as Record<string, unknown>,
          meta: { summary: `Restore task "${existing.title}"` },
        },
        summary: `Deleted task "${existing.title}"`,
      };
    }

    default:
      return null;
  }
}
