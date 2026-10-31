import { describe, it, expect } from 'vitest';
import { checkCommitmentDrift } from './drift';
import { minor } from '../money/money';

describe('Commitment Drift (DOMAIN-MODEL.md §5.5)', () => {
  it('returns null for fixed-price commitments (fixed commitments never drift)', () => {
    const res = checkCommitmentDrift({
      commitmentId: 'com-fix',
      agreedAmountPaise: minor(200000),
      isPerHead: false,
    }, 350);

    expect(res).toBeNull();
  });

  it('raises warning when headcount drift exceeds 5%', () => {
    // Agreed at 300 guests for ₹4,50,000 (₹1,500/head)
    // Headcount moves to 340 (+13.3%)
    const res = checkCommitmentDrift({
      commitmentId: 'com-cat',
      vendorName: 'Royal Caterers',
      agreedAmountPaise: minor(45000000),
      headcountAtAcceptance: 300,
      isPerHead: true,
    }, 340);

    expect(res).not.toBeNull();
    expect(res!.hasWarning).toBe(true);
    expect(res!.projectedAmountPaise).toBe(minor(51000000));
    expect(res!.driftPaise).toBe(minor(6000000));
    expect(res!.message).toContain('At current plan of 340 guests, this will be ≈ ₹5,10,000');
  });

  it('reports zero drift when headcount matches accepted headcount', () => {
    const res = checkCommitmentDrift({
      commitmentId: 'com-cat',
      agreedAmountPaise: minor(450000),
      headcountAtAcceptance: 300,
      isPerHead: true,
    }, 300);

    expect(res).not.toBeNull();
    expect(res!.hasWarning).toBe(false);
    expect(res!.driftPaise).toBe(0);
  });
});
