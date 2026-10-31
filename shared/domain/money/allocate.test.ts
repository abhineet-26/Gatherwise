import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { allocateByWeights, splitEvenly } from './allocate';
import { inr, minor, sum } from './money';

describe('allocateByWeights', () => {
  it('hands leftover paise to the largest remainders, deterministically', () => {
    expect(allocateByWeights(minor(100), [1, 1, 1])).toEqual([34, 33, 33]);
    expect(allocateByWeights(minor(100), [1, 1, 1])).toEqual([34, 33, 33]);
    expect(allocateByWeights(minor(10), [1, 2, 7])).toEqual([1, 2, 7]);
  });

  it('splits a wedding budget so the parts equal the whole exactly', () => {
    // Spendable = 93% of ₹18,00,000; weights from docs/BENCHMARKS.md (wedding profile).
    const spendable = inr(18_00_000 * 0.93);
    const weights = [22, 35, 11, 8, 6, 6, 2, 3, 3, 2, 2];
    const parts = allocateByWeights(spendable, weights);
    expect(sum(parts)).toBe(spendable);
    expect(parts[1]).toBeGreaterThan(parts[0] ?? 0); // catering > venue
  });

  it('gives zero-weight items zero and ignores them', () => {
    expect(allocateByWeights(minor(99), [0, 1, 1, 0])).toEqual([0, 50, 49, 0]);
  });

  it('handles negative totals symmetrically', () => {
    expect(allocateByWeights(minor(-100), [1, 1, 1])).toEqual([-34, -33, -33]);
  });

  it('rejects unusable weights', () => {
    expect(() => allocateByWeights(minor(10), [])).toThrow(RangeError);
    expect(() => allocateByWeights(minor(10), [0, 0])).toThrow(RangeError);
    expect(() => allocateByWeights(minor(10), [1, -1])).toThrow(RangeError);
    expect(() => allocateByWeights(minor(10), [Number.NaN])).toThrow(RangeError);
  });

  it('always sums to the total and stays within one paisa of the exact share (property)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000_000 }),
        fc.array(fc.double({ min: 0, max: 100, noNaN: true }), { minLength: 1, maxLength: 14 }),
        (total, weights) => {
          fc.pre(weights.some((w) => Math.round(w * 1e6) > 0));
          const parts = allocateByWeights(minor(total), weights);
          expect(sum(parts)).toBe(total);
          const weightSum = weights.reduce((a, b) => a + Math.round(b * 1e6), 0);
          parts.forEach((part, i) => {
            const exact = (total * Math.round((weights[i] ?? 0) * 1e6)) / weightSum;
            expect(part).toBeGreaterThanOrEqual(0);
            expect(Math.abs(part - exact)).toBeLessThan(1 + 1e-6 * Math.max(1, exact));
          });
        },
      ),
    );
  });
});

describe('splitEvenly', () => {
  it('splits instalments without losing a paisa', () => {
    expect(splitEvenly(minor(1000), 3)).toEqual([334, 333, 333]);
    expect(() => splitEvenly(minor(1000), 0)).toThrow(RangeError);
  });
});
