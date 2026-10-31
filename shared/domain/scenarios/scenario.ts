import { computeBudgetSummary, type BudgetSummary } from '../budget/budget';
import { type Minor, minor } from '../money/money';
import { type IsoDate } from '../time/dates';

export interface ScenarioChanges {
  headcount?: number;
  lineAdjustments?: { budgetLineId: string; mode: 'set' | 'percent'; value: number }[];
  perHeadOverrides?: { budgetLineId: string; unitPricePaise: Minor }[];
  disabledLines?: string[];
}

export interface ScenarioContext {
  event: {
    id: string;
    budgetTargetPaise: Minor;
    contingencyPct: number;
    priorities: string[];
    plannedHeadcount: number;
  };
  budgetLines: {
    id: string;
    category: string;
    name?: string;
    estimatePaise: Minor;
    scalesWithHeadcount: boolean;
  }[];
  commitments: {
    id: string;
    budgetLineId: string;
    agreedAmountPaise: Minor;
    headcountAtAcceptance?: number;
    isPerHead?: boolean;
    status: 'active' | 'cancelled';
  }[];
  payments: {
    id: string;
    budgetLineId: string;
    amountPaise: Minor;
    status: 'planned' | 'paid' | 'cancelled';
  }[];
  today: IsoDate;
}

export interface PriorityConflict {
  category: string;
  originalEstimatePaise: Minor;
  newEstimatePaise: Minor;
  percentageDrop: number;
}

export interface ScenarioOutcome {
  baselineSummary: BudgetSummary;
  scenarioSummary: BudgetSummary;
  deltas: {
    projectedPaise: number;
    remainingToTargetPaise: number;
    perGuestCostPaise: number;
  };
  priorityConflicts: PriorityConflict[];
  isBreached: boolean;
  adjustedLines: {
    id: string;
    category: string;
    name?: string;
    originalEstimatePaise: Minor;
    scenarioEstimatePaise: Minor;
  }[];
}

/**
 * Evaluates a What-if scenario purely and deterministically (DOMAIN-MODEL.md §5.10).
 * Never assumes market prices; computes the exact financial and risk consequences.
 */
export function evaluateScenario(
  ctx: ScenarioContext,
  changes: ScenarioChanges
): ScenarioOutcome {
  const oldHeadcount = Math.max(1, ctx.event.plannedHeadcount);
  const newHeadcount = changes.headcount !== undefined ? Math.max(1, changes.headcount) : oldHeadcount;
  const ratio = newHeadcount / oldHeadcount;

  // 1. Compute baseline budget
  const baselineSummary = computeBudgetSummary({
    target: ctx.event.budgetTargetPaise,
    contingencyPct: ctx.event.contingencyPct,
    lines: ctx.budgetLines.map(b => ({ id: b.id, category: b.category, estimate: b.estimatePaise })),
    commitments: ctx.commitments.map(c => ({
      id: c.id,
      budgetLineId: c.budgetLineId,
      amount: c.agreedAmountPaise,
      status: c.status,
    })),
    payments: ctx.payments.map(p => ({
      id: p.id,
      budgetLineId: p.budgetLineId,
      kind: 'expense',
      amount: p.amountPaise,
      status: p.status,
    })),
    today: ctx.today,
  });

  // 2. Adjust budget lines
  const disabledSet = new Set(changes.disabledLines || []);
  const adjustmentsMap = new Map((changes.lineAdjustments || []).map(a => [a.budgetLineId, a]));
  const perHeadOverridesMap = new Map((changes.perHeadOverrides || []).map(o => [o.budgetLineId, o.unitPricePaise]));

  const adjustedLines: ScenarioOutcome['adjustedLines'] = [];
  const priorityConflicts: PriorityConflict[] = [];

  const modifiedLines = ctx.budgetLines.map(line => {
    let newEstimate = Number(line.estimatePaise);

    // Apply headcount scaling if enabled and no per-head override
    if (line.scalesWithHeadcount && !perHeadOverridesMap.has(line.id)) {
      newEstimate = Math.round(line.estimatePaise * ratio);
    }

    // Apply per-head override if present
    if (perHeadOverridesMap.has(line.id)) {
      const unit = Number(perHeadOverridesMap.get(line.id)!);
      newEstimate = Math.round(unit * newHeadcount);
    }

    // Apply manual adjustment (set or percent)
    const adj = adjustmentsMap.get(line.id);
    if (adj) {
      if (adj.mode === 'set') {
        newEstimate = Math.max(0, Math.round(adj.value));
      } else if (adj.mode === 'percent') {
        newEstimate = Math.max(0, Math.round(newEstimate * (1 + adj.value / 100)));
      }
    }

    // Dropped lines contribute 0
    if (disabledSet.has(line.id)) {
      newEstimate = 0;
    }

    const safeNewEstimate = minor(newEstimate);

    // Check priority conflict: line category in priorities and dropped by > 10%
    if (ctx.event.priorities.includes(line.category) && line.estimatePaise > 0) {
      const dropRatio = (line.estimatePaise - safeNewEstimate) / line.estimatePaise;
      if (dropRatio > 0.10) {
        priorityConflicts.push({
          category: line.category,
          originalEstimatePaise: line.estimatePaise,
          newEstimatePaise: safeNewEstimate,
          percentageDrop: Math.round(dropRatio * 100),
        });
      }
    }

    adjustedLines.push({
      id: line.id,
      category: line.category,
      name: line.name,
      originalEstimatePaise: line.estimatePaise,
      scenarioEstimatePaise: safeNewEstimate,
    });

    return {
      id: line.id,
      category: line.category,
      estimate: safeNewEstimate,
    };
  });

  // 3. Adjust commitments (per-head commitments scale by headcount)
  const modifiedCommitments = ctx.commitments.map(c => {
    if (c.isPerHead && c.status === 'active') {
      const origCount = c.headcountAtAcceptance || oldHeadcount;
      const cRatio = newHeadcount / origCount;
      return {
        id: c.id,
        budgetLineId: c.budgetLineId,
        amount: minor(Math.round(c.agreedAmountPaise * cRatio)),
        status: c.status,
      };
    }
    return {
      id: c.id,
      budgetLineId: c.budgetLineId,
      amount: c.agreedAmountPaise,
      status: c.status,
    };
  });

  // 4. Compute scenario budget
  const scenarioSummary = computeBudgetSummary({
    target: ctx.event.budgetTargetPaise,
    contingencyPct: ctx.event.contingencyPct,
    lines: modifiedLines,
    commitments: modifiedCommitments,
    payments: ctx.payments.map(p => ({
      id: p.id,
      budgetLineId: p.budgetLineId,
      kind: 'expense',
      amount: p.amountPaise,
      status: p.status,
    })),
    today: ctx.today,
  });

  const baselinePerGuest = Math.round(baselineSummary.totals.projected / oldHeadcount);
  const scenarioPerGuest = Math.round(scenarioSummary.totals.projected / newHeadcount);

  return {
    baselineSummary,
    scenarioSummary,
    deltas: {
      projectedPaise: scenarioSummary.totals.projected - baselineSummary.totals.projected,
      remainingToTargetPaise: scenarioSummary.remainingToTarget - baselineSummary.remainingToTarget,
      perGuestCostPaise: scenarioPerGuest - baselinePerGuest,
    },
    priorityConflicts,
    isBreached: baselineSummary.status !== 'over' && scenarioSummary.status === 'over',
    adjustedLines,
  };
}
