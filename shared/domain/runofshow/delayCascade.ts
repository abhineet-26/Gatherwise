import type { RunOfShowItem, RunOfShowConflict, DelayCascadeResult } from './types';

export function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const h = parseInt(parts[0] || '0', 10);
  const m = parseInt(parts[1] || '0', 10);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function computeEndTime(startTime: string, durationMinutes: number): string {
  const startMin = timeToMinutes(startTime);
  return minutesToTime(startMin + durationMinutes);
}

export function detectConflicts(items: RunOfShowItem[]): RunOfShowConflict[] {
  const conflicts: RunOfShowConflict[] = [];

  for (let i = 0; i < items.length; i++) {
    const a = items[i]!;
    const aStart = timeToMinutes(a.startTime);
    const aEnd = timeToMinutes(a.endTime);

    for (let j = i + 1; j < items.length; j++) {
      const b = items[j]!;
      if (a.subEventId !== b.subEventId) continue;

      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);

      // Check time overlap: aStart < bEnd && bStart < aEnd
      const overlaps = aStart < bEnd && bStart < aEnd;
      if (overlaps) {
        if (a.owner && b.owner && a.owner.toLowerCase() === b.owner.toLowerCase()) {
          conflicts.push({
            type: 'overlap',
            itemId: a.id,
            conflictingItemId: b.id,
            message: `Owner "${a.owner}" is scheduled for overlapping items: "${a.title}" and "${b.title}"`,
          });
        } else if (a.location && b.location && a.location.toLowerCase() === b.location.toLowerCase()) {
          conflicts.push({
            type: 'overlap',
            itemId: a.id,
            conflictingItemId: b.id,
            message: `Location "${a.location}" is double-booked for "${a.title}" and "${b.title}"`,
          });
        } else {
          conflicts.push({
            type: 'overlap',
            itemId: a.id,
            conflictingItemId: b.id,
            message: `Overlapping schedule between "${a.title}" and "${b.title}"`,
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Applies a delay cascade per DOMAIN-MODEL.md §5.11:
 * - Walks items of the same function in start order
 * - Moves target item by delayMin
 * - Propagates carried delay = max(0, carried - prev.bufferAfterMinutes)
 * - Fixed time items stop propagation and report breach conflict
 */
export function applyDelay(
  items: RunOfShowItem[],
  targetItemId: string,
  delayMin: number
): DelayCascadeResult {
  if (delayMin <= 0) {
    return {
      updatedItems: [...items],
      conflicts: detectConflicts(items),
    };
  }

  const target = items.find(it => it.id === targetItemId);
  if (!target) {
    return {
      updatedItems: [...items],
      conflicts: detectConflicts(items),
    };
  }

  // Clone items
  const cloned: RunOfShowItem[] = items.map(it => ({ ...it }));
  const conflicts: RunOfShowConflict[] = [];

  // Sort items of the same subEvent by start time
  const subEventItems = cloned
    .filter(it => it.subEventId === target.subEventId)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const targetIdx = subEventItems.findIndex(it => it.id === targetItemId);
  if (targetIdx === -1) {
    return { updatedItems: cloned, conflicts: detectConflicts(cloned) };
  }

  // Move the target item
  const targetItem = subEventItems[targetIdx]!;
  const newStartMin = timeToMinutes(targetItem.startTime) + delayMin;
  targetItem.startTime = minutesToTime(newStartMin);
  targetItem.endTime = computeEndTime(targetItem.startTime, targetItem.durationMinutes);
  targetItem.status = 'delayed';

  let carried = delayMin;

  // Propagate to following items
  for (let i = targetIdx + 1; i < subEventItems.length; i++) {
    const prev = subEventItems[i - 1]!;
    const curr = subEventItems[i]!;

    const carriedForward = Math.max(0, carried - (prev.bufferAfterMinutes || 0));
    if (carriedForward <= 0) {
      break;
    }

    if (curr.isFixedTime) {
      // Fixed time item cannot move
      conflicts.push({
        type: 'fixed_time_breach',
        itemId: curr.id,
        conflictingItemId: prev.id,
        minutesLate: carriedForward,
        message: `"${curr.title}" is fixed-time; delayed schedule arrives ${carriedForward} min late`,
      });
      break; // Stop propagation
    }

    // Move curr item
    const currStartMin = timeToMinutes(curr.startTime) + carriedForward;
    curr.startTime = minutesToTime(currStartMin);
    curr.endTime = computeEndTime(curr.startTime, curr.durationMinutes);
    curr.status = 'delayed';
    carried = carriedForward;
  }

  // Combine with overlap conflicts
  const allConflicts = [...conflicts, ...detectConflicts(cloned)];

  return {
    updatedItems: cloned,
    conflicts: allConflicts,
  };
}
