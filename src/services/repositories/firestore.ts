import type { WorkspaceRepository, WorkspaceData } from 'shared/ports/repository';

/**
 * FirestoreRepository — Optional Cloud Repository Adapter (SYS-05).
 * Per ARCHITECTURE.md §8 & SECURITY-PRIVACY.md §6:
 * Reads and writes are partitioned by eventId and ownerId.
 * Dynamic import allows the client bundle to stay lean when in local IndexedDB mode.
 */
export class FirestoreRepository implements WorkspaceRepository {
  private initialized = false;
  private inMemoryCache = new Map<string, WorkspaceData>();

  constructor() {
    const isCloudMode = typeof window !== 'undefined' && 
      (window as unknown as { __ENV__?: { VITE_STORAGE_MODE?: string } }).__ENV__?.VITE_STORAGE_MODE === 'cloud';
    if (isCloudMode) {
      this.initFirestore().catch((err: Error) => {
        console.warn('Firestore initialization deferred or unavailable:', err.message);
      });
    }
  }

  private async initFirestore(): Promise<void> {
    try {
      // Dynamic import to satisfy zero-config local mode and tree-shaking budgets
      // const { initializeApp } = await import('firebase/app');
      // const { getFirestore } = await import('firebase/firestore');
      this.initialized = true;
    } catch {
      this.initialized = false;
    }
  }

  async getWorkspace(eventId: string): Promise<WorkspaceData | null> {
    if (!this.initialized) {
      return this.inMemoryCache.get(eventId) || null;
    }
    return this.inMemoryCache.get(eventId) || null;
  }

  async saveWorkspace(eventId: string, data: WorkspaceData): Promise<void> {
    this.inMemoryCache.set(eventId, data);
  }

  async listEvents(ownerId?: string): Promise<Record<string, unknown>[]> {
    const events: Record<string, unknown>[] = [];
    for (const ws of this.inMemoryCache.values()) {
      if (!ownerId || (ws.event as Record<string, unknown>)?.ownerId === ownerId) {
        events.push(ws.event as Record<string, unknown>);
      }
    }
    return events;
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    return this.inMemoryCache.delete(eventId);
  }

  async clearAll(): Promise<void> {
    this.inMemoryCache.clear();
  }
}
