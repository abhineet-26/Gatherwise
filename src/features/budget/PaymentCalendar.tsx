import React from 'react';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useUiStore } from '../../store/uiStore';
import { formatMoney } from 'shared/domain/money/money';
import { Calendar, CheckCircle2 } from 'lucide-react';

export const PaymentCalendar: React.FC = () => {
  const { workspace, dispatch } = useWorkspaceStore();
  const { getEffectiveToday, addToast } = useUiStore();
  const today = getEffectiveToday();

  if (!workspace) return null;

  const { event, payments, commitments, vendors } = workspace;

  // Group payments by Year-Month of dueDate (or 'Unscheduled')
  const grouped: Record<string, typeof payments> = {};

  payments.forEach((p) => {
    const key = p.dueDate ? p.dueDate.substring(0, 7) : 'Unscheduled';
    if (!grouped[key]) grouped[key] = [];
    grouped[key]!.push(p);
  });

  const sortedMonths = Object.keys(grouped).sort();

  const handleMarkAsPaid = async (paymentId: string) => {
    await dispatch({
      type: 'RECORD_PAYMENT',
      eventId: event.id,
      payload: {
        id: paymentId,
        status: 'paid',
        paidDate: today,
      },
      meta: { summary: `Marked payment as paid` },
    });
    addToast('Payment recorded as paid', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" /> Milestone Payment Schedule
          </h3>
          <p className="text-xs text-stone-500">
            Chronological calendar of deposit, mid-milestone, and final settlement cash-flows
          </p>
        </div>
      </div>

      {sortedMonths.length === 0 ? (
        <Card className="p-8 text-center">
          <Calendar className="w-10 h-10 text-stone-400 mx-auto mb-3" />
          <h4 className="font-semibold text-stone-800 dark:text-stone-200">No scheduled payments</h4>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Payments will appear here when you accept vendor quotations with milestone schedules.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedMonths.map((month) => {
            const monthPayments = grouped[month] || [];
            const monthTotal = monthPayments.reduce((sum, p) => sum + p.amount, 0);

            // Format Month Header (e.g. "November 2026")
            let monthLabel = month;
            if (month !== 'Unscheduled') {
              const [y, m] = month.split('-');
              const dateObj = new Date(Number(y), Number(m) - 1, 1);
              monthLabel = dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
            }

            return (
              <div key={month} className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-stone-200 dark:border-stone-800">
                  <span className="font-bold text-sm text-stone-800 dark:text-stone-200 font-serif">
                    {monthLabel}
                  </span>
                  <span className="font-mono text-xs font-semibold text-stone-600 dark:text-stone-400">
                    Total: {formatMoney(monthTotal as any)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {monthPayments.map((p) => {
                    const commitment = commitments.find((c) => c.id === p.commitmentId);
                    const vendor = vendors.find((v) => v.id === commitment?.vendorId);
                    const isOverdue = p.status === 'scheduled' && p.dueDate && p.dueDate < today;

                    return (
                      <Card
                        key={p.id}
                        className={`p-3.5 flex items-start justify-between gap-3 ${
                          isOverdue ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20' : ''
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-stone-900 dark:text-stone-100 font-mono">
                              {formatMoney(p.amount as any)}
                            </span>
                            <StatusPill
                              variant={
                                p.status === 'paid'
                                  ? 'success'
                                  : isOverdue
                                  ? 'danger'
                                  : 'warning'
                              }
                            >
                              {p.status === 'paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Planned'}
                            </StatusPill>
                          </div>

                          <div className="text-xs text-stone-700 dark:text-stone-300 font-medium">
                            {p.notes || commitment?.title || 'Vendor Milestone'}
                          </div>

                          <div className="text-[11px] text-stone-500 font-mono flex items-center gap-2">
                            <span>Due: {p.dueDate || 'Unscheduled'}</span>
                            {vendor && <span>• {vendor.name}</span>}
                          </div>
                        </div>

                        {p.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkAsPaid(p.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors flex items-center gap-1 flex-shrink-0"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Paid
                          </button>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
