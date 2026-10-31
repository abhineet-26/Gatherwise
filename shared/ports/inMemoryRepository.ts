import type { WorkspaceRepository, WorkspaceData } from './repository';

export class InMemoryRepository implements WorkspaceRepository {
  private readonly store = new Map<string, WorkspaceData>();

  async getWorkspace(eventId: string): Promise<WorkspaceData | null> {
    const data = this.store.get(eventId);
    if (!data) return null;
    return JSON.parse(JSON.stringify(data)) as WorkspaceData;
  }

  async saveWorkspace(eventId: string, data: WorkspaceData): Promise<void> {
    this.store.set(eventId, JSON.parse(JSON.stringify(data)) as WorkspaceData);
  }

  async listEvents(ownerId?: string): Promise<Record<string, unknown>[]> {
    const events: Record<string, unknown>[] = [];
    for (const workspace of this.store.values()) {
      const evt = workspace.event;
      if (!ownerId || evt['ownerId'] === ownerId) {
        events.push(JSON.parse(JSON.stringify(evt)) as Record<string, unknown>);
      }
    }
    return events;
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    return this.store.delete(eventId);
  }
}
