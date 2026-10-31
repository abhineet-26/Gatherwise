import React, { useMemo } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useUiStore } from '../../store/uiStore';
import { ReadinessBloom } from '../../components/readiness/ReadinessBloom';
import { BudgetBar } from '../../components/budget/BudgetBar';
import { WeatherWidget } from '../weather/WeatherWidget';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { Button } from '../../components/ui/Button';
import { computeReadiness } from 'shared/domain/readiness/readiness';
import { computeBudgetSummary } from 'shared/domain/budget/budget';
import { daysBetween, addDays, asIsoDate } from 'shared/domain/time/dates';
import { formatMoney } from 'shared/domain/money/money';
import { getPackForEvent } from 'shared/planning/packs';
import { 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { workspace, dispatch } = useWorkspaceStore();
  const { getEffectiveToday, setActiveTab, addToast } = useUiStore();
  const today = getEffectiveToday();

  if (!workspace) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">No Event Selected</h2>
        <p className="text-sm text-stone-500 mb-4">Please select or create an event to view the command dashboard.</p>
      </div>
    );
  }

  const { event, subEvents, budgetLines, commitments, payments, tasks, guests, risks } = workspace;
  const daysLeft = daysBetween(today, asIsoDate(event.date));
  const pack = getPackForEvent(event.type);

  // 1. Compute Readiness
  const readiness = useMemo(() => {
    return computeReadiness({
      eventDate: asIsoDate(event.date),
      today,
      budgetTarget: (event.budget || event.budgetTarget) as any,
      contingencyPct: event.contingencyPct || 10,
      tasks,
      essentials: pack.essentials,
      budgetLines,
      commitments,
      payments,
      guests,
      risks,
    });
  }, [event, today, tasks, pack, budgetLines, commitments, payments, guests, risks]);

  // 2. Compute Budget Summary
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

  // 3. Upcoming Deadlines (Next 7 Days + Overdue)
  const next7DaysDate = addDays(today, 7);
  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'done' && t.status !== 'skipped' && t.dueDate <= next7DaysDate)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [tasks, next7DaysDate]);

  // 4. Critical & High Risks
  const topRisks = useMemo(() => {
    return risks
      .filter(r => r.status !== 'resolved')
      .sort((a, _b) => (a.severity === 'critical' ? -1 : 1))
      .slice(0, 3);
  }, [risks]);

  const handleQuickCompleteTask = async (taskId: string, title: string) => {
    await dispatch({
      type: 'COMPLETE_TASK',
      eventId: event.id,
      payload: { id: taskId },
    });
    addToast(`Completed "${title}"`, 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Event Header Card */}
      <div className="bg-gradient-to-r from-primary/10 via-indigo-50/50 to-transparent dark:from-primary/20 dark:via-stone-900 border border-primary/20 rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <StatusPill variant="neutral" className="uppercase font-mono text-[10px] tracking-wider">
              {event.type}
            </StatusPill>
            <span className="text-xs text-stone-500">•</span>
            <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
              {event.city} ({event.cityTier})
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 mb-2">
            {event.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 dark:text-stone-300">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {event.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {daysLeft >= 0 ? `${daysLeft} days to go` : `${Math.abs(daysLeft)} days ago (Reconciliation)`}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              {event.guestCount} planned guests
            </span>
            {subEvents.length > 0 && (
              <span className="bg-white/80 dark:bg-stone-800 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700 font-medium">
                {subEvents.length} functions
              </span>
            )}
          </div>
        </div>

        {/* Quick actions buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setActiveTab('timeline')}
            className="text-xs h-8"
          >
            Tasks ({tasks.filter(t => t.status === 'done').length}/{tasks.length})
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setActiveTab('budget')}
            className="text-xs h-8"
          >
            Budget ({formatMoney((event.budget || event.budgetTarget) as any, 'INR', { compact: true })})
          </Button>
        </div>
      </div>

      {/* Main Grid: Readiness Bloom & Budget Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReadinessBloom readiness={readiness} />
        <BudgetBar summary={budgetSummary} />
      </div>

      {/* Meteorological Forecast & Climate Watch */}
      <WeatherWidget />

      {/* Bottom Grid: Next 7 Days Deadlines & Top Risks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next 7 Days / Upcoming Deadlines (TSK-05) */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Deadlines Requiring Attention
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('timeline')}
                className="text-xs h-7"
              >
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="text-xs text-stone-500 py-6 text-center bg-stone-50 dark:bg-stone-800/20 rounded-lg">
                No immediate deadlines in the next 7 days. You are ahead of schedule!
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.slice(0, 5).map((task) => {
                  const isOverdue = task.dueDate < today;
                  return (
                    <div
                      key={task.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                        isOverdue
                          ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20'
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <button
                          onClick={() => handleQuickCompleteTask(task.id, task.title)}
                          className="w-4 h-4 rounded border border-stone-400 hover:border-emerald-500 hover:bg-emerald-50 flex-shrink-0 flex items-center justify-center text-white"
                          title="Mark task complete"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-stone-300 hover:text-emerald-600" />
                        </button>
                        <div className="truncate">
                          <span className="font-semibold text-stone-900 dark:text-stone-100 block truncate">
                            {task.title}
                          </span>
                          <span className="text-[10px] text-stone-500">
                            {task.category} • Due: {task.dueDate}
                          </span>
                        </div>
                      </div>

                      <StatusPill variant={isOverdue ? 'danger' : task.priority === 'critical' ? 'danger' : 'neutral'}>
                        {isOverdue ? 'Overdue' : task.priority}
                      </StatusPill>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Top Risks Card (INT-02) */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Active Risk Register
                </h3>
              </div>
              <span className="text-xs text-stone-500 font-mono">
                {topRisks.length} active risks
              </span>
            </div>

            {topRisks.length === 0 ? (
              <div className="text-xs text-stone-500 py-6 text-center bg-stone-50 dark:bg-stone-800/20 rounded-lg">
                No active critical risks recorded. All contingency flags resolved.
              </div>
            ) : (
              <div className="space-y-2">
                {topRisks.map((risk) => (
                  <div
                    key={risk.id}
                    className="p-3 rounded-lg border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {risk.title}
                      </span>
                      <StatusPill variant={risk.severity === 'critical' ? 'danger' : 'warning'}>
                        {risk.severity}
                      </StatusPill>
                    </div>

                    {risk.mitigationPlan && (
                      <p className="text-[11px] text-stone-600 dark:text-stone-300">
                        <strong>Mitigation:</strong> {risk.mitigationPlan}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1">
                      <span>Status: {risk.status}</span>
                      <span>Source: {risk.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
