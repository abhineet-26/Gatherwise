import { type Minor, minor, percentOf, sum } from '../money/money';
import { type IsoDate, addDays, compareDates } from '../time/dates';

/**
 * Budget identity (all values in minor units; see docs/DOMAIN-MODEL.md §5):
 *
 *   committed(line)   = Σ active commitments (accepted quotes / agreed prices, tax-inclusive)
 *   paid(line)        = Σ paid payments − Σ paid refunds
 *   outstanding(line) = max(0, committed − paid)           (only when a commitment exists)
 *   projected(line)   = commitment ? max(committed, paid) : max(estimate, paid)
 *
 * A deposit or instalment is a PAYMENT against a commitment. It reduces what is
 * outstanding but never adds to what is committed, so nothing is counted twice.
 */
export interface BudgetLineInput {
  id: string;
  category: string;
  /** Planning estimate ("likely" case). Replaced by a commitment once a quote is accepted. */
  estimate: Minor;
}

export interface CommitmentInput {
  id: string;
  budgetLineId: string;
  /** Tax-inclusive amount payable (use normalizeQuote().payableLikely for quotes). */
  amount: Minor;
  status: 'active' | 'cancelled';
}

export type PaymentKind = 'deposit' | 'installment' | 'final' | 'expense' | 'refund';

export interface PaymentInput {
  id: string;
  budgetLineId: string;
  commitmentId?: string;
  kind: PaymentKind;
  /** Always positive; a refund reduces `paid`. */
  amount: Minor;
  status: 'planned' | 'paid' | 'cancelled';
  dueDate?: IsoDate;
  paidDate?: IsoDate;
}

export interface BudgetInput {
  target: Minor;
  /** Share of the target held back as contingency, 0-50 (percent, up to two decimals). */
  contingencyPct: number;
  lines: readonly BudgetLineInput[];
  commitments: readonly CommitmentInput[];
  payments: readonly PaymentInput[];
  today: IsoDate;
  /** Payments due within this many days (inclusive of today) count as "due soon". Default 7. */
  dueSoonDays?: number;
}

export type LineBasis = 'commitment' | 'estimate' | 'actual';

export interface LineSummary {
  lineId: string;
  estimate: Minor;
  committed: Minor;
  paid: Minor;
  outstanding: Minor;
  projected: Minor;
  basis: LineBasis;
  overpaid: boolean;
}

export type BudgetIssueCode =
  | 'unknown_line'
  | 'overpayment'
  | 'paid_against_cancelled_commitment'
  | 'invalid_contingency';

export interface BudgetIssue {
  code: BudgetIssueCode;
  refId: string;
}

export type BudgetStatus = 'healthy' | 'tight' | 'over';

export interface BudgetSummary {
  target: Minor;
  contingencyReserve: Minor;
  /** target − contingencyReserve: what the plan may spend before it starts eating the reserve. */
  spendable: Minor;
  totals: {
    estimated: Minor;
    committed: Minor;
    paid: Minor;
    outstanding: Minor;
    projected: Minor;
  };
  /** target − projected. Negative means the plan is over budget. */
  remainingToTarget: Minor;
  contingencyUsed: Minor;
  contingencyRemaining: Minor;
  status: BudgetStatus;
  lines: LineSummary[];
  overduePayments: PaymentInput[];
  dueSoonPayments: PaymentInput[];
  issues: BudgetIssue[];
}

function addTo(map: Map<string, number>, key: string, value: number): void {
  map.set(key, (map.get(key) ?? 0) + value);
}

export function computeBudgetSummary(input: BudgetInput): BudgetSummary {
  const issues: BudgetIssue[] = [];
  const contingencyPct = Number.isFinite(input.contingencyPct) ? input.contingencyPct : 0;
  if (contingencyPct < 0 || contingencyPct > 50 || contingencyPct !== input.contingencyPct) {
    issues.push({ code: 'invalid_contingency', refId: 'contingencyPct' });
  }
  const safePct = Math.min(50, Math.max(0, contingencyPct));

  const lineIds = new Set(input.lines.map((line) => line.id));
  const committedByLine = new Map<string, number>();
  const paidByLine = new Map<string, number>();
  const commitmentStatus = new Map(input.commitments.map((c) => [c.id, c.status] as const));

  for (const commitment of input.commitments) {
    if (!lineIds.has(commitment.budgetLineId)) {
      issues.push({ code: 'unknown_line', refId: commitment.id });
    } else if (commitment.status === 'active') {
      addTo(committedByLine, commitment.budgetLineId, commitment.amount);
    }
  }

  for (const payment of input.payments) {
    if (!lineIds.has(payment.budgetLineId)) {
      issues.push({ code: 'unknown_line', refId: payment.id });
      continue;
    }
    if (payment.status !== 'paid') continue;
    addTo(paidByLine, payment.budgetLineId, payment.kind === 'refund' ? -payment.amount : payment.amount);
    if (payment.commitmentId && commitmentStatus.get(payment.commitmentId) === 'cancelled') {
      issues.push({ code: 'paid_against_cancelled_commitment', refId: payment.id });
    }
  }

  const lines: LineSummary[] = input.lines.map((line) => {
    const committed = committedByLine.get(line.id) ?? 0;
    const paid = paidByLine.get(line.id) ?? 0;
    const hasCommitment = committed > 0;
    const projected = hasCommitment ? Math.max(committed, paid) : Math.max(line.estimate, paid);
    const overpaid = hasCommitment && paid > committed;
    if (overpaid) issues.push({ code: 'overpayment', refId: line.id });
    return {
      lineId: line.id,
      estimate: line.estimate,
      committed: minor(committed),
      paid: minor(paid),
      outstanding: minor(hasCommitment ? Math.max(0, committed - paid) : 0),
      projected: minor(projected),
      basis: hasCommitment ? 'commitment' : paid > line.estimate ? 'actual' : 'estimate',
      overpaid,
    };
  });

  const totals = {
    estimated: sum(lines.map((l) => l.estimate)),
    committed: sum(lines.map((l) => l.committed)),
    paid: sum(lines.map((l) => l.paid)),
    outstanding: sum(lines.map((l) => l.outstanding)),
    projected: sum(lines.map((l) => l.projected)),
  };

  const contingencyReserve = percentOf(input.target, safePct);
  const spendable = minor(input.target - contingencyReserve);
  const contingencyUsed = minor(Math.min(contingencyReserve, Math.max(0, totals.projected - spendable)));
  const status: BudgetStatus =
    totals.projected > input.target ? 'over' : totals.projected > spendable ? 'tight' : 'healthy';

  const dueSoonUntil = addDays(input.today, input.dueSoonDays ?? 7);
  const planned = input.payments.filter((p) => p.status === 'planned' && p.dueDate !== undefined);
  const overduePayments = planned.filter((p) => compareDates(p.dueDate as IsoDate, input.today) < 0);
  const dueSoonPayments = planned.filter((p) => {
    const due = p.dueDate as IsoDate;
    return compareDates(due, input.today) >= 0 && compareDates(due, dueSoonUntil) <= 0;
  });

  return {
    target: input.target,
    contingencyReserve,
    spendable,
    totals,
    remainingToTarget: minor(input.target - totals.projected),
    contingencyUsed,
    contingencyRemaining: minor(contingencyReserve - contingencyUsed),
    status,
    lines,
    overduePayments,
    dueSoonPayments,
    issues,
  };
}

