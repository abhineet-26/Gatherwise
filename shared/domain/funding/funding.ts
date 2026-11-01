import type { Minor } from '../money/money';
import { minor } from '../money/money';
import type { FundingSource, StageWeights, FundingSummary } from './types';
import { DEFAULT_STAGE_WEIGHTS } from './types';

/**
 * Computes funding coverage and concentration metrics per DOMAIN-MODEL.md §5.12:
 * - confirmed = Σ amount where status ∈ {confirmed, received} (cash only)
 * - expected = Σ amount * stageWeight (cash only)
 * - coverage = confirmed ÷ projected spend
 * - expectedCoverage = expected ÷ projected spend
 * - Single source above 50% of confirmed funds raises concentration risk
 */
export function computeFundingSummary(
  sources: FundingSource[],
  projectedBudgetPaise: Minor,
  weights: StageWeights = DEFAULT_STAGE_WEIGHTS
): FundingSummary {
  let totalConfirmed = 0;
  let totalReceived = 0;
  let totalExpected = 0;
  let totalInKind = 0;

  for (const src of sources) {
    if (src.isInKind) {
      totalInKind += src.amountPaise;
      continue;
    }

    if (src.stage === 'received') {
      totalReceived += src.amountPaise;
      totalConfirmed += src.amountPaise;
      totalExpected += src.amountPaise;
    } else if (src.stage === 'confirmed') {
      totalConfirmed += src.amountPaise;
      totalExpected += src.amountPaise;
    } else if (src.stage === 'declined') {
      // 0 weight
    } else {
      const weight = weights[src.stage] ?? 0;
      totalExpected += Math.round(src.amountPaise * weight);
    }
  }

  // Check concentration risk: any single source > 50% of confirmed funds
  let isConcentrationRisk = false;
  let concentratedSourceName: string | undefined;

  if (totalConfirmed > 0) {
    for (const src of sources) {
      if (!src.isInKind && (src.stage === 'confirmed' || src.stage === 'received')) {
        const share = src.amountPaise / totalConfirmed;
        if (share > 0.5) {
          isConcentrationRisk = true;
          concentratedSourceName = src.name;
          break;
        }
      }
    }
  }

  const budget = Math.max(1, projectedBudgetPaise);
  const confirmedCoverageRatio = totalConfirmed / budget;
  const expectedCoverageRatio = totalExpected / budget;
  const fundingGapPaise = minor(Math.max(0, projectedBudgetPaise - totalExpected));

  return {
    totalConfirmedPaise: minor(totalConfirmed),
    totalReceivedPaise: minor(totalReceived),
    totalExpectedPaise: minor(totalExpected),
    totalInKindPaise: minor(totalInKind),
    projectedBudgetPaise,
    confirmedCoverageRatio,
    expectedCoverageRatio,
    isConcentrationRisk,
    concentratedSourceName,
    fundingGapPaise,
  };
}
