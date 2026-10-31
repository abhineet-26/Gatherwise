import React, { useState, useMemo } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useUiStore } from '../../store/uiStore';
import { evaluateScenario, type ScenarioContext, type ScenarioChanges } from 'shared/domain/scenarios/scenario';
import { checkCommitmentDrift } from 'shared/domain/budget/drift';
import { formatMoney, minor } from 'shared/domain/money/money';
import { asIsoDate } from 'shared/domain/time/dates';
import { WhatIfTable } from './WhatIfTable';
import {
  SlidersHorizontal,
  Users,
  AlertTriangle,
  RotateCcw,
  Bookmark,
  TrendingDown,
  TrendingUp,
  DollarSign,
} from 'lucide-react';

interface SavedScenario {
  id: string;
  name: string;
  headcount: number;
  adjustments: Record<string, number>;
  disabled: string[];
}

export const WhatIfView: React.FC = () => {
  const { workspace, dispatch, undo, canUndo } = useWorkspaceStore();
  const today = useUiStore(s => s.getEffectiveToday());

  const initialHeadcount = workspace?.event.guestCount || 300;
  const [headcount, setHeadcount] = useState<number>(initialHeadcount);
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [disabledLines, setDisabledLines] = useState<Set<string>>(new Set());
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [scenarioName, setScenarioName] = useState('');
  const [applied, setApplied] = useState(false);

  // Build ScenarioContext
  const context: ScenarioContext | null = useMemo(() => {
    if (!workspace) return null;
    return {
      event: {
        id: workspace.event.id,
        budgetTargetPaise: minor((workspace.event as any).budgetTargetPaise ?? workspace.event.budgetTarget),
        contingencyPct: workspace.event.contingencyPct ?? 7,
        priorities: (workspace.event.priorities || []) as string[],
        plannedHeadcount: initialHeadcount,
      },
      budgetLines: workspace.budgetLines.map(b => ({
        id: b.id,
        category: b.category,
        name: b.name,
        estimatePaise: minor((b as any).estimatePaise ?? b.estimate),
        scalesWithHeadcount: Boolean((b as any).scalesWithHeadcount ?? (b.category === 'catering')),
      })),
      commitments: workspace.commitments.map(c => ({
        id: c.id,
        budgetLineId: c.budgetLineId,
        agreedAmountPaise: minor((c as any).agreedAmountPaise ?? c.amount),
        headcountAtAcceptance: (c as any).headcountAtAcceptance ?? initialHeadcount,
        isPerHead: Boolean((c as any).headcountAtAcceptance || (c as any).isPerHead),
        status: (c.status === 'cancelled' ? 'cancelled' : 'active') as 'active' | 'cancelled',
      })),
      payments: workspace.payments.map(p => ({
        id: p.id,
        budgetLineId: p.budgetLineId || 'general',
        amountPaise: minor((p as any).amountPaise ?? p.amount),
        status: (p.status === 'paid' ? 'paid' : p.status === 'cancelled' ? 'cancelled' : 'planned') as 'planned' | 'paid' | 'cancelled',
      })),
      today: asIsoDate(today),
    };
  }, [workspace, initialHeadcount, today]);

  // Evaluate current scenario
  const outcome = useMemo(() => {
    if (!context) return null;

    const changes: ScenarioChanges = {
      headcount,
      lineAdjustments: Object.entries(adjustments).map(([budgetLineId, value]) => ({
        budgetLineId,
        mode: 'percent',
        value,
      })),
      disabledLines: Array.from(disabledLines),
    };

    return evaluateScenario(context, changes);
  }, [context, headcount, adjustments, disabledLines]);

  // Compute Commitment Drift
  const driftList = useMemo(() => {
    if (!workspace) return [];
    return workspace.commitments
      .map(c => {
        const v = workspace.vendors.find(vend => vend.id === c.vendorId);
        return checkCommitmentDrift(
          {
            commitmentId: c.id,
            vendorName: v?.name || c.title || 'Vendor',
            agreedAmountPaise: minor((c as any).agreedAmountPaise ?? c.amount),
            headcountAtAcceptance: (c as any).headcountAtAcceptance ?? initialHeadcount,
            isPerHead: Boolean((c as any).headcountAtAcceptance || (c as any).isPerHead),
          },
          headcount
        );
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);
  }, [workspace, headcount, initialHeadcount]);

  if (!workspace || !outcome) return null;

  const handleApplyToPlan = () => {
    for (const adj of outcome.adjustedLines) {
      if (adj.originalEstimatePaise !== adj.scenarioEstimatePaise) {
        dispatch({
          type: 'UPDATE_BUDGET_LINE',
          eventId: workspace.event.id,
          payload: {
            id: adj.id,
            estimate: adj.scenarioEstimatePaise,
            estimatePaise: adj.scenarioEstimatePaise,
          },
        });
      }
    }
    setApplied(true);
  };

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) return;
    setSavedScenarios(prev => [...prev, { id: 'scen-' + Date.now(), name: scenarioName.trim(), headcount, adjustments: { ...adjustments }, disabled: Array.from(disabledLines) }]);
    setScenarioName('');
  };

  const handleLoadScenario = (s: SavedScenario) => {
    setHeadcount(s.headcount);
    setAdjustments({ ...s.adjustments });
    setDisabledLines(new Set(s.disabled));
  };

  const handleReset = () => {
    setHeadcount(initialHeadcount);
    setAdjustments({});
    setDisabledLines(new Set());
    setApplied(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-heading text-text-primary">What-if Lab</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-subtle px-2.5 py-0.5 text-xs font-semibold text-primary">
              <SlidersHorizontal className="h-3 w-3" /> Real-Time Modeling
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Model changes in guest attendance, scale line allocations, and spot budget breaches before committing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canUndo() && (
            <button
              onClick={() => undo()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-subtle"
            >
              <RotateCcw className="h-3.5 w-3.5 text-primary" /> Undo change
            </button>
          )}
          <button
            onClick={handleReset}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary"
          >
            Reset to Baseline
          </button>
        </div>
      </div>

      {/* Top Warning Banners: Breaches & Priority Conflicts */}
      {outcome.isBreached && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <strong className="block font-semibold">Budget Breach Detected</strong>
            <span>
              This scenario pushes projected costs to {formatMoney(outcome.scenarioSummary.totals.projected)}, exceeding your budget target by{' '}
              {formatMoney(Math.abs(outcome.scenarioSummary.remainingToTarget) as any)}.
            </span>
          </div>
        </div>
      )}

      {outcome.priorityConflicts.map((conf, idx) => (
        <div
          key={idx}
          className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <span>
            <strong>Priority Conflict:</strong> The <em>{conf.category}</em> allocation was reduced by{' '}
            <strong>{conf.percentageDrop}%</strong> (down to {formatMoney(conf.newEstimatePaise)}), but it is designated as one of your top event priorities.
          </span>
        </div>
      ))}

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <span className="text-xs text-text-muted font-medium">Scenario Projected Total</span>
          <div className="mt-1 text-2xl font-bold font-heading text-text-primary">
            {formatMoney(outcome.scenarioSummary.totals.projected)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs font-semibold">
            {outcome.deltas.projectedPaise > 0 ? (
              <span className="text-rose-600 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" /> +{formatMoney(outcome.deltas.projectedPaise as any)}
              </span>
            ) : outcome.deltas.projectedPaise < 0 ? (
              <span className="text-emerald-600 flex items-center gap-0.5">
                <TrendingDown className="h-3 w-3" /> -{formatMoney(Math.abs(outcome.deltas.projectedPaise) as any)}
              </span>
            ) : (
              <span className="text-text-muted">No change vs baseline</span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <span className="text-xs text-text-muted font-medium">Target Headroom</span>
          <div className="mt-1 text-2xl font-bold font-heading text-text-primary">
            {outcome.scenarioSummary.remainingToTarget >= 0
              ? formatMoney(outcome.scenarioSummary.remainingToTarget)
              : `-${formatMoney(Math.abs(outcome.scenarioSummary.remainingToTarget) as any)}`}
          </div>
          <span className="mt-1 text-xs text-text-muted block">
            Status:{' '}
            <strong className={outcome.scenarioSummary.status === 'over' ? 'text-rose-600' : 'text-emerald-600'}>
              {outcome.scenarioSummary.status.toUpperCase()}
            </strong>
          </span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <span className="text-xs text-text-muted font-medium">Per-Guest Average</span>
          <div className="mt-1 text-2xl font-bold font-heading text-text-primary">
            {formatMoney(Math.round(outcome.scenarioSummary.totals.projected / headcount) as any)}
          </div>
          <div className="mt-1 text-xs text-text-muted">
            at {headcount} guests (Δ {outcome.deltas.perGuestCostPaise >= 0 ? '+' : ''}{formatMoney(outcome.deltas.perGuestCostPaise as any)}/pax)
          </div>
        </div>
      </div>

      {/* Headcount Slider & Inputs */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Headcount Sensitivity</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Modeled Headcount:</span>
            <input
              type="number"
              min={20}
              max={2000}
              step={10}
              value={headcount}
              onChange={e => setHeadcount(Math.max(1, Number(e.target.value)))}
              className="w-20 rounded-lg border border-border bg-surface-subtle px-2 py-1 text-sm font-semibold text-text-primary text-center"
            />
            <span className="text-xs text-text-muted">guests (Baseline: {initialHeadcount})</span>
          </div>
        </div>

        <input
          type="range"
          min={50}
          max={800}
          step={10}
          value={headcount}
          onChange={e => setHeadcount(Number(e.target.value))}
          className="w-full accent-primary cursor-pointer"
        />

        <div className="flex justify-between text-[11px] text-text-muted">
          <span>50 guests</span>
          <span>Baseline: {initialHeadcount}</span>
          <span>800 guests</span>
        </div>
      </div>

      {/* Commitment Drift Alerts */}
      {driftList.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-secondary" /> Commitment Drift Tracker
          </h3>
          <div className="space-y-2">
            {driftList.map(drift => (
              <div
                key={drift.commitmentId}
                className={`rounded-lg p-3 text-xs border ${
                  drift.hasWarning
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
                    : 'bg-surface-subtle border-border text-text-primary'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{drift.vendorName}</span>
                  <span>{formatMoney(drift.projectedAmountPaise)}</span>
                </div>
                <p className="mt-1 text-text-muted">{drift.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Adjustment Controls */}
      <WhatIfTable
        adjustedLines={outcome.adjustedLines}
        disabledLines={disabledLines}
        adjustments={adjustments}
        onToggleDisabled={(id, checked) => {
          const next = new Set(disabledLines);
          if (!checked) next.add(id);
          else next.delete(id);
          setDisabledLines(next);
        }}
        onAdjustmentChange={(id, val) =>
          setAdjustments(prev => ({
            ...prev,
            [id]: val,
          }))
        }
        onApply={handleApplyToPlan}
        applied={applied}
      />

      {/* Saved Scenarios Sidebar / Bar */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
            <Bookmark className="h-4 w-4 text-primary" /> Saved Scenarios
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Lean 250 pax, Lavish Mandap"
              value={scenarioName}
              onChange={e => setScenarioName(e.target.value)}
              className="rounded-lg border border-border bg-surface-subtle px-2.5 py-1 text-xs text-text-primary"
            />
            <button
              onClick={handleSaveScenario}
              disabled={!scenarioName.trim()}
              className="rounded-lg bg-surface-subtle border border-border px-3 py-1 text-xs font-medium text-text-primary hover:bg-surface hover:border-primary disabled:opacity-40"
            >
              Save Scenario
            </button>
          </div>
        </div>

        {savedScenarios.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {savedScenarios.map(s => (
              <button
                key={s.id}
                onClick={() => handleLoadScenario(s)}
                className="rounded-lg border border-border bg-surface-subtle px-3 py-1.5 text-xs text-text-primary hover:border-primary flex items-center gap-1.5"
              >
                <span>{s.name}</span>
                <span className="text-[10px] text-text-muted">({s.headcount} pax)</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
