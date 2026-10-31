import { describe, expect, it } from 'vitest';
import { BENCHMARKS, getPerGuestBenchmark } from './benchmarks';

describe('Planning Benchmarks & Provenance', () => {
  it('every benchmark has non-empty sourceNote, valid reliability, and verified: false', () => {
    expect(BENCHMARKS.length).toBeGreaterThan(5);

    for (const b of BENCHMARKS) {
      expect(typeof b.sourceNote).toBe('string');
      expect(b.sourceNote.length).toBeGreaterThan(5);
      expect(['M', 'L'].includes(b.reliability)).toBe(true);
      expect(b.verified).toBe(false);
    }
  });

  it('retrieves metro per-guest benchmark for weddings', () => {
    const bench = getPerGuestBenchmark('wedding', 'tier1');
    expect(bench).not.toBeNull();
    expect(bench?.low).toBe(1000000); // 10,000 INR
    expect(bench?.high).toBe(1800000); // 18,000 INR
  });

  it('returns null when no benchmark exists for the city tier', () => {
    const bench = getPerGuestBenchmark('wedding', 'tier3');
    expect(bench).toBeNull();
  });
});
