import { describe, expect, it } from 'vitest';
import { evaluateAndMergeRisks } from './risks';
import type { RiskRule } from '../../planning/types';
import type { Risk, Event } from '../../schemas';
import { asIsoDate } from '../time/dates';
import { inr } from '../money/money';

describe('Risk Engine & Status Transitions', () => {
  const dummyEvent: Event = {
    id: 'e-1',
    schemaVersion: 1,
    ownerId: 'demo',
    type: 'wedding',
    name: 'Sample Event',
    date: asIsoDate('2026-11-20'),
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    city: 'Bhubaneswar',
    cityTier: 'tier2',
    venueStatus: 'shortlisting',
    setting: 'outdoor',
    budgetTarget: inr(10_00_000),
    contingencyPct: 7,
    fundingMode: 'self_funded',
    attendanceModel: 'invite_list',
    audience: 'local',
    attendanceAssumptions: { pMaybe: 0.5, pPending: 0.8, bufferPct: 0.05 },
    style: { formality: 'semi_formal', vibe: [] },
    priorities: [],
    dietary: [],
    accessibilityNeeds: [],
    culturalNotes: '',
    sideLabels: { a: 'A', b: 'B' },
    createdAt: '2026-10-21T12:00:00Z',
    updatedAt: '2026-10-21T12:00:00Z',
  };

  const sampleRule: RiskRule = {
    id: 'outdoor.rain',
    title: 'Outdoor venue without rain plan',
    severity: 'high',
    mitigation: 'Reserve waterproof canopy structure.',
    evaluate: ({ event }) => event.setting === 'outdoor',
  };

  it('detects and instantiates risk when triggered', () => {
    const risks = evaluateAndMergeRisks([sampleRule], [], {
      event: dummyEvent,
      tasks: [],
      budgetLines: [],
      daysToEvent: 30,
    });

    expect(risks.length).toBe(1);
    expect(risks[0]?.dedupeKey).toBe('outdoor.rain');
    expect(risks[0]?.status).toBe('open');
  });

  it('re-opens resolved risk if condition returns (INV per §5.9)', () => {
    const previouslyResolved: Risk = {
      id: 'risk_outdoor.rain',
      eventId: 'e-1',
      dedupeKey: 'outdoor.rain',
      title: 'Outdoor venue without rain plan',
      detail: 'Detail',
      severity: 'high',
      status: 'resolved',
      mitigation: 'Mitigation',
      source: 'rule',
      refs: [],
    };

    const risks = evaluateAndMergeRisks([sampleRule], [previouslyResolved], {
      event: dummyEvent, // setting is outdoor -> triggered!
      tasks: [],
      budgetLines: [],
      daysToEvent: 30,
    });

    expect(risks.length).toBe(1);
    expect(risks[0]?.status).toBe('open'); // Re-opened!
  });
});
