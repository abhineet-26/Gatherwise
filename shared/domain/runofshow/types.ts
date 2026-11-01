export type RunOfShowStatus = 'upcoming' | 'in_progress' | 'completed' | 'delayed';

export interface RunOfShowItem {
  id: string;
  subEventId: string;
  title: string;
  startTime: string; // "18:00" (HH:mm)
  durationMinutes: number; // e.g. 45
  endTime: string; // "18:45"
  bufferAfterMinutes: number; // e.g. 15 min buffer before next item
  isFixedTime: boolean; // e.g. Muhurat / Pheras cannot move
  owner: string; // e.g. "Panditji", "Anchor Amit"
  ownerPhone?: string;
  location?: string; // e.g. "Main Mandap", "Stage 2"
  status: RunOfShowStatus;
  notes?: string;
}

export interface RunOfShowConflict {
  type: 'fixed_time_breach' | 'overlap';
  itemId: string;
  conflictingItemId?: string;
  message: string;
  minutesLate?: number;
}

export interface DelayCascadeResult {
  updatedItems: RunOfShowItem[];
  conflicts: RunOfShowConflict[];
}
