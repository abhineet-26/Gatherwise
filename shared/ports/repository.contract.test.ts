import { describe, expect, it, beforeEach } from 'vitest';
import { InMemoryRepository } from './inMemoryRepository';
import type { WorkspaceRepository, WorkspaceData } from './repository';

describe('WorkspaceRepository Contract Tests', () => {
  let repo: WorkspaceRepository;

  beforeEach(() => {
    repo = new InMemoryRepository();
  });

  it('saves and retrieves workspace data', async () => {
    const data: WorkspaceData = {
      event: { id: 'evt-1', name: 'Wedding of A & B', ownerId: 'demo' },
      tasks: [{ id: 'task-1', title: 'Book Venue' }],
      budgetLines: [{ id: 'b-1', category: 'venue', estimate: 1000000 }],
    };

    await repo.saveWorkspace('evt-1', data);
    const loaded = await repo.getWorkspace('evt-1');

    expect(loaded).toBeDefined();
    expect(loaded?.event['id']).toBe('evt-1');
    expect(loaded?.tasks?.length).toBe(1);
    expect(loaded?.budgetLines?.length).toBe(1);
  });

  it('returns null for non-existent workspace', async () => {
    const loaded = await repo.getWorkspace('does-not-exist');
    expect(loaded).toBeNull();
  });

  it('lists events filtered by ownerId', async () => {
    await repo.saveWorkspace('e-1', { event: { id: 'e-1', ownerId: 'user-1' } });
    await repo.saveWorkspace('e-2', { event: { id: 'e-2', ownerId: 'user-2' } });

    const all = await repo.listEvents();
    expect(all.length).toBe(2);

    const filtered = await repo.listEvents('user-1');
    expect(filtered.length).toBe(1);
    expect(filtered[0]?.['id']).toBe('e-1');
  });

  it('deletes an event workspace', async () => {
    await repo.saveWorkspace('e-1', { event: { id: 'e-1', ownerId: 'demo' } });
    const deleted = await repo.deleteEvent('e-1');
    expect(deleted).toBe(true);

    const loaded = await repo.getWorkspace('e-1');
    expect(loaded).toBeNull();
  });
});
