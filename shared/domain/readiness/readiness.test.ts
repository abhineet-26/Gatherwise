import { describe, expect, it } from 'vitest';
import { computeReadiness } from './readiness';
import { inr } from '../money/money';
import { asIsoDate, addDays } from '../time/dates';
import type { Task } from '../../schemas';

const today = asIsoDate('2026-10-21');
const eventDate = addDays(today, 60);

describe('Readiness Score & 5 Dimensions', () => {
  it('computes 0-100 score with 5 dimensions summing to 100 max points', () => {
    const tasks: Task[] = [
      {
        id: 't-1',
        eventId: 'evt-1',
        title: 'Book Caterer',
        category: 'catering',
        priority: 'critical',
        dueDate: addDays(today, 10),
        dueDateLocked: false,
        status: 'todo',
        dependsOn: [],
        effort: 'M',
        origin: { kind: 'template' },
        notes: '',
      },
    ];

    const result = computeReadiness({
      eventDate,
      today,
      budgetTarget: inr(10_00_000),
      contingencyPct: 7,
      tasks,
      essentials: [{ category: 'venue', bookByDays: 90, weight: 2 }],
      budgetLines: [],
      commitments: [],
      payments: [],
      guests: [],
      risks: [],
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.expected).toBeGreaterThanOrEqual(0);
    expect(result.expected).toBeLessThanOrEqual(100);
    expect(result.dimensions.length).toBe(5);

    const totalMax = result.dimensions.reduce((acc, d) => acc + d.maxPoints, 0);
    expect(totalMax).toBe(100);
  });

  it('completing a task never lowers the readiness score', () => {
    const task: Task = {
      id: 't-1',
      eventId: 'evt-1',
      title: 'Book Venue',
      category: 'venue',
      priority: 'critical',
      dueDate: addDays(today, 5),
      dueDateLocked: false,
      status: 'todo',
      dependsOn: [],
      effort: 'M',
      origin: { kind: 'template' },
      notes: '',
    };

    const initial = computeReadiness({
      eventDate,
      today,
      budgetTarget: inr(10_00_000),
      contingencyPct: 7,
      tasks: [task],
      essentials: [],
      budgetLines: [],
      commitments: [],
      payments: [],
      guests: [],
      risks: [],
    });

    const completed = computeReadiness({
      eventDate,
      today,
      budgetTarget: inr(10_00_000),
      contingencyPct: 7,
      tasks: [{ ...task, status: 'done' }],
      essentials: [],
      budgetLines: [],
      commitments: [],
      payments: [],
      guests: [],
      risks: [],
    });

    expect(completed.score).toBeGreaterThanOrEqual(initial.score);
  });
});
