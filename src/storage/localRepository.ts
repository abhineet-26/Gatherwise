import { openDB, type IDBPDatabase } from 'idb';
import type { WorkspaceRepository, WorkspaceData } from 'shared/ports/repository';

const DB_NAME = 'gatherwise-demo';
const DB_VERSION = 1;
const STORE_NAME = 'workspaces';

interface GatherWiseDB {
  workspaces: {
    key: string;
    value: WorkspaceData;
  };
}

export class LocalRepository implements WorkspaceRepository {
  private dbPromise: Promise<IDBPDatabase<GatherWiseDB>> | null = null;

  private async getDB(): Promise<IDBPDatabase<GatherWiseDB>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<GatherWiseDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        },
      });
    }
    return this.dbPromise;
  }

  async getWorkspace(eventId: string): Promise<WorkspaceData | null> {
    const db = await this.getDB();
    const data = await db.get(STORE_NAME, eventId);
    return data || null;
  }

  async saveWorkspace(eventId: string, data: WorkspaceData): Promise<void> {
    const db = await this.getDB();
    await db.put(STORE_NAME, data, eventId);
  }

  async listEvents(ownerId?: string): Promise<Record<string, unknown>[]> {
    const db = await this.getDB();
    const all = await db.getAll(STORE_NAME);
    const events = all.map(w => w.event).filter(Boolean);
    if (!ownerId) {
      return events;
    }
    return events.filter(e => e['ownerId'] === ownerId);
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    const db = await this.getDB();
    const existing = await db.get(STORE_NAME, eventId);
    if (!existing) return false;
    await db.delete(STORE_NAME, eventId);
    return true;
  }

  async clearAll(): Promise<void> {
    const db = await this.getDB();
    await db.clear(STORE_NAME);
  }
}
