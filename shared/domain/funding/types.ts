import type { Minor } from '../money/money';

export type FundingStage = 'prospect' | 'pitched' | 'verbal' | 'confirmed' | 'received' | 'declined';
export type FundingKind = 'sponsor' | 'grant' | 'ticket_sales' | 'donation' | 'internal';

export interface SponsorDeliverable {
  id: string;
  title: string;
  dueDate?: string;
  isCompleted: boolean;
}

export interface FundingSource {
  id: string;
  name: string;
  kind: FundingKind;
  stage: FundingStage;
  amountPaise: Minor;
  isInKind: boolean;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  deliverables?: SponsorDeliverable[];
  notes?: string;
}

export interface StageWeights {
  prospect: number;
  pitched: number;
  verbal: number;
  confirmed: number;
  received: number;
  declined: number;
}

export const DEFAULT_STAGE_WEIGHTS: StageWeights = {
  prospect: 0.1,
  pitched: 0.25,
  verbal: 0.6,
  confirmed: 1.0,
  received: 1.0,
  declined: 0.0,
};

export interface FundingSummary {
  totalConfirmedPaise: Minor;
  totalReceivedPaise: Minor;
  totalExpectedPaise: Minor;
  totalInKindPaise: Minor;
  projectedBudgetPaise: Minor;
  confirmedCoverageRatio: number;
  expectedCoverageRatio: number;
  isConcentrationRisk: boolean;
  concentratedSourceName?: string;
  fundingGapPaise: Minor;
}
