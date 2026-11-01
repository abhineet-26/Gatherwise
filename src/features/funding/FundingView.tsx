import React, { useState } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useUiStore } from '../../store/uiStore';
import type { FundingSource, StageWeights } from 'shared/domain/funding/types';
import { DEFAULT_STAGE_WEIGHTS } from 'shared/domain/funding/types';
import { computeFundingSummary } from 'shared/domain/funding/funding';
import { formatMoney, inr, minor } from 'shared/domain/money/money';
import { AddFundingModal } from './AddFundingModal';
import {
  HandCoins,
  AlertTriangle,
  Plus,
  Trash2,
  Printer,
  CheckSquare,
  Square,
  Gift,
} from 'lucide-react';

export const FundingView: React.FC = () => {
  const { workspace, dispatch } = useWorkspaceStore();
  const { addToast } = useUiStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [stageWeights] = useState<StageWeights>(DEFAULT_STAGE_WEIGHTS);

  if (!workspace) return null;

  const sources: FundingSource[] = workspace.funding || [];
  const projectedBudget = minor(workspace.event.budgetTarget || inr(500000));
  const summary = computeFundingSummary(sources, projectedBudget, stageWeights);

  const handleAddSource = (source: FundingSource) => {
    dispatch({
      type: 'ADD_FUNDING_SOURCE',
      eventId: workspace.event.id,
      payload: source as unknown as Record<string, unknown>,
    });
    addToast(`Added funding source: ${source.name}`, 'success');
  };

  const handleDeleteSource = (id: string, name: string) => {
    dispatch({
      type: 'DELETE_FUNDING_SOURCE',
      eventId: workspace.event.id,
      payload: { id },
    });
    addToast(`Deleted ${name}`, 'info');
  };

  const handleUpdateStage = (source: FundingSource, newStage: FundingSource['stage']) => {
    dispatch({
      type: 'UPDATE_FUNDING_SOURCE',
      eventId: workspace.event.id,
      payload: { ...source, stage: newStage } as unknown as Record<string, unknown>,
    });
    addToast(`Updated ${source.name} stage to ${newStage}`, 'success');
  };

  const handleToggleDeliverable = (source: FundingSource, deliverableId: string) => {
    const updatedDeliverables = (source.deliverables || []).map(d =>
      d.id === deliverableId ? { ...d, isCompleted: !d.isCompleted } : d
    );
    dispatch({
      type: 'UPDATE_FUNDING_SOURCE',
      eventId: workspace.event.id,
      payload: { ...source, deliverables: updatedDeliverables } as unknown as Record<string, unknown>,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-display text-gw-ink-900 dark:text-stone-100 flex items-center gap-2.5">
            <HandCoins className="w-6 h-6 text-gw-indigo-700" />
            <span>Sponsorship & Funding Tracker</span>
          </h1>
          <p className="text-xs text-gw-ink-600 dark:text-stone-400 mt-1">
            Track sponsors, grants, donations, coverage ratios, and concentration risks (FND-01).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2.5 rounded-xl border border-gw-line bg-white dark:bg-stone-900 hover:bg-gw-sunken text-gw-ink-700 text-xs font-semibold shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Print Sponsor Report
          </button>

          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gw-indigo-700 hover:bg-gw-indigo-600 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Funding Source
          </button>
        </div>
      </div>

      {/* Top Warning Banner: Concentration Risk */}
      {summary.isConcentrationRisk && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Sponsorship Concentration Risk</strong>
            <span>
              A single sponsor (<strong>{summary.concentratedSourceName}</strong>) accounts for more than 50% of your confirmed funds. Diversify with secondary sponsors or community grants to protect against withdrawal.
            </span>
          </div>
        </div>
      )}

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gw-line bg-white dark:bg-stone-900 p-4 shadow-xs space-y-1">
          <span className="text-xs font-medium text-gw-ink-600 dark:text-stone-400">Confirmed Cash</span>
          <div className="text-xl font-black font-display text-emerald-600">
            {formatMoney(summary.totalConfirmedPaise)}
          </div>
          <span className="text-[11px] text-gw-ink-600 block">
            {Math.round(summary.confirmedCoverageRatio * 100)}% of target budget
          </span>
        </div>

        <div className="rounded-2xl border border-gw-line bg-white dark:bg-stone-900 p-4 shadow-xs space-y-1">
          <span className="text-xs font-medium text-gw-ink-600 dark:text-stone-400">Expected Pipeline</span>
          <div className="text-xl font-black font-display text-gw-indigo-700">
            {formatMoney(summary.totalExpectedPaise)}
          </div>
          <span className="text-[11px] text-gw-ink-600 block">
            {Math.round(summary.expectedCoverageRatio * 100)}% expected coverage
          </span>
        </div>

        <div className="rounded-2xl border border-gw-line bg-white dark:bg-stone-900 p-4 shadow-xs space-y-1">
          <span className="text-xs font-medium text-gw-ink-600 dark:text-stone-400">Funding Gap</span>
          <div className="text-xl font-black font-display text-rose-600">
            {summary.fundingGapPaise > 0 ? formatMoney(summary.fundingGapPaise) : 'Fully Funded!'}
          </div>
          <span className="text-[11px] text-gw-ink-600 block">
            Budget Target: {formatMoney(projectedBudget)}
          </span>
        </div>

        <div className="rounded-2xl border border-gw-line bg-white dark:bg-stone-900 p-4 shadow-xs space-y-1">
          <span className="text-xs font-medium text-gw-ink-600 dark:text-stone-400">In-Kind Sponsorship</span>
          <div className="text-xl font-black font-display text-stone-700 dark:text-stone-200">
            {formatMoney(summary.totalInKindPaise)}
          </div>
          <span className="text-[11px] text-gw-ink-600 block">Food, beverage, media & stalls</span>
        </div>
      </div>

      {/* Coverage Progress Bar */}
      <div className="rounded-2xl border border-gw-line bg-white dark:bg-stone-900 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span>Budget Funding Coverage Ratio</span>
          <span className="text-gw-indigo-700 font-bold">
            {Math.round(summary.confirmedCoverageRatio * 100)}% Confirmed • {Math.round(summary.expectedCoverageRatio * 100)}% Expected
          </span>
        </div>

        <div className="w-full h-3.5 rounded-full bg-gw-sunken overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.round(summary.confirmedCoverageRatio * 100))}%` }}
            title="Confirmed cash"
          />
          <div
            className="bg-gw-indigo-400/60 h-full transition-all duration-300"
            style={{
              width: `${Math.min(
                100 - Math.min(100, Math.round(summary.confirmedCoverageRatio * 100)),
                Math.max(0, Math.round((summary.expectedCoverageRatio - summary.confirmedCoverageRatio) * 100))
              )}%`,
            }}
            title="Expected pipeline"
          />
        </div>

        <div className="flex items-center gap-4 text-[11px] text-gw-ink-600 dark:text-stone-400 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Confirmed Cash
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gw-indigo-400 inline-block" /> Expected Pipeline
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gw-sunken border border-gw-line inline-block" /> Unfunded Gap
          </span>
        </div>
      </div>

      {/* Sources List & Deliverables */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gw-ink-900 dark:text-stone-100 px-1">
          Sponsor & Funding Directory ({sources.length})
        </h2>

        {sources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gw-line bg-white dark:bg-stone-900 p-12 text-center space-y-3">
            <HandCoins className="w-10 h-10 text-gw-ink-600/40 mx-auto" />
            <h3 className="text-base font-bold text-gw-ink-900 dark:text-stone-100">No funding sources tracked</h3>
            <p className="text-xs text-gw-ink-600 dark:text-stone-400 max-w-sm mx-auto">
              Add corporate sponsors, community grants, or stall rentals to monitor your event's revenue coverage.
            </p>
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gw-indigo-700 text-white font-semibold text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add First Source
            </button>
          </div>
        ) : (
          sources.map(source => (
            <div
              key={source.id}
              className="rounded-2xl border border-gw-line bg-white dark:bg-stone-900 p-4 shadow-xs space-y-3 hover:border-gw-indigo-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-gw-ink-900 dark:text-stone-100">
                      {source.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-gw-sunken text-gw-ink-700 border border-gw-line uppercase">
                      {source.kind.replace('_', ' ')}
                    </span>
                    {source.isInKind && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-purple-500/20 text-purple-700 border border-purple-500/30 flex items-center gap-1">
                        <Gift className="w-3 h-3" /> In-Kind
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gw-ink-600 dark:text-stone-400">
                    {source.contactName ? `${source.contactName} • ` : ''}
                    {source.contactPhone || source.contactEmail || 'No contact specified'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-base font-black font-display text-gw-ink-900 dark:text-stone-100 block">
                      {formatMoney(source.amountPaise)}
                    </span>
                    <select
                      value={source.stage}
                      onChange={e => handleUpdateStage(source, e.target.value as FundingSource['stage'])}
                      className="mt-0.5 text-xs font-semibold px-2 py-1 rounded-lg border border-gw-line bg-gw-sunken/60 focus:outline-none"
                    >
                      <option value="prospect">Prospect</option>
                      <option value="pitched">Pitched</option>
                      <option value="verbal">Verbal</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="received">Received</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleDeleteSource(source.id, source.name)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Delete source"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Deliverables Checklist */}
              {source.deliverables && source.deliverables.length > 0 && (
                <div className="border-t border-gw-line/60 pt-2.5 space-y-1.5">
                  <span className="text-[11px] font-semibold text-gw-ink-600 uppercase tracking-wider block">
                    Agreed Deliverables Checklist
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {source.deliverables.map(del => (
                      <button
                        key={del.id}
                        onClick={() => handleToggleDeliverable(source, del.id)}
                        className="flex items-center gap-2 text-xs text-left p-1.5 rounded-lg hover:bg-gw-sunken/50 transition-colors"
                      >
                        {del.isCompleted ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-stone-400 shrink-0" />
                        )}
                        <span className={del.isCompleted ? 'line-through text-stone-400' : 'text-gw-ink-800'}>
                          {del.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Funding Modal */}
      <AddFundingModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddSource}
      />
    </div>
  );
};
