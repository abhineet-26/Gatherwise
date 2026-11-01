import { create } from 'zustand';
import { type IsoDate, asIsoDate } from 'shared/domain/time/dates';

export type WorkspaceTab = 
  | 'overview' 
  | 'timeline' 
  | 'budget' 
  | 'vendors' 
  | 'guests' 
  | 'ideas' 
  | 'what-if'
  | 'runofshow'
  | 'funding'
  | 'activity' 
  | 'settings';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface UiState {
  currentEventId: string | null;
  activeTab: WorkspaceTab;
  timeTravelOffsetDays: number;
  timeTravelOverrideDate: string | null;
  isDemoMode: boolean;
  toasts: ToastMessage[];

  setCurrentEventId: (id: string | null) => void;
  setActiveTab: (tab: WorkspaceTab) => void;
  setTimeTravelOffsetDays: (offset: number) => void;
  setTimeTravelOverrideDate: (date: string | null) => void;
  resetTimeTravel: () => void;
  getEffectiveToday: () => IsoDate;
  addToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  currentEventId: null,
  activeTab: 'overview',
  timeTravelOffsetDays: 0,
  timeTravelOverrideDate: null,
  isDemoMode: true,
  toasts: [],

  setCurrentEventId: (id) => set({ currentEventId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setTimeTravelOffsetDays: (offset) => set({ timeTravelOffsetDays: offset, timeTravelOverrideDate: null }),
  setTimeTravelOverrideDate: (date) => set({ timeTravelOverrideDate: date }),
  resetTimeTravel: () => set({ timeTravelOffsetDays: 0, timeTravelOverrideDate: null }),

  getEffectiveToday: () => {
    const { timeTravelOverrideDate, timeTravelOffsetDays } = get();
    if (timeTravelOverrideDate) return asIsoDate(timeTravelOverrideDate);

    const now = new Date();
    if (timeTravelOffsetDays !== 0) {
      now.setDate(now.getDate() + timeTravelOffsetDays);
    }
    return asIsoDate(now.toISOString().slice(0, 10));
  },

  addToast: (message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
