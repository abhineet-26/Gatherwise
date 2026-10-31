import { type Minor, minor } from './money';

/**
 * Split `total` across `weights` so the parts sum to EXACTLY `total`.
 *
 * Largest-remainder (Hamilton) method on exact BigInt arithmetic: every part is
 * floored, then the leftover minor units go to the parts with the largest
 * fractional remainders (ties: lower index first, so the result is deterministic).
 * Weights may be any non-negative numbers (percentages, headcounts, ratios).
 */
export function allocateByWeights(total: Minor, weights: readonly number[]): Minor[] {
  if (weights.length === 0) throw new RangeError('At least one weight is required');
  const scaled = weights.map((weight) => {
    if (!Number.isFinite(weight) || weight < 0) {
      throw new RangeError(`Weights must be finite and non-negative, got ${weight}`);
    }
    return BigInt(Math.round(weight * 1_000_000));
  });
  const weightSum = scaled.reduce((acc, weight) => acc + weight, 0n);
  if (weightSum <= 0n) throw new RangeError('Weights must sum to more than zero');

  const sign = total < 0 ? -1n : 1n;
  const magnitude = BigInt(Math.abs(total));
  const shares = scaled.map((weight, index) => {
    const product = magnitude * weight;
    return { index, floor: product / weightSum, remainder: product % weightSum };
  });

  const leftover = magnitude - shares.reduce((acc, share) => acc + share.floor, 0n);
  const byRemainder = [...shares].sort((a, b) =>
    a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1,
  );
  const gainsOne = new Set(byRemainder.slice(0, Number(leftover)).map((share) => share.index));

  return shares.map((share) => minor(Number(sign * (share.floor + (gainsOne.has(share.index) ? 1n : 0n)))));
}

/** Convenience: split evenly into `parts` (e.g. instalments). */
export function splitEvenly(total: Minor, parts: number): Minor[] {
  if (!Number.isInteger(parts) || parts < 1) throw new RangeError('parts must be a positive integer');
  return allocateByWeights(total, Array.from({ length: parts }, () => 1));
}
