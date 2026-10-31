import { type IsoDate, addDays, compareDates, daysBetween } from '../time/dates';

/**
 * Task scheduling: lead-time planning with compression, dependency ordering,
 * and display status. Pure functions; `today` is always injected.
 */
export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface TaskTemplate {
  id: string;
  title: string;
  priority: Priority;
  /** Ideal number of days before the event this task should be finished. */
  leadDays: number;
  /** Shortest realistic lead time. Below this the task is infeasible, not merely compressed. */
  minLeadDays: number;
  /** Ids of tasks that must be finished first. Ids not present in the plan are ignored. */
  dependsOn: readonly string[];
}

export type Feasibility = 'ok' | 'compressed' | 'infeasible';

export interface PlannedTask {
  id: string;
  dueDate: IsoDate;
  feasibility: Feasibility;
  /** True when the date was pushed later so it does not precede a prerequisite. */
  dependencyAdjusted: boolean;
  /** True when dependency ordering pushed the task past its latest allowed date. */
  dependencyConflict: boolean;
}

interface Node {
  id: string;
  dependsOn: readonly string[];
}

/** Returns a cycle such as ['a', 'b', 'a'], or null when the graph is acyclic. */
export function detectCycle(tasks: readonly Node[]): string[] | null {
  const byId = new Map(tasks.map((task) => [task.id, task] as const));
  const state = new Map<string, 1 | 2>(); // 1 = on the current path, 2 = fully explored
  const path: string[] = [];

  const visit = (id: string): string[] | null => {
    const seen = state.get(id);
    if (seen === 1) return [...path.slice(path.indexOf(id)), id];
    if (seen === 2) return null;
    state.set(id, 1);
    path.push(id);
    for (const dep of byId.get(id)?.dependsOn ?? []) {
      if (!byId.has(dep)) continue;
      const cycle = visit(dep);
      if (cycle) return cycle;
    }
    path.pop();
    state.set(id, 2);
    return null;
  };

  for (const task of tasks) {
    const cycle = visit(task.id);
    if (cycle) return cycle;
  }
  return null;
}

/** Prerequisites first; otherwise input order is preserved. Throws on a cycle. */
export function topologicalOrder<T extends Node>(tasks: readonly T[]): T[] {
  const cycle = detectCycle(tasks);
  if (cycle) throw new Error(`Task dependency cycle: ${cycle.join(' -> ')}`);
  const byId = new Map(tasks.map((task) => [task.id, task] as const));
  const done = new Set<string>();
  const ordered: T[] = [];
  const visit = (task: T): void => {
    if (done.has(task.id)) return;
    done.add(task.id);
    for (const dep of task.dependsOn) {
      const prerequisite = byId.get(dep);
      if (prerequisite) visit(prerequisite);
    }
    ordered.push(task);
  };
  tasks.forEach(visit);
  return ordered;
}

/**
 * Place every template on the calendar relative to the event date.
 *
 *  - Enough time left (leadDays <= daysToEvent): due = event - leadDays.
 *  - Not enough time but still feasible (minLeadDays <= daysToEvent < leadDays):
 *    the task is "compressed". Its position in the original timeline is scaled
 *    into the time that is left, and capped so it still finishes minLeadDays
 *    before the event.
 *  - daysToEvent < minLeadDays: "infeasible". Due today, flagged for the risk register.
 * Dependencies are enforced last: a task never lands before its prerequisites.
 */
export function planTaskDates(
  templates: readonly TaskTemplate[],
  ctx: { eventDate: IsoDate; today: IsoDate },
): PlannedTask[] {
  const horizon = Math.max(0, daysBetween(ctx.today, ctx.eventDate));
  const longestLead = Math.max(1, ...templates.map((t) => t.leadDays));
  const planned = new Map<string, PlannedTask>();

  for (const template of topologicalOrder(templates)) {
    let offsetFromToday: number;
    let feasibility: Feasibility;
    if (template.leadDays <= horizon) {
      offsetFromToday = horizon - template.leadDays;
      feasibility = 'ok';
    } else if (horizon < template.minLeadDays) {
      offsetFromToday = 0;
      feasibility = 'infeasible';
    } else {
      const scaled = Math.round(((longestLead - template.leadDays) * horizon) / longestLead);
      offsetFromToday = Math.min(scaled, horizon - template.minLeadDays);
      feasibility = 'compressed';
    }

    let dueDate = addDays(ctx.today, offsetFromToday);
    let dependencyAdjusted = false;
    for (const dep of template.dependsOn) {
      const prerequisite = planned.get(dep);
      if (prerequisite && compareDates(prerequisite.dueDate, dueDate) > 0) {
        dueDate = prerequisite.dueDate;
        dependencyAdjusted = true;
      }
    }
    const latestAllowed = addDays(ctx.eventDate, -template.minLeadDays);
    const dependencyConflict = dependencyAdjusted && compareDates(dueDate, latestAllowed) > 0;
    planned.set(template.id, {
      id: template.id,
      dueDate,
      feasibility: dependencyConflict ? 'infeasible' : feasibility,
      dependencyAdjusted,
      dependencyConflict,
    });
  }

  return templates.map((template) => {
    const result = planned.get(template.id);
    if (!result) throw new Error(`Internal error: task ${template.id} was not planned`);
    return result;
  });
}

export type StoredTaskStatus = 'todo' | 'in_progress' | 'done' | 'skipped';
export type DisplayStatus = 'completed' | 'skipped' | 'overdue' | 'due_soon' | 'upcoming';

/** Derived on every render from stored status + dates; never persisted. */
export function displayStatus(
  task: { status: StoredTaskStatus; dueDate: IsoDate },
  today: IsoDate,
  dueSoonDays = 3,
): DisplayStatus {
  if (task.status === 'done') return 'completed';
  if (task.status === 'skipped') return 'skipped';
  const daysLeft = daysBetween(today, task.dueDate);
  if (daysLeft < 0) return 'overdue';
  return daysLeft <= dueSoonDays ? 'due_soon' : 'upcoming';
}

/** A task is blocked while any prerequisite is neither done nor skipped. */
export function isBlocked(
  task: { dependsOn: readonly string[] },
  statusById: ReadonlyMap<string, StoredTaskStatus>,
): boolean {
  return task.dependsOn.some((id) => {
    const status = statusById.get(id);
    return status !== undefined && status !== 'done' && status !== 'skipped';
  });
}
