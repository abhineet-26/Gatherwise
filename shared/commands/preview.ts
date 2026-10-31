import type { WorkspaceState, BaseCommand } from './types';
import { reduceCommand } from './reducer';
import { computeBudgetSummary, type BudgetSummary } from '../domain/budget/budget';
import { type IsoDate } from '../domain/time/dates';
import { minor } from '../domain/money/money';

export interface ImpactPreview {
  budgetBefore: BudgetSummary;
  budgetAfter: BudgetSummary;
  budgetDelta: number; // paise
  tasksAdded: number;
  tasksUpdated: number;
  warnings: string[];
  summaries: string[];
}

export function previewImpact(
  state: WorkspaceState,
  commands: BaseCommand[],
  today: IsoDate
): ImpactPreview {
  const mapBudgetInput = (ws: WorkspaceState) => ({
    target: minor(ws.event.budgetTarget),
    contingencyPct: ws.event.contingencyPct,
    lines: ws.budgetLines.map(b => ({
      id: b.id,
      category: b.category,
      estimate: minor(b.estimate),
    })),
    commitments: ws.commitments
      .filter(c => c.status !== 'completed')
      .map(c => ({
        id: c.id,
        budgetLineId: c.budgetLineId,
        amount: minor(c.amount),
        status: (c.status === 'cancelled' ? 'cancelled' : 'active') as 'active' | 'cancelled',
      })),
    payments: ws.payments.map(p => ({
      id: p.id,
      budgetLineId: p.budgetLineId,
      commitmentId: p.commitmentId,
      kind: (p.isRefund ? 'refund' : 'expense') as 'refund' | 'expense',
      amount: minor(p.amount),
      status: (p.status === 'paid' ? 'paid' : p.status === 'cancelled' ? 'cancelled' : 'planned') as 'planned' | 'paid' | 'cancelled',
      dueDate: p.dueDate,
      paidDate: p.paidDate,
    })),
    today,
  });

  const budgetBefore = computeBudgetSummary(mapBudgetInput(state));

  let currentState = state;
  const summaries: string[] = [];
  let tasksAdded = 0;
  let tasksUpdated = 0;
  const warnings: string[] = [];

  for (const cmd of commands) {
    if (cmd.type === 'ADD_TASK') tasksAdded += 1;
    if (cmd.type === 'UPDATE_TASK' || cmd.type === 'COMPLETE_TASK') tasksUpdated += 1;

    const res = reduceCommand(currentState, cmd);
    currentState = res.nextState;
    summaries.push(res.summary);
  }

  const budgetAfter = computeBudgetSummary(mapBudgetInput(currentState));

  if (budgetAfter.status === 'over' && budgetBefore.status !== 'over') {
    warnings.push('This proposal pushes projected expenses over the budget target.');
  }

  return {
    budgetBefore,
    budgetAfter,
    budgetDelta: budgetAfter.totals.projected - budgetBefore.totals.projected,
    tasksAdded,
    tasksUpdated,
    warnings,
    summaries,
  };
}
