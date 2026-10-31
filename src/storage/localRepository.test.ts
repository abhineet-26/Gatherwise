import { describe, expect, it, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { LocalRepository } from './localRepository';
import type { WorkspaceData } from 'shared/ports/repository';

describe('LocalRepository (IndexedDB)', () => {
  let repo: LocalRepository;

  beforeEach(async () => {
    repo = new LocalRepository();
    await repo.clearAll();
  });

  it('saves and retrieves workspace data', async () => {
    const data: WorkspaceData = {
      event: { id: 'evt-indexed-1', name: 'Wedding of Ananya & Arjun', ownerId: 'demo' },
      tasks: [{ id: 'task-1', title: 'Confirm Venue' }],
      budgetLines: [{ id: 'b-1', category: 'venue', estimate: 120000000 }],
    };

    await repo.saveWorkspace('evt-indexed-1', data);
    const loaded = await repo.getWorkspace('evt-indexed-1');

    expect(loaded).toBeDefined();
    expect(loaded?.event['id']).toBe('evt-indexed-1');
    expect(loaded?.tasks?.length).toBe(1);
    expect(loaded?.budgetLines?.length).toBe(1);
  });

  it('returns null for non-existent workspace', async () => {
    const loaded = await repo.getWorkspace('non-existent');
    expect(loaded).toBeNull();
  });

  it('lists events correctly and filters by owner', async () => {
    await repo.saveWorkspace('evt-1', { event: { id: 'evt-1', ownerId: 'demo' } });
    await repo.saveWorkspace('evt-2', { event: { id: 'evt-2', ownerId: 'other' } });

    const all = await repo.listEvents();
    expect(all.length).toBe(2);

    const demoEvents = await repo.listEvents('demo');
    expect(demoEvents.length).toBe(1);
    expect(demoEvents[0]?.['id']).toBe('evt-1');
  });

  it('deletes an event workspace cleanly', async () => {
    await repo.saveWorkspace('evt-1', { event: { id: 'evt-1', ownerId: 'demo' } });
    const deleted = await repo.deleteEvent('evt-1');
    expect(deleted).toBe(true);

    const loaded = await repo.getWorkspace('evt-1');
    expect(loaded).toBeNull();

    const deleteAgain = await repo.deleteEvent('evt-1');
    expect(deleteAgain).toBe(false);
  });
});
