import { describe, it, expect, vi } from 'vitest';
import { evaluateScenario, type ScenarioContext } from '../shared/domain/scenarios/scenario';
import { checkCommitmentDrift } from '../shared/domain/budget/drift';
import { fetchWeatherForecast } from '../server/integrations/openMeteo';
import { minor } from '../shared/domain/money/money';
import { asIsoDate } from '../shared/domain/time/dates';

function createScenarioContext(): ScenarioContext {
  return {
    event: {
      id: 'evt-test-p5',
      budgetTargetPaise: minor(2500000), // ₹25,00,000
      contingencyPct: 10,
      priorities: ['catering', 'decor'],
      plannedHeadcount: 300,
    },
    budgetLines: [
      { id: 'bl-cat', category: 'catering', name: 'Catering Banquet', estimatePaise: minor(900000), scalesWithHeadcount: true },
      { id: 'bl-dec', category: 'decor', name: 'Floral Mandap', estimatePaise: minor(400000), scalesWithHeadcount: false },
      { id: 'bl-mus', category: 'music', name: 'Live DJ Band', estimatePaise: minor(150000), scalesWithHeadcount: false },
    ],
    commitments: [
      { id: 'com-cat', budgetLineId: 'bl-cat', agreedAmountPaise: minor(900000), headcountAtAcceptance: 300, isPerHead: true, status: 'active' },
    ],
    payments: [],
    today: asIsoDate('2026-10-01'),
  };
}

describe('Phase 5: Intelligence & Differentiators', () => {
  describe('What-if Lab (BUD-07)', () => {
    it('scales headcount-sensitive lines and per-head commitments proportionally', () => {
      const ctx = createScenarioContext();
      // Scale from 300 to 360 guests (+20%)
      const res = evaluateScenario(ctx, { headcount: 360 });

      const catLine = res.adjustedLines.find(l => l.id === 'bl-cat')!;
      expect(catLine.scenarioEstimatePaise).toBe(minor(1080000));

      const decLine = res.adjustedLines.find(l => l.id === 'bl-dec')!;
      expect(decLine.scenarioEstimatePaise).toBe(minor(400000));

      expect(res.deltas.projectedPaise).toBe(minor(180000));
    });

    it('detects priority conflicts when priority categories are reduced by > 10%', () => {
      const ctx = createScenarioContext();
      // Reduce catering by 20%
      const res = evaluateScenario(ctx, {
        lineAdjustments: [{ budgetLineId: 'bl-cat', mode: 'percent', value: -20 }],
      });

      expect(res.priorityConflicts.length).toBe(1);
      expect(res.priorityConflicts[0]!.category).toBe('catering');
      expect(res.priorityConflicts[0]!.percentageDrop).toBe(20);
    });

    it('detects budget breach when scenario causes projected spend to exceed target', () => {
      const ctx = createScenarioContext();
      const res = evaluateScenario(ctx, {
        lineAdjustments: [{ budgetLineId: 'bl-dec', mode: 'set', value: minor(2400000) }],
      });

      expect(res.isBreached).toBe(true);
      expect(res.scenarioSummary.status).toBe('over');
    });

    it('drops disabled lines to 0', () => {
      const ctx = createScenarioContext();
      const res = evaluateScenario(ctx, { disabledLines: ['bl-mus'] });

      const musLine = res.adjustedLines.find(l => l.id === 'bl-mus')!;
      expect(musLine.scenarioEstimatePaise).toBe(0);
    });
  });

  describe('Commitment Drift (BUD-08)', () => {
    it('raises warning when per-head headcount drift exceeds 5%', () => {
      const drift = checkCommitmentDrift(
        {
          commitmentId: 'com-1',
          vendorName: 'Royal Caterers',
          agreedAmountPaise: minor(45000000),
          headcountAtAcceptance: 300,
          isPerHead: true,
        },
        340 // +13.3% drift
      );

      expect(drift).not.toBeNull();
      expect(drift!.hasWarning).toBe(true);
      expect(drift!.projectedAmountPaise).toBe(minor(51000000));
      expect(drift!.driftPaise).toBe(minor(6000000));
      expect(drift!.message).toContain('At current plan of 340 guests, this will be ≈ ₹5,10,000');
    });

    it('returns null for fixed-price commitments (fixed commitments never drift)', () => {
      const drift = checkCommitmentDrift(
        {
          commitmentId: 'com-fix',
          agreedAmountPaise: minor(200000),
          isPerHead: false,
        },
        400
      );

      expect(drift).toBeNull();
    });
  });

  describe('Weather Watch & J7 Journey Check (INT-03 & J7)', () => {
    it('J7: Rain on the parade — triggers rain advisory and contingency recommendation for outdoor venue', async () => {
      // Mock global fetch for Open-Meteo API
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          daily: {
            temperature_2m_max: [31.5],
            temperature_2m_min: [22.0],
            precipitation_sum: [8.5],
            precipitation_probability_max: [65],
            wind_speed_10m_max: [28.0],
          },
        }),
      } as any);

      // Event is 3 days ahead in Pune (outdoor lawn)
      const forecast = await fetchWeatherForecast('Pune', '2026-11-24', 'outdoor', '2026-11-21');

      expect(forecast.isWithinForecastWindow).toBe(true);
      expect(forecast.forecast?.precipitationProbabilityMax).toBe(65);
      expect(forecast.forecast?.precipitationSumMm).toBe(8.5);

      // J7 criteria: high rain alert generated recommending waterproof canopy and indoor backup
      expect(forecast.risks.length).toBeGreaterThan(0);
      const rainRisk = forecast.risks.find(r => r.type === 'rain');
      expect(rainRisk).toBeDefined();
      expect(rainRisk?.severity).toBe('high');
      expect(rainRisk?.message).toContain('waterproof lawn canopies and indoor backup');

      mockFetch.mockRestore();
    });

    it('returns seasonal climate profile and unlock date when event is outside 16-day forecast window', async () => {
      // Event is 45 days ahead in Pune
      const forecast = await fetchWeatherForecast('Pune', '2026-12-15', 'outdoor', '2026-11-01');

      expect(forecast.isWithinForecastWindow).toBe(false);
      expect(forecast.seasonalNote).toBeDefined();
      expect(forecast.forecastAvailableDate).toBe('2026-11-29'); // 16 days before event
    });
  });
});
