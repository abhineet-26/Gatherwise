import React, { useState } from 'react';
import type { BudgetSummary } from 'shared/domain/budget/budget';
import { formatMoney } from 'shared/domain/money/money';
import { Card } from '../ui/Card';
import { StatusPill } from '../ui/StatusPill';
import { Button } from '../ui/Button';
import { Table as TableIcon, BarChart3, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BudgetBarProps {
  summary: BudgetSummary;
  className?: string;
}

export const BudgetBar: React.FC<BudgetBarProps> = ({ summary, className = '' }) => {
  const [showTable, setShowTable] = useState(false);

  const { target, totals, status, remainingToTarget, overduePayments } = summary;

  // Percentage calculations
  const targetVal = target > 0 ? target : 1;
  const paidPct = Math.min(100, Math.round((totals.paid / targetVal) * 100));
  const outstandingPct = Math.min(100 - paidPct, Math.round((totals.outstanding / targetVal) * 100));
  const remainingPct = Math.max(0, 100 - paidPct - outstandingPct);

  const statusVariant = 
    status === 'healthy' ? 'success' : status === 'tight' ? 'warning' : 'danger';

  const statusText = 
    status === 'healthy' ? 'On Budget' : status === 'tight' ? 'Tight Budget' : 'Over Budget';

  return (
    <Card className={`p-5 flex flex-col gap-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            Budget Execution
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Total target {formatMoney(target)} • Projected {formatMoney(totals.projected)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusPill variant={statusVariant}>
            {status === 'healthy' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" /> : <AlertCircle className="w-3.5 h-3.5 mr-1 inline" />}
            {statusText}
          </StatusPill>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTable(!showTable)}
            className="h-8 text-xs flex items-center gap-1"
            title={showTable ? 'Switch to bar chart' : 'Switch to accessible table'}
          >
            {showTable ? (
              <>
                <BarChart3 className="w-3.5 h-3.5" />
                Bar
              </>
            ) : (
              <>
                <TableIcon className="w-3.5 h-3.5" />
                Table
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
          <div className="text-stone-500 dark:text-stone-400 mb-0.5">Committed</div>
          <div className="text-base font-bold text-stone-900 dark:text-stone-100">
            {formatMoney(totals.committed)}
          </div>
          <div className="text-[10px] text-stone-400">Contracts & agreed</div>
        </div>

        <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40">
          <div className="text-emerald-700 dark:text-emerald-300 mb-0.5">Paid</div>
          <div className="text-base font-bold text-emerald-800 dark:text-emerald-200">
            {formatMoney(totals.paid)}
          </div>
          <div className="text-[10px] text-emerald-600/70">{paidPct}% of target</div>
        </div>

        <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/40">
          <div className="text-indigo-700 dark:text-indigo-300 mb-0.5">Outstanding</div>
          <div className="text-base font-bold text-indigo-800 dark:text-indigo-200">
            {formatMoney(totals.outstanding)}
          </div>
          <div className="text-[10px] text-indigo-600/70">Committed balance</div>
        </div>

        <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
          <div className="text-stone-500 dark:text-stone-400 mb-0.5">Headroom</div>
          <div className={`text-base font-bold ${remainingToTarget < 0 ? 'text-rose-600' : 'text-stone-900 dark:text-stone-100'}`}>
            {formatMoney(remainingToTarget)}
          </div>
          <div className="text-[10px] text-stone-400">Uncommitted target</div>
        </div>
      </div>

      {!showTable ? (
        /* Stacked Visual Bar */
        <div className="space-y-2 pt-1">
          <div
            className="w-full h-8 rounded-lg overflow-hidden flex bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-[11px] font-semibold text-white"
            role="progressbar"
            aria-label={`Budget execution: Paid ${paidPct}%, Outstanding ${outstandingPct}%, Headroom ${remainingPct}%`}
          >
            {paidPct > 0 && (
              <div
                style={{ width: `${paidPct}%` }}
                className="bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center px-2 transition-all duration-300 truncate"
                title={`Paid: ${formatMoney(totals.paid)} (${paidPct}%)`}
              >
                {paidPct >= 12 && `Paid ${paidPct}%`}
              </div>
            )}
            {outstandingPct > 0 && (
              <div
                style={{ width: `${outstandingPct}%` }}
                className="bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center px-2 transition-all duration-300 truncate"
                title={`Outstanding: ${formatMoney(totals.outstanding)} (${outstandingPct}%)`}
              >
                {outstandingPct >= 12 && `Due ${outstandingPct}%`}
              </div>
            )}
            {remainingPct > 0 && (
              <div
                style={{ width: `${remainingPct}%` }}
                className="bg-stone-300 dark:bg-stone-600 text-stone-700 dark:text-stone-200 flex items-center justify-center px-2 transition-all duration-300 truncate"
                title={`Remaining Headroom: ${formatMoney(remainingToTarget)} (${remainingPct}%)`}
              >
                {remainingPct >= 12 && `Headroom ${remainingPct}%`}
              </div>
            )}
          </div>

          {/* Direct Text Labels with both color and text description */}
          <div className="flex flex-wrap items-center justify-between text-xs text-stone-600 dark:text-stone-400 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span>Paid: {formatMoney(totals.paid)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
              <span>Outstanding Committed: {formatMoney(totals.outstanding)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-400 inline-block" />
              <span>Uncommitted Headroom: {formatMoney(remainingToTarget)}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Accessible Table Alternative */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-stone-200 dark:border-stone-800 rounded-lg">
            <caption className="sr-only">Budget Execution Breakdown Table</caption>
            <thead className="bg-stone-100 dark:bg-stone-800/60 font-semibold text-stone-700 dark:text-stone-300">
              <tr>
                <th className="p-2.5">Category</th>
                <th className="p-2.5 text-right">Amount</th>
                <th className="p-2.5 text-right">% of Target</th>
                <th className="p-2.5">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
              <tr>
                <td className="p-2.5 font-medium text-emerald-700 dark:text-emerald-400">Paid Outflow</td>
                <td className="p-2.5 text-right font-mono">{formatMoney(totals.paid)}</td>
                <td className="p-2.5 text-right font-mono">{paidPct}%</td>
                <td className="p-2.5 text-stone-500">Actual cash disbursed via UPI, bank, or cash</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-indigo-700 dark:text-indigo-400">Outstanding Committed</td>
                <td className="p-2.5 text-right font-mono">{formatMoney(totals.outstanding)}</td>
                <td className="p-2.5 text-right font-mono">{outstandingPct}%</td>
                <td className="p-2.5 text-stone-500">Agreed contract balance remaining to be paid</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-stone-700 dark:text-stone-300">Remaining Headroom</td>
                <td className="p-2.5 text-right font-mono">{formatMoney(remainingToTarget)}</td>
                <td className="p-2.5 text-right font-mono">{remainingPct}%</td>
                <td className="p-2.5 text-stone-500">Uncommitted plan balance within target budget</td>
              </tr>
              <tr className="bg-stone-50 dark:bg-stone-800/50 font-bold">
                <td className="p-2.5">Total Target Budget</td>
                <td className="p-2.5 text-right font-mono">{formatMoney(target)}</td>
                <td className="p-2.5 text-right font-mono">100%</td>
                <td className="p-2.5 text-stone-500">Approved budget limit</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {overduePayments.length > 0 && (
        <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between text-xs text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              <strong>{overduePayments.length} payment(s) overdue</strong> requiring attention.
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};
