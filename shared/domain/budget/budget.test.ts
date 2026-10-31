import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { inr, minor } from '../money/money';
import { asIsoDate } from '../time/dates';
import {
  type BudgetInput,
  type CommitmentInput,
  type PaymentInput,
  computeBudgetSummary,
} from './budget';

const today = asIsoDate('2026-10-21');
const base: BudgetInput = {
  target: inr(10_00_000),
  contingencyPct: 7,
  lines: [],
  commitments: [],
  payments: [],
  today,
};
const line = (id: string, estimate: number) => ({ id, category: id, estimate: inr(estimate) });
const commitment = (id: string, lineId: string, amount: number, status: CommitmentInput['status'] = 'active'): CommitmentInput => ({
  id, budgetLineId: lineId, amount: inr(amount), status,
});
const payment = (p: Partial<PaymentInput> & Pick<PaymentInput, 'id' | 'budgetLineId' | 'amount'>): PaymentInput => ({
  kind: 'installment', status: 'paid', ...p,
});

describe('computeBudgetSummary', () => {
  it('does not double count deposits and instalments against a commitment', () => {
    const s = computeBudgetSummary({
      ...base,
      lines: [line('catering', 5_00_000)],
      commitments: [commitment('c1', 'catering', 4_20_000)],
      payments: [
        payment({ id: 'p1', budgetLineId: 'catering', commitmentId: 'c1', kind: 'deposit', amount: inr(1_00_000) }),
        payment({ id: 'p2', budgetLineId: 'catering', commitmentId: 'c1', amount: inr(1_00_000), status: 'planned', dueDate: asIsoDate('2026-11-01') }),
      ],
    });
    const [l] = s.lines;
    expect(l).toMatchObject({ committed: inr(4_20_000), paid: inr(1_00_000), outstanding: inr(3_20_000), projected: inr(4_20_000), basis: 'commitment' });
    expect(s.totals.projected).toBe(inr(4_20_000));
  });

  it('plans with the estimate until something is committed, owes nothing yet', () => {
    const s = computeBudgetSummary({ ...base, lines: [line('decor', 1_50_000)] });
    expect(s.lines[0]).toMatchObject({ projected: inr(1_50_000), outstanding: 0, basis: 'estimate' });
  });

  it('lets real spend overrule a low estimate when there is no quote (cash expense)', () => {
    const s = computeBudgetSummary({
      ...base,
      lines: [line('misc', 20_000)],
      payments: [payment({ id: 'p1', budgetLineId: 'misc', kind: 'expense', amount: inr(35_000) })],
    });
    expect(s.lines[0]).toMatchObject({ projected: inr(35_000), basis: 'actual', outstanding: 0 });
  });

  it('flags overpayment and keeps the larger figure in the projection', () => {
    const s = computeBudgetSummary({
      ...base,
      lines: [line('dj', 50_000)],
      commitments: [commitment('c1', 'dj', 40_000)],
      payments: [payment({ id: 'p1', budgetLineId: 'dj', commitmentId: 'c1', amount: inr(45_000) })],
    });
    expect(s.lines[0]).toMatchObject({ overpaid: true, projected: inr(45_000), outstanding: 0 });
    expect(s.issues).toContainEqual({ code: 'overpayment', refId: 'dj' });
  });

  it('subtracts refunds from what has been paid', () => {
    const s = computeBudgetSummary({
      ...base,
      lines: [line('venue', 2_00_000)],
      commitments: [commitment('c1', 'venue', 2_00_000)],
      payments: [
        payment({ id: 'p1', budgetLineId: 'venue', commitmentId: 'c1', amount: inr(1_00_000) }),
        payment({ id: 'p2', budgetLineId: 'venue', commitmentId: 'c1', kind: 'refund', amount: inr(20_000) }),
      ],
    });
    expect(s.lines[0]?.paid).toBe(inr(80_000));
    expect(s.lines[0]?.outstanding).toBe(inr(1_20_000));
  });

  it('ignores cancelled commitments but flags money already paid against them', () => {
    const s = computeBudgetSummary({
      ...base,
      lines: [line('photo', 90_000)],
      commitments: [commitment('c1', 'photo', 80_000, 'cancelled')],
      payments: [payment({ id: 'p1', budgetLineId: 'photo', commitmentId: 'c1', kind: 'deposit', amount: inr(20_000) })],
    });
    expect(s.lines[0]).toMatchObject({ committed: 0, projected: inr(90_000), basis: 'estimate' });
    expect(s.issues).toContainEqual({ code: 'paid_against_cancelled_commitment', refId: 'p1' });
  });

  it('draws on the contingency reserve before the plan is over budget', () => {
    // Target ₹10 L, 7% reserve = ₹70,000, spendable = ₹9,30,000.
    const run = (projected: number) =>
      computeBudgetSummary({ ...base, lines: [line('all', projected)] });
    const healthy = run(9_00_000);
    expect(healthy).toMatchObject({ status: 'healthy', contingencyUsed: 0, contingencyRemaining: inr(70_000) });
    const tight = run(9_50_000);
    expect(tight).toMatchObject({ status: 'tight', contingencyUsed: inr(20_000), contingencyRemaining: inr(50_000), remainingToTarget: inr(50_000) });
    const over = run(10_50_000);
    expect(over).toMatchObject({ status: 'over', contingencyUsed: inr(70_000), contingencyRemaining: 0, remainingToTarget: inr(-50_000) });
  });

  it('separates overdue from due-soon planned payments', () => {
    const s = computeBudgetSummary({
      ...base,
      lines: [line('venue', 2_00_000)],
      payments: [
        payment({ id: 'late', budgetLineId: 'venue', status: 'planned', amount: inr(1), dueDate: asIsoDate('2026-10-20') }),
        payment({ id: 'today', budgetLineId: 'venue', status: 'planned', amount: inr(1), dueDate: asIsoDate('2026-10-21') }),
        payment({ id: 'week', budgetLineId: 'venue', status: 'planned', amount: inr(1), dueDate: asIsoDate('2026-10-28') }),
        payment({ id: 'later', budgetLineId: 'venue', status: 'planned', amount: inr(1), dueDate: asIsoDate('2026-10-29') }),
      ],
    });
    expect(s.overduePayments.map((p) => p.id)).toEqual(['late']);
    expect(s.dueSoonPayments.map((p) => p.id)).toEqual(['today', 'week']);
  });

  it('reports records that point at unknown lines instead of silently dropping them', () => {
    const s = computeBudgetSummary({
      ...base,
      lines: [line('venue', 1_00_000)],
      commitments: [commitment('c9', 'ghost', 5_000)],
      payments: [payment({ id: 'p9', budgetLineId: 'ghost', amount: inr(5_000) })],
    });
    expect(s.issues.map((i) => i.code)).toEqual(['unknown_line', 'unknown_line']);
    expect(s.totals.projected).toBe(inr(1_00_000));
  });

  it('copes with an empty event and a zero budget', () => {
    const empty = computeBudgetSummary({ ...base, lines: [], target: minor(0) });
    expect(empty).toMatchObject({ status: 'healthy', remainingToTarget: 0, contingencyReserve: 0 });
    const zeroTarget = computeBudgetSummary({ ...base, lines: [line('a', 100)], target: minor(0) });
    expect(zeroTarget.status).toBe('over');
  });

  it('clamps an out-of-range contingency and reports it', () => {
    const s = computeBudgetSummary({ ...base, lines: [], contingencyPct: 80 });
    expect(s.contingencyReserve).toBe(inr(5_00_000)); // clamped to 50%
    expect(s.issues).toContainEqual({ code: 'invalid_contingency', refId: 'contingencyPct' });
  });

  it('keeps the totals equal to the sum of the lines (property)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.integer({ min: 0, max: 5_000_000 }), fc.integer({ min: 0, max: 5_000_000 }), fc.integer({ min: 0, max: 5_000_000 })), { maxLength: 12 }),
        (rows) => {
          const lines = rows.map(([estimate], i) => ({ id: `l${i}`, category: 'x', estimate: minor(estimate) }));
          const commitments = rows.map(([, committed], i) => commitment(`c${i}`, `l${i}`, committed / 100));
          const payments = rows.map(([, , paid], i) => payment({ id: `p${i}`, budgetLineId: `l${i}`, amount: minor(paid) }));
          const s = computeBudgetSummary({ ...base, lines, commitments, payments });
          expect(s.totals.projected).toBe(s.lines.reduce((a, l) => a + l.projected, 0));
          expect(s.totals.outstanding).toBeGreaterThanOrEqual(0);
          s.lines.forEach((l) => expect(l.projected).toBeGreaterThanOrEqual(l.paid));
        },
      ),
    );
  });
});
