import { type Minor, minor } from '../money/money';

export interface CommitmentDriftInput {
  commitmentId: string;
  vendorId?: string;
  vendorName?: string;
  agreedAmountPaise: Minor;
  headcountAtAcceptance?: number;
  isPerHead: boolean;
  unitPricePaise?: Minor;
}

export interface CommitmentDriftResult {
  commitmentId: string;
  vendorName: string;
  agreedHeadcount: number;
  currentHeadcount: number;
  agreedAmountPaise: Minor;
  projectedAmountPaise: Minor;
  driftPaise: number;
  driftPercentage: number;
  hasWarning: boolean; // |M - N| / N > 5%
  message: string;
}

/**
 * Calculates commitment drift when event headcount changes (DOMAIN-MODEL.md §5.5).
 * Only applies to per-head commitments. Fixed-price commitments never drift.
 */
export function checkCommitmentDrift(
  input: CommitmentDriftInput,
  currentHeadcount: number
): CommitmentDriftResult | null {
  if (!input.isPerHead || !input.headcountAtAcceptance || input.headcountAtAcceptance <= 0) {
    return null;
  }

  const N = input.headcountAtAcceptance;
  const M = Math.max(1, currentHeadcount);

  if (N === M) {
    return {
      commitmentId: input.commitmentId,
      vendorName: input.vendorName || 'Vendor',
      agreedHeadcount: N,
      currentHeadcount: M,
      agreedAmountPaise: input.agreedAmountPaise,
      projectedAmountPaise: input.agreedAmountPaise,
      driftPaise: 0,
      driftPercentage: 0,
      hasWarning: false,
      message: `Agreed at ${N} guests. Headcount unchanged.`,
    };
  }

  // Calculate projected amount based on per-head rate
  const unitRate = input.unitPricePaise !== undefined
    ? Number(input.unitPricePaise)
    : Number(input.agreedAmountPaise) / N;

  const projectedPaise = minor(Math.round(unitRate * M));
  const driftPaise = projectedPaise - input.agreedAmountPaise;
  const driftRatio = Math.abs(M - N) / N;
  const driftPercentage = Math.round(driftRatio * 100);
  const hasWarning = driftRatio > 0.05;

  const sign = driftPaise > 0 ? '+' : '';
  const diffStr = (Math.abs(driftPaise) / 100).toLocaleString('en-IN');
  const message = `Agreed at ${N} guests (₹${(input.agreedAmountPaise / 100).toLocaleString('en-IN')}). At current plan of ${M} guests, this will be ≈ ₹${(projectedPaise / 100).toLocaleString('en-IN')} (${sign}₹${diffStr}, ${M > N ? '+' : '-'}${driftPercentage}%).`;

  return {
    commitmentId: input.commitmentId,
    vendorName: input.vendorName || 'Vendor',
    agreedHeadcount: N,
    currentHeadcount: M,
    agreedAmountPaise: input.agreedAmountPaise,
    projectedAmountPaise: projectedPaise,
    driftPaise,
    driftPercentage,
    hasWarning,
    message,
  };
}
