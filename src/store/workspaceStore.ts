import { create } from 'zustand';
import type { WorkspaceState, BaseCommand } from 'shared/commands/types';
import { reduceCommand } from 'shared/commands/reducer';
import type { WorkspaceRepository, WorkspaceData } from 'shared/ports/repository';
import { LocalRepository } from '../storage/localRepository';
import type { ActivityEntry } from 'shared/schemas/activity';

const defaultRepo: WorkspaceRepository = new LocalRepository();

interface UndoItem {
  inverse: BaseCommand;
  summary: string;
}

interface WorkspaceStore {
  workspace: WorkspaceState | null;
  isLoading: boolean;
  error: string | null;
  undoStack: UndoItem[];
  repository: WorkspaceRepository;

  setRepository: (repo: WorkspaceRepository) => void;
  loadWorkspace: (eventId: string) => Promise<boolean>;
  setWorkspace: (workspace: WorkspaceState) => Promise<void>;
  dispatch: (command: BaseCommand) => Promise<boolean>;
  undo: () => Promise<boolean>;
  canUndo: () => boolean;
  deleteWorkspace: (eventId: string) => Promise<boolean>;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspace: null,
  isLoading: false,
  error: null,
  undoStack: [],
  repository: defaultRepo,

  setRepository: (repo) => set({ repository: repo }),

  loadWorkspace: async (eventId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await get().repository.getWorkspace(eventId);
      if (!data) {
        set({ workspace: null, isLoading: false, undoStack: [] });
        return false;
      }

      const ws: WorkspaceState = {
        event: data.event as unknown as WorkspaceState['event'],
        subEvents: (data.subEvents || []) as unknown as WorkspaceState['subEvents'],
        budgetLines: (data.budgetLines || []) as unknown as WorkspaceState['budgetLines'],
        commitments: (data.commitments || []) as unknown as WorkspaceState['commitments'],
        payments: (data.payments || []) as unknown as WorkspaceState['payments'],
        tasks: (data.tasks || []) as unknown as WorkspaceState['tasks'],
        vendors: (data.vendors || []) as unknown as WorkspaceState['vendors'],
        quotes: (data.quotes || []) as unknown as WorkspaceState['quotes'],
        guests: (data.guests || []) as unknown as WorkspaceState['guests'],
        risks: (data.risks || []) as unknown as WorkspaceState['risks'],
        activity: (data.activity || []) as unknown as WorkspaceState['activity'],
      };

      set({ workspace: ws, isLoading: false, undoStack: [] });
      return true;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return false;
    }
  },

  setWorkspace: async (workspace: WorkspaceState) => {
    set({ workspace, undoStack: [] });
    await get().repository.saveWorkspace(workspace.event.id, workspace as unknown as WorkspaceData);
  },

  dispatch: async (command: BaseCommand) => {
    const current = get().workspace;
    if (!current) {
      set({ error: 'No active workspace to dispatch command to' });
      return false;
    }

    const prevWorkspace = current;
    const result = reduceCommand(current, command);

    // Create activity entry
    const nowIso = new Date().toISOString();
    const newActivity: ActivityEntry = {
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      eventId: current.event.id,
      at: nowIso,
      timestamp: nowIso,
      actor: command.meta?.actor || 'user',
      summary: result.summary,
      commandType: command.type,
      commandTypes: [command.type],
      undone: false,
      reversible: result.inverse !== null,
    };

    const nextStateWithActivity: WorkspaceState = {
      ...result.nextState,
      activity: [newActivity, ...result.nextState.activity].slice(0, 50),
    };

    // Optimistic state update
    set({
      workspace: nextStateWithActivity,
      undoStack: result.inverse
        ? [{ inverse: result.inverse, summary: result.summary }, ...get().undoStack].slice(0, 50)
        : get().undoStack,
    });

    // Commit to repository
    try {
      await get().repository.saveWorkspace(
        current.event.id,
        nextStateWithActivity as unknown as WorkspaceData
      );
      return true;
    } catch (err) {
      // Rollback on commit failure
      set({ workspace: prevWorkspace, error: (err as Error).message });
      return false;
    }
  },

  undo: async () => {
    const { undoStack, workspace, repository } = get();
    if (!workspace || undoStack.length === 0) return false;

    const [itemToUndo, ...remainingUndoStack] = undoStack;
    if (!itemToUndo) return false;

    const prevWorkspace = workspace;
    const result = reduceCommand(workspace, itemToUndo.inverse);

    const undoNowIso = new Date().toISOString();
    const undoActivity: ActivityEntry = {
      id: `act_${Date.now()}_undo`,
      eventId: workspace.event.id,
      at: undoNowIso,
      timestamp: undoNowIso,
      actor: 'user',
      summary: `Undid: ${itemToUndo.summary}`,
      commandType: itemToUndo.inverse.type,
      commandTypes: [itemToUndo.inverse.type],
      undone: false,
      reversible: false,
    };

    const nextStateWithActivity: WorkspaceState = {
      ...result.nextState,
      activity: [undoActivity, ...result.nextState.activity].slice(0, 50),
    };

    set({
      workspace: nextStateWithActivity,
      undoStack: remainingUndoStack,
    });

    try {
      await repository.saveWorkspace(
        workspace.event.id,
        nextStateWithActivity as unknown as WorkspaceData
      );
      return true;
    } catch (err) {
      set({ workspace: prevWorkspace, error: (err as Error).message });
      return false;
    }
  },

  canUndo: () => get().undoStack.length > 0,

  deleteWorkspace: async (eventId: string) => {
    const deleted = await get().repository.deleteEvent(eventId);
    if (get().workspace?.event.id === eventId) {
      set({ workspace: null, undoStack: [] });
    }
    return deleted;
  },
}));
