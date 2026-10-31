import React, { useState, useMemo } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useUiStore } from '../../store/uiStore';
import { BudgetBar } from '../../components/budget/BudgetBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { computeBudgetSummary } from 'shared/domain/budget/budget';
import { formatMoney } from 'shared/domain/money/money';
import { buildCsv } from 'shared/domain/export/csv';
import type { BudgetLine, Payment } from 'shared/schemas';
import { RecordPaymentModal, AddBudgetLineModal } from './BudgetModals';
import { DollarSign, Plus, Download, Receipt } from 'lucide-react';

export const BudgetView: React.FC = () => {
  const { workspace, dispatch } = useWorkspaceStore();
  const { getEffectiveToday, addToast } = useUiStore();
  const today = getEffectiveToday();

  const [activeSubTab, setActiveSubTab] = useState<'lines' | 'payments' | 'reconciliation'>('lines');
  const [showAddLineModal, setShowAddLineModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

  if (!workspace) return null;
  const { event, budgetLines, commitments, payments } = workspace;

  const budgetSummary = useMemo(() => {
    return computeBudgetSummary({
      target: (event.budget || event.budgetTarget) as any,
      contingencyPct: event.contingencyPct || 10,
      lines: budgetLines.map(b => ({ id: b.id, category: b.category, estimate: b.estimate as any })),
      commitments: commitments.map(c => ({
        id: c.id,
        budgetLineId: c.budgetLineId,
        amount: c.amount as any,
        status: (c.status === 'cancelled' ? 'cancelled' : 'active') as 'active' | 'cancelled',
      })),
      payments: payments.map(p => ({
        id: p.id,
        budgetLineId: p.budgetLineId || 'general',
        commitmentId: p.commitmentId,
        kind: 'deposit' as const,
        amount: p.amount as any,
        status: 'paid' as const,
        paidDate: p.paidAt as any,
      })),
      today,
    });
  }, [event, today, budgetLines, commitments, payments]);

  const guestCount = event.guestCount ?? 0;
  const perGuestActual = guestCount > 0 ? Math.round(budgetSummary.totals.projected / guestCount) : 0;

  const handleAddBudgetLine = async (data: { category: string; estimate: any }) => {
    const newLine: BudgetLine = {
      id: `bl_${Date.now()}`,
      eventId: event.id,
      category: data.category.toLowerCase().replace(/\s+/g, '_'),
      name: data.category,
      estimate: data.estimate,
      basis: 'user',
    };

    await dispatch({
      type: 'ADD_BUDGET_LINE',
      eventId: event.id,
      payload: newLine as unknown as Record<string, unknown>,
    });

    addToast(`Added budget line for "${newLine.name}"`, 'success');
  };

  const handleRecordPayment = async (data: { amount: any; recipient: string; mode: Payment['mode']; reference?: string }) => {
    const newPayment: Payment = {
      id: `pay_${Date.now()}`,
      eventId: event.id,
      amount: data.amount,
      mode: data.mode,
      paidAt: today,
      recipient: data.recipient,
      reference: data.reference,
    };

    await dispatch({
      type: 'RECORD_PAYMENT',
      eventId: event.id,
      payload: newPayment as unknown as Record<string, unknown>,
    });

    addToast(`Recorded payment of ${formatMoney(data.amount)} to ${data.recipient}`, 'success');
  };

  const handleExportCsv = () => {
    const headers = ['Category', 'Basis', 'Estimate (INR)', 'Committed (INR)', 'Paid (INR)', 'Outstanding (INR)'];
    const rows = budgetSummary.lines.map(line => {
      const bLine = budgetLines.find(b => b.id === line.lineId);
      return [
        bLine?.name || line.lineId,
        line.basis,
        line.estimate / 100,
        line.committed / 100,
        line.paid / 100,
        line.outstanding / 100,
      ];
    });

    const csvContent = '\uFEFF' + buildCsv(headers, rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.name.toLowerCase().replace(/\s+/g, '-')}-budget.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Budget CSV exported successfully', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Budget & Payments
          </h2>
          <p className="text-xs text-stone-500">
            Per-guest cost: {formatMoney(perGuestActual as any)} / guest ({event.guestCount} guests)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportCsv} className="text-xs h-8 flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowAddPaymentModal(true)} className="text-xs h-8 flex items-center gap-1">
            <Receipt className="w-3.5 h-3.5" /> Record Payment
          </Button>
          <Button size="sm" onClick={() => setShowAddLineModal(true)} className="text-xs h-8 flex items-center gap-1 bg-primary text-white">
            <Plus className="w-3.5 h-3.5" /> Add Budget Line
          </Button>
        </div>
      </div>

      <BudgetBar summary={budgetSummary} />

      <div className="flex border-b border-stone-200 dark:border-stone-800 text-xs font-semibold gap-6">
        <button
          onClick={() => setActiveSubTab('lines')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeSubTab === 'lines' ? 'border-primary text-primary' : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          Budget Lines & Allocations ({budgetLines.length})
        </button>
        <button
          onClick={() => setActiveSubTab('payments')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeSubTab === 'payments' ? 'border-primary text-primary' : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          Disbursed Payments Log ({payments.length})
        </button>
        <button
          onClick={() => setActiveSubTab('reconciliation')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeSubTab === 'reconciliation' ? 'border-primary text-primary' : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          Post-Event Reconciliation
        </button>
      </div>

      {activeSubTab === 'lines' && (
        <Card className="divide-y divide-stone-200 dark:divide-stone-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400 font-semibold border-b border-stone-200 dark:border-stone-800">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3">Basis</th>
                  <th className="p-3 text-right">Estimate</th>
                  <th className="p-3 text-right">Committed</th>
                  <th className="p-3 text-right">Paid</th>
                  <th className="p-3 text-right">Outstanding</th>
                  <th className="p-3 text-right">Projected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                {budgetSummary.lines.map((line) => {
                  const bLine = budgetLines.find(b => b.id === line.lineId);
                  return (
                    <tr key={line.lineId} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                      <td className="p-3 font-semibold text-stone-900 dark:text-stone-100">
                        {bLine?.name || bLine?.category || line.lineId}
                        {bLine?.whyThis && (
                          <div className="text-[10px] text-stone-400 font-normal">{bLine.whyThis}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <StatusPill variant={line.basis === 'commitment' ? 'success' : 'neutral'} className="text-[10px]">
                          {line.basis}
                        </StatusPill>
                      </td>
                      <td className="p-3 text-right font-mono text-stone-600 dark:text-stone-400">{formatMoney(line.estimate)}</td>
                      <td className="p-3 text-right font-mono font-medium text-stone-900 dark:text-stone-100">{formatMoney(line.committed)}</td>
                      <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{formatMoney(line.paid)}</td>
                      <td className="p-3 text-right font-mono text-indigo-600 dark:text-indigo-400">{formatMoney(line.outstanding)}</td>
                      <td className="p-3 text-right font-mono font-bold text-stone-900 dark:text-stone-100">{formatMoney(line.projected)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeSubTab === 'payments' && (
        <Card className="divide-y divide-stone-200 dark:divide-stone-800 overflow-hidden">
          {payments.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500">
              No payments recorded yet. Click "Record Payment" to log an advance or deposit.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400 font-semibold border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Recipient</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">Reference</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                      <td className="p-3 font-mono text-stone-500">{p.paidAt}</td>
                      <td className="p-3 font-semibold text-stone-900 dark:text-stone-100">{p.recipient}</td>
                      <td className="p-3">
                        <span className="uppercase px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono text-[10px]">{p.mode}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-stone-400">{p.reference || '—'}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(p.amount as any)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeSubTab === 'reconciliation' && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Post-Event Financial Reconciliation</h3>
              <p className="text-xs text-stone-500">Audit initial estimates against actual signed commitments and cash paid</p>
            </div>
            <StatusPill variant={budgetSummary.totals.projected <= (event.budget || event.budgetTarget) ? 'success' : 'danger'}>
              {budgetSummary.totals.projected <= (event.budget || event.budgetTarget) ? 'Within Budget' : 'Exceeded Budget'}
            </StatusPill>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40">
              <span className="text-stone-500">Target Budget</span>
              <div className="text-base font-bold text-stone-900 dark:text-stone-100">{formatMoney((event.budget || event.budgetTarget) as any)}</div>
            </div>
            <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40">
              <span className="text-stone-500">Actual Outflow Disbursed</span>
              <div className="text-base font-bold text-emerald-600">{formatMoney(budgetSummary.totals.paid)}</div>
            </div>
            <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40">
              <span className="text-stone-500">Net Variance</span>
              <div className={`text-base font-bold ${budgetSummary.remainingToTarget >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {budgetSummary.remainingToTarget >= 0 ? `+${formatMoney(budgetSummary.remainingToTarget)} saved` : `-${formatMoney(Math.abs(budgetSummary.remainingToTarget) as any)} over`}
              </div>
            </div>
          </div>
        </Card>
      )}

      <RecordPaymentModal
        isOpen={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        onSubmit={handleRecordPayment}
      />

      <AddBudgetLineModal
        isOpen={showAddLineModal}
        onClose={() => setShowAddLineModal(false)}
        onSubmit={handleAddBudgetLine}
      />
    </div>
  );
};
