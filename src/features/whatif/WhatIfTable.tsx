import React from 'react';
import { formatMoney, type Minor } from 'shared/domain/money/money';
import { CheckCircle2 } from 'lucide-react';

export interface WhatIfTableProps {
  adjustedLines: {
    id: string;
    category: string;
    name?: string;
    originalEstimatePaise: Minor;
    scenarioEstimatePaise: Minor;
  }[];
  disabledLines: Set<string>;
  adjustments: Record<string, number>;
  onToggleDisabled: (id: string, checked: boolean) => void;
  onAdjustmentChange: (id: string, val: number) => void;
  onApply: () => void;
  applied: boolean;
}

export const WhatIfTable: React.FC<WhatIfTableProps> = ({
  adjustedLines,
  disabledLines,
  adjustments,
  onToggleDisabled,
  onAdjustmentChange,
  onApply,
  applied,
}) => {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-4">
      <h3 className="text-sm font-semibold text-text-primary">Budget Line Adjustments</h3>
      <div className="divide-y divide-border/60">
        {adjustedLines.map(line => {
          const isDisabled = disabledLines.has(line.id);
          const currentPct = adjustments[line.id] || 0;

          return (
            <div key={line.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-[180px]">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`chk-${line.id}`}
                    checked={!isDisabled}
                    onChange={e => onToggleDisabled(line.id, e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <label
                    htmlFor={`chk-${line.id}`}
                    className={`text-sm font-medium ${isDisabled ? 'line-through text-text-muted' : 'text-text-primary'}`}
                  >
                    {line.name || line.category}
                  </label>
                </div>
                <span className="text-[11px] text-text-muted block pl-5">
                  Original: {formatMoney(line.originalEstimatePaise)}
                </span>
              </div>

              {!isDisabled && (
                <div className="flex items-center gap-3 flex-1 max-w-xs">
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    step={5}
                    value={currentPct}
                    onChange={e => onAdjustmentChange(line.id, Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                  <span className="text-xs font-mono font-medium text-text-muted w-12 text-right">
                    {currentPct > 0 ? `+${currentPct}` : currentPct}%
                  </span>
                </div>
              )}

              <div className="text-right sm:min-w-[120px]">
                <span className="text-sm font-semibold text-text-primary block">
                  {formatMoney(line.scenarioEstimatePaise)}
                </span>
                {line.originalEstimatePaise !== line.scenarioEstimatePaise && (
                  <span className="text-[10px] text-text-muted block">
                    {line.scenarioEstimatePaise > line.originalEstimatePaise ? '+' : ''}
                    {formatMoney((line.scenarioEstimatePaise - line.originalEstimatePaise) as any)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Apply Action */}
      <div className="pt-4 border-t border-border flex items-center justify-between">
        <span className="text-xs text-text-muted">
          Applying this scenario will update estimates in your live budget planner.
        </span>
        {applied ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
            <CheckCircle2 className="h-4 w-4" /> Changes Applied
          </span>
        ) : (
          <button
            onClick={onApply}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-text-inverse hover:bg-primary/90 transition-colors shadow-xs"
          >
            Apply Scenario to Budget
          </button>
        )}
      </div>
    </div>
  );
};
