import { describe, expect, it } from 'vitest';
import { minor } from '../money/money';
import { computeFundingSummary } from './funding';
import type { FundingSource } from './types';

describe('Funding and Sponsorship Engine (DOMAIN-MODEL.md §5.12)', () => {
  it('computes confirmed and expected funding coverage accurately', () => {
    const projectedBudget = minor(100000000); // ₹10,00,000 (10 Lakhs in paise)

    const sources: FundingSource[] = [
      {
        id: 's1',
        name: 'Title Sponsor TechCorp',
        kind: 'sponsor',
        stage: 'received',
        amountPaise: minor(40000000), // ₹4,00,000 received
        isInKind: false,
      },
      {
        id: 's2',
        name: 'Co-Sponsor Retail India',
        kind: 'sponsor',
        stage: 'confirmed',
        amountPaise: minor(20000000), // ₹2,00,000 confirmed
        isInKind: false,
      },
      {
        id: 's3',
        name: 'City Cultural Grant',
        kind: 'grant',
        stage: 'verbal', // 60% probability
        amountPaise: minor(25000000), // ₹2,50,000 -> expected ₹1,50,000
        isInKind: false,
      },
      {
        id: 's4',
        name: 'Beverage Partner',
        kind: 'sponsor',
        stage: 'confirmed',
        amountPaise: minor(5000000), // ₹50,000 in-kind drinks
        isInKind: true, // In-kind excluded from cash
      },
      {
        id: 's5',
        name: 'Bank Partner',
        kind: 'sponsor',
        stage: 'declined',
        amountPaise: minor(10000000),
        isInKind: false,
      },
    ];

    const summary = computeFundingSummary(sources, projectedBudget);

    // Confirmed cash = 4,00,000 + 2,00,000 = ₹6,00,000 (60,000,000 paise)
    expect(summary.totalConfirmedPaise).toBe(60000000);
    expect(summary.totalReceivedPaise).toBe(40000000);
    expect(summary.totalInKindPaise).toBe(5000000);

    // Expected = 6,00,000 + (2,50,000 * 0.60 = 1,50,000) = ₹7,50,000 (75,000,000 paise)
    expect(summary.totalExpectedPaise).toBe(75000000);

    // Coverage ratios vs ₹10,00,000
    expect(summary.confirmedCoverageRatio).toBeCloseTo(0.6, 2);
    expect(summary.expectedCoverageRatio).toBeCloseTo(0.75, 2);

    // Funding gap = 10,00,000 - 7,50,000 = ₹2,50,000
    expect(summary.fundingGapPaise).toBe(25000000);
  });

  it('detects concentration risk when single source exceeds 50% of confirmed funds', () => {
    const projectedBudget = minor(50000000);

    const sources: FundingSource[] = [
      {
        id: 'mega',
        name: 'MegaCorp Sponsor',
        kind: 'sponsor',
        stage: 'confirmed',
        amountPaise: minor(35000000), // ₹3.5 Lakhs
        isInKind: false,
      },
      {
        id: 'mini',
        name: 'Local Cafe',
        kind: 'sponsor',
        stage: 'received',
        amountPaise: minor(5000000), // ₹50k
        isInKind: false,
      },
    ];

    // Total confirmed = 4.0 Lakhs. MegaCorp is 3.5 / 4.0 = 87.5% (> 50%)
    const summary = computeFundingSummary(sources, projectedBudget);
    expect(summary.isConcentrationRisk).toBe(true);
    expect(summary.concentratedSourceName).toBe('MegaCorp Sponsor');
  });
});
