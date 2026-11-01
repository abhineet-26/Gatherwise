export interface WorkspaceData {
  event: Record<string, unknown>;
  subEvents?: Record<string, unknown>[];
  budgetLines?: Record<string, unknown>[];
  commitments?: Record<string, unknown>[];
  payments?: Record<string, unknown>[];
  tasks?: Record<string, unknown>[];
  vendors?: Record<string, unknown>[];
  quotes?: Record<string, unknown>[];
  guests?: Record<string, unknown>[];
  risks?: Record<string, unknown>[];
  activity?: Record<string, unknown>[];
  runOfShow?: Record<string, unknown>[];
  funding?: Record<string, unknown>[];
}

export interface WorkspaceRepository {
  getWorkspace(eventId: string): Promise<WorkspaceData | null>;
  saveWorkspace(eventId: string, data: WorkspaceData): Promise<void>;
  listEvents(ownerId?: string): Promise<Record<string, unknown>[]>;
  deleteEvent(eventId: string): Promise<boolean>;
}
