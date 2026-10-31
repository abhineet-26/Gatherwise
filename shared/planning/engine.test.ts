import { describe, expect, it } from 'vitest';
import { generatePlan } from './engine';
import { weddingPack, birthdayPack, communityPack } from './packs';
import type { Event } from '../schemas';
import type { TemplatePack } from './types';
import { asIsoDate, addDays } from '../domain/time/dates';
import { inr } from '../domain/money/money';

const today = asIsoDate('2026-10-21');

function createTestEvent(type: 'wedding' | 'birthday' | 'community', daysOut: number): Event {
  return {
    id: 'test-evt',
    schemaVersion: 1,
    ownerId: 'demo',
    type,
    name: 'Test Event',
    date: addDays(today, daysOut),
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    city: 'Bhubaneswar',
    cityTier: 'tier2',
    venueStatus: 'shortlisting',
    setting: 'indoor',
    budgetTarget: inr(18_00_000),
    contingencyPct: 7,
    fundingMode: 'self_funded',
    attendanceModel: 'invite_list',
    audience: 'local',
    attendanceAssumptions: { pMaybe: 0.5, pPending: 0.8, bufferPct: 0.05 },
    style: { formality: 'semi_formal', vibe: [] },
    priorities: ['food', 'photography'],
    dietary: [],
    accessibilityNeeds: [],
    culturalNotes: '',
    sideLabels: { a: 'Side A', b: 'Side B' },
    createdAt: '2026-10-21T12:00:00Z',
    updatedAt: '2026-10-21T12:00:00Z',
  };
}

describe('Planning Engine & Template Packs', () => {
  it('generates a full wedding plan with 300 days lead time with no infeasible tasks', () => {
    const event = createTestEvent('wedding', 300);
    const plan = generatePlan(event, weddingPack, today);

    expect(plan.subEvents.length).toBeGreaterThanOrEqual(2);
    expect(plan.budgetLines.length).toBe(weddingPack.categories.length);
    expect(plan.tasks.length).toBeGreaterThan(15);
    expect(plan.infeasibleTasks.length).toBe(0);

    // Sum of budget lines equals spendable target
    const totalAllocated = plan.budgetLines.reduce((acc, b) => acc + b.estimate, 0);
    const expectedSpendable = inr(18_00_000) - inr(18_00_000) * 0.07;
    expect(totalAllocated).toBe(expectedSpendable);
  });

  it('compresses timeline when event is in 90 days', () => {
    const event = createTestEvent('wedding', 90);
    const plan = generatePlan(event, weddingPack, today);

    expect(plan.tasks.length).toBeGreaterThan(15);
    // Tasks should be scheduled within the 90-day window
    for (const t of plan.tasks) {
      expect(t.dueDate >= today).toBe(true);
      expect(t.dueDate <= event.date).toBe(true);
    }
  });

  it('flags infeasible tasks when event is in 45 days', () => {
    const event = createTestEvent('wedding', 45);
    const plan = generatePlan(event, weddingPack, today);

    // Tasks requiring minLeadDays > 45 (like booking venue 60 days) are infeasible
    expect(plan.infeasibleTasks.length).toBeGreaterThan(0);
    const venueTask = plan.infeasibleTasks.find(t => t.id === 'task_w-venue');
    expect(venueTask).toBeDefined();
  });

  it('generates birthday plan correctly', () => {
    const event = createTestEvent('birthday', 45);
    event.budgetTarget = inr(1_00_000);
    event.honoreeAge = 7;

    const plan = generatePlan(event, birthdayPack, today);
    expect(plan.tasks.some(t => t.id === 'task_b-cake')).toBe(true);
    expect(plan.tasks.some(t => t.id === 'task_b-activities')).toBe(true); // honoreeAge < 13
  });

  it('generates community plan correctly with sponsor tasks when sponsored', () => {
    const event = createTestEvent('community', 90);
    event.fundingMode = 'sponsored';

    const plan = generatePlan(event, communityPack, today);
    expect(plan.tasks.some(t => t.id === 'task_c-sponsor-deck')).toBe(true);
  });

  it('supports custom pack as pure data without altering the engine', () => {
    const customPack: TemplatePack = {
      id: 'community',
      segmentLabel: 'Session',
      presets: [{ id: 'hackathon', name: 'Hackathon', startingFunctions: ['Keynote', 'Hacking', 'Demos'] }],
      budgetProfiles: {
        standard: { cloud_credits: 50, swag_food: 50 },
        lean: { cloud_credits: 50, swag_food: 50 },
      },
      categories: [
        { id: 'cloud_credits', label: 'Cloud API Credits', scalesWithHeadcount: false },
        { id: 'swag_food', label: 'Swag & Pizza', scalesWithHeadcount: true },
      ],
      essentials: [{ category: 'cloud_credits', bookByDays: 14, weight: 2 }],
      tasks: [
        { id: 'h-sponsors', title: 'Confirm Cloud API API keys', priority: 'critical', leadDays: 20, minLeadDays: 5, category: 'cloud_credits' },
        { id: 'h-pizza', title: 'Order midnight pizzas', priority: 'high', leadDays: 7, minLeadDays: 2, category: 'swag_food' },
      ],
      vendorChecklists: {},
      riskRules: [],
      ideaLibrary: [],
      outlinePrompts: [],
    };

    const event = createTestEvent('community', 30);
    const plan = generatePlan(event, customPack, today);

    expect(plan.subEvents.length).toBe(3);
    expect(plan.budgetLines.length).toBe(2);
    expect(plan.tasks.length).toBe(2);
  });
});
