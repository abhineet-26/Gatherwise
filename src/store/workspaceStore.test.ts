import { describe, expect, it, beforeEach } from 'vitest';
import { useWorkspaceStore } from './workspaceStore';
import { InMemoryRepository } from 'shared/ports/inMemoryRepository';
import type { WorkspaceState } from 'shared/commands/types';
import { inr } from 'shared/domain/money/money';
import { asIsoDate } from 'shared/domain/time/dates';

describe('useWorkspaceStore', () => {
  const mockInitialWorkspace: WorkspaceState = {
    event: {
      id: 'evt-test-1',
      name: 'Test Event',
      type: 'wedding',
      city: 'Bengaluru',
      date: asIsoDate('2026-12-01'),
      budgetTarget: inr(1000000),
      budget: inr(1000000),
      guestCount: 200,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    subEvents: [],
    budgetLines: [],
    commitments: [],
    payments: [],
    tasks: [],
    vendors: [],
    quotes: [],
    guests: [],
    risks: [],
    activity: [],
  };

  beforeEach(async () => {
    const memoryRepo = new InMemoryRepository();
    useWorkspaceStore.getState().setRepository(memoryRepo);
    await useWorkspaceStore.getState().setWorkspace(mockInitialWorkspace);
  });

  it('dispatches a command and updates state + activity log', async () => {
    const { dispatch } = useWorkspaceStore.getState();

    const ok = await dispatch({
      type: 'ADD_TASK',
      eventId: 'evt-test-1',
      payload: {
        id: 'task-101',
        eventId: 'evt-test-1',
        title: 'Book Photographer',
        category: 'photography',
        status: 'todo',
        priority: 'high',
        dueDate: '2026-10-01',
        dependsOn: [],
      },
    });

    expect(ok).toBe(true);
    const updated = useWorkspaceStore.getState().workspace;
    expect(updated?.tasks.length).toBe(1);
    expect(updated?.tasks[0]?.title).toBe('Book Photographer');
    expect(updated?.activity.length).toBe(1);
    expect(useWorkspaceStore.getState().canUndo()).toBe(true);
  });

  it('undos a dispatched command', async () => {
    const { dispatch, undo } = useWorkspaceStore.getState();

    await dispatch({
      type: 'ADD_TASK',
      eventId: 'evt-test-1',
      payload: {
        id: 'task-102',
        eventId: 'evt-test-1',
        title: 'Cake Tasting',
        category: 'catering',
        status: 'todo',
        priority: 'medium',
        dueDate: '2026-10-15',
        dependsOn: [],
      },
    });

    expect(useWorkspaceStore.getState().workspace?.tasks.length).toBe(1);

    const undoOk = await undo();
    expect(undoOk).toBe(true);

    const afterUndo = useWorkspaceStore.getState().workspace;
    expect(afterUndo?.tasks.length).toBe(0);
    expect(useWorkspaceStore.getState().canUndo()).toBe(false);
  });
});
