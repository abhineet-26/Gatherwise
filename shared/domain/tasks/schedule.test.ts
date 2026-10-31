import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { addDays, asIsoDate, daysBetween } from '../time/dates';
import {
  type StoredTaskStatus,
  type TaskTemplate,
  detectCycle,
  displayStatus,
  isBlocked,
  planTaskDates,
  topologicalOrder,
} from './schedule';

const today = asIsoDate('2026-10-21');
const t = (id: string, leadDays: number, minLeadDays: number, dependsOn: string[] = []): TaskTemplate => ({
  id, title: id, priority: 'high', leadDays, minLeadDays, dependsOn,
});

describe('planTaskDates', () => {
  const templates = [t('venue', 270, 60), t('caterer', 180, 45), t('photographer', 150, 30), t('invitations', 60, 21), t('final-headcount', 7, 3)];

  it('keeps every task at its ideal lead time when there is plenty of time', () => {
    const eventDate = addDays(today, 300);
    const plan = planTaskDates(templates, { eventDate, today });
    expect(plan.map((p) => p.dueDate)).toEqual([
      addDays(eventDate, -270), addDays(eventDate, -180), addDays(eventDate, -150), addDays(eventDate, -60), addDays(eventDate, -7),
    ]);
    expect(plan.every((p) => p.feasibility === 'ok')).toBe(true);
  });

  it('compresses long-lead tasks into a 90-day runway and leaves short-lead tasks alone', () => {
    const plan = planTaskDates(templates, { eventDate: addDays(today, 90), today });
    const offsets = plan.map((p) => daysBetween(today, p.dueDate));
    expect(offsets).toEqual([0, 30, 40, 30, 83]);
    expect(plan.map((p) => p.feasibility)).toEqual(['compressed', 'compressed', 'compressed', 'ok', 'ok']);
  });

  it('marks tasks infeasible when the event is closer than their minimum lead time', () => {
    const plan = planTaskDates(templates, { eventDate: addDays(today, 20), today });
    // Venue (min 60), caterer (45), photographer (30) and invitations (21) all need more than 20 days.
    expect(plan.map((p) => p.feasibility)).toEqual(['infeasible', 'infeasible', 'infeasible', 'infeasible', 'ok']);
    expect(plan[0]).toMatchObject({ dueDate: today });
    // The final headcount call (7 days ahead) still fits.
    expect(plan[4]?.dueDate).toBe(addDays(today, 13));
  });

  it('never schedules a task before its prerequisite', () => {
    const plan = planTaskDates([t('book-venue', 100, 30), t('send-save-the-date', 120, 30, ['book-venue'])], {
      eventDate: addDays(today, 200), today,
    });
    const [venue, saveTheDate] = plan;
    expect(saveTheDate?.dueDate).toBe(venue?.dueDate);
    expect(saveTheDate?.dependencyAdjusted).toBe(true);
  });

  it('copes with an event today and ignores dependencies on tasks that are not in the plan', () => {
    const plan = planTaskDates([t('a', 10, 5, ['not-in-plan'])], { eventDate: today, today });
    expect(plan[0]).toMatchObject({ dueDate: today, feasibility: 'infeasible' });
  });

  it('places after-event tasks (negative lead) after the event date', () => {
    const eventDate = addDays(today, 90);
    const plan = planTaskDates([t('thank-you', -7, -30), t('reconcile', -14, -60, ['thank-you'])], { eventDate, today });
    expect(plan.map((p) => p.dueDate)).toEqual([addDays(eventDate, 7), addDays(eventDate, 14)]);
    expect(plan.every((p) => p.feasibility === 'ok')).toBe(true);
  });

  it('throws on dependency cycles', () => {
    expect(() => planTaskDates([t('a', 10, 1, ['b']), t('b', 10, 1, ['a'])], { eventDate: addDays(today, 30), today })).toThrow(/cycle/i);
  });

  it('always lands between today and the event (property)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 400 }),
        fc.array(fc.tuple(fc.integer({ min: 1, max: 365 }), fc.integer({ min: 0, max: 60 })), { minLength: 1, maxLength: 15 }),
        (daysToEvent, rows) => {
          const eventDate = addDays(today, daysToEvent);
          const plan = planTaskDates(rows.map(([lead, min], i) => t(`t${i}`, lead, Math.min(min, lead))), { eventDate, today });
          for (const task of plan) {
            expect(daysBetween(today, task.dueDate)).toBeGreaterThanOrEqual(0);
            expect(daysBetween(task.dueDate, eventDate)).toBeGreaterThanOrEqual(0);
          }
        },
      ),
    );
  });
});

describe('graph helpers', () => {
  it('reports the cycle path', () => {
    expect(detectCycle([t('a', 1, 0, ['b']), t('b', 1, 0, ['c']), t('c', 1, 0, ['a'])])).toEqual(['a', 'b', 'c', 'a']);
    expect(detectCycle([t('a', 1, 0), t('b', 1, 0, ['a'])])).toBeNull();
  });

  it('orders prerequisites first and otherwise keeps input order', () => {
    const ordered = topologicalOrder([t('c', 1, 0, ['a']), t('a', 1, 0), t('b', 1, 0)]);
    expect(ordered.map((x) => x.id)).toEqual(['a', 'c', 'b']);
  });
});

describe('displayStatus / isBlocked', () => {
  const at = (offset: number, status: StoredTaskStatus = 'todo') => ({ status, dueDate: addDays(today, offset) });

  it('derives status from stored status and dates', () => {
    expect(displayStatus(at(-1), today)).toBe('overdue');
    expect(displayStatus(at(0), today)).toBe('due_soon');
    expect(displayStatus(at(3), today)).toBe('due_soon');
    expect(displayStatus(at(4), today)).toBe('upcoming');
    expect(displayStatus(at(-9, 'done'), today)).toBe('completed');
    expect(displayStatus(at(-9, 'skipped'), today)).toBe('skipped');
  });

  it('treats a task as blocked until prerequisites are done or skipped', () => {
    const statuses = new Map<string, StoredTaskStatus>([['a', 'in_progress'], ['b', 'done'], ['c', 'skipped']]);
    expect(isBlocked({ dependsOn: ['a'] }, statuses)).toBe(true);
    expect(isBlocked({ dependsOn: ['b', 'c'] }, statuses)).toBe(false);
    expect(isBlocked({ dependsOn: [] }, statuses)).toBe(false);
  });
});
