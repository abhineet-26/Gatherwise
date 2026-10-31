import { describe, it, expect } from 'vitest';
import { evaluateScenario, type ScenarioContext } from './scenario';
import { minor } from '../money/money';
import { asIsoDate } from '../time/dates';

function createScenarioContext(): ScenarioContext {
  return {
    event: {
      id: 'evt-scen-1',
      budgetTargetPaise: minor(2500000), // 25 Lakh
      contingencyPct: 10,
      priorities: ['catering', 'decor'],
      plannedHeadcount: 300,
    },
    budgetLines: [
      { id: 'bl-cat', category: 'catering', name: 'Catering Banquet', estimatePaise: minor(900000), scalesWithHeadcount: true },
      { id: 'bl-dec', category: 'decor', name: 'Floral Mandap', estimatePaise: minor(400000), scalesWithHeadcount: false },
      { id: 'bl-mus', category: 'music', name: 'Live Band', estimatePaise: minor(150000), scalesWithHeadcount: false },
    ],
    commitments: [
      { id: 'com-cat', budgetLineId: 'bl-cat', agreedAmountPaise: minor(900000), headcountAtAcceptance: 300, isPerHead: true, status: 'active' },
    ],
    payments: [],
    today: asIsoDate('2026-10-01'),
  };
}

describe('What-if Lab: evaluateScenario (DOMAIN-MODEL.md §5.10)', () => {
  it('scales headcount-sensitive lines proportionally when guest count changes', () => {
    const ctx = createScenarioContext();
    // Increase headcount from 300 to 360 (+20%)
    const result = evaluateScenario(ctx, { headcount: 360 });

    const cateringLine = result.adjustedLines.find(l => l.id === 'bl-cat')!;
    // 900,000 * (360/300) = 1,080,000
    expect(cateringLine.scenarioEstimatePaise).toBe(minor(1080000));

    // Decor does not scale with headcount
    const decorLine = result.adjustedLines.find(l => l.id === 'bl-dec')!;
    expect(decorLine.scenarioEstimatePaise).toBe(minor(400000));

    expect(result.deltas.projectedPaise).toBe(minor(180000));
  });

  it('detects priority conflicts when top priority categories are reduced by > 10%', () => {
    const ctx = createScenarioContext();
    // Reduce catering by 25% (catering is in priorities)
    const result = evaluateScenario(ctx, {
      lineAdjustments: [{ budgetLineId: 'bl-cat', mode: 'percent', value: -25 }],
    });

    expect(result.priorityConflicts.length).toBe(1);
    expect(result.priorityConflicts[0]!.category).toBe('catering');
    expect(result.priorityConflicts[0]!.percentageDrop).toBe(25);
  });

  it('drops disabled lines to 0', () => {
    const ctx = createScenarioContext();
    const result = evaluateScenario(ctx, { disabledLines: ['bl-mus'] });

    const musicLine = result.adjustedLines.find(l => l.id === 'bl-mus')!;
    expect(musicLine.scenarioEstimatePaise).toBe(0);
  });

  it('detects budget breach when scenario causes projected spend to exceed target', () => {
    const ctx = createScenarioContext();
    // Huge increase in decor (+₹20 Lakh)
    const result = evaluateScenario(ctx, {
      lineAdjustments: [{ budgetLineId: 'bl-dec', mode: 'set', value: minor(2500000) }],
    });

    expect(result.isBreached).toBe(true);
    expect(result.scenarioSummary.status).toBe('over');
  });

  it('applies per-head unit price overrides directly', () => {
    const ctx = createScenarioContext();
    // Override catering plate price to ₹2,000 per head at 300 pax -> ₹6,00,000
    const result = evaluateScenario(ctx, {
      perHeadOverrides: [{ budgetLineId: 'bl-cat', unitPricePaise: minor(2000) }],
    });

    const cateringLine = result.adjustedLines.find(l => l.id === 'bl-cat')!;
    expect(cateringLine.scenarioEstimatePaise).toBe(minor(600000));
  });
});
