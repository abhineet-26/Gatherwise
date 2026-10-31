import type { AiContext, ToolResult } from '../types';
import { computeBudgetSummary } from 'shared/domain/budget/budget';
import { formatMoney, minor } from 'shared/domain/money/money';
import { asIsoDate } from 'shared/domain/time/dates';
import { compareQuotes, type QuoteInput } from 'shared/domain/quotes/quotes';
import { estimateAttendance, DEFAULT_ATTENDANCE } from 'shared/domain/guests/headcount';
import { BENCHMARKS, type Benchmark } from 'shared/planning/benchmarks';
import type { BaseCommand } from 'shared/commands/types';

export function executeTool(name: string, args: Record<string, unknown>, context: AiContext): ToolResult {
  switch (name) {
    case 'get_event_overview': {
      return {
        toolName: name,
        data: {
          type: context.event.type,
          city: context.event.city,
          date: context.event.date,
          daysToEvent: context.event.daysToEvent,
          budgetTargetPaise: context.event.budgetTarget,
          priorities: context.event.priorities,
          totalGuests: context.guestAggregates.totalGuests,
          confirmedYes: context.guestAggregates.confirmedYes,
          subEventsCount: context.subEvents.length,
        },
        display: {
          budgetTarget: formatMoney(context.event.budgetTarget as any),
          daysLeft: `${context.event.daysToEvent} days left`,
          headcount: `${context.guestAggregates.confirmedYes} confirmed of ${context.guestAggregates.totalGuests} invited`,
        },
      };
    }

    case 'get_budget_summary': {
      const summary = computeBudgetSummary({
        target: context.event.budgetTarget as any,
        contingencyPct: context.event.contingencyPct,
        lines: context.budgetLines.map(b => ({ id: b.id, category: b.category, estimate: b.estimate as any })),
        commitments: context.commitments.map(c => ({
          id: c.id,
          budgetLineId: c.budgetLineId,
          amount: (c.amount ?? 0) as any,
          status: (c.status === 'cancelled' ? 'cancelled' : 'active') as 'active' | 'cancelled',
        })),
        payments: context.payments.map(p => ({
          id: p.id,
          budgetLineId: p.budgetLineId || 'general',
          kind: 'expense' as const,
          amount: (p.amount ?? 0) as any,
          status: (p.status === 'paid' ? 'paid' : p.status === 'cancelled' ? 'cancelled' : 'planned') as 'planned' | 'paid' | 'cancelled',
          dueDate: p.dueDate ? asIsoDate(p.dueDate) : undefined,
        })),
        today: asIsoDate(context.today),
      });

      return {
        toolName: name,
        data: {
          status: summary.status,
          targetPaise: summary.target,
          projectedPaise: summary.totals.projected,
          committedPaise: summary.totals.committed,
          paidPaise: summary.totals.paid,
          remainingToTargetPaise: summary.remainingToTarget,
          variancePaise: summary.remainingToTarget,
          overduePaymentsCount: summary.overduePayments.length,
        },
        display: {
          target: formatMoney(summary.target),
          projected: formatMoney(summary.totals.projected),
          committed: formatMoney(summary.totals.committed),
          paid: formatMoney(summary.totals.paid),
          remaining: formatMoney(summary.remainingToTarget),
          status: summary.status,
        },
      };
    }

    case 'list_tasks': {
      const filter = (args['filter'] as string) || 'all';
      const limit = Math.min(Number(args['limit']) || 20, 30);

      let filtered = context.tasks;
      if (filter === 'overdue') {
        filtered = filtered.filter(t => t.status !== 'done' && t.dueDate < context.today);
      } else if (filter === 'critical') {
        filtered = filtered.filter(t => t.priority === 'critical' && t.status !== 'done');
      } else if (filter === 'due_soon') {
        filtered = filtered.filter(t => t.status !== 'done' && t.dueDate >= context.today);
      }

      const tasksList = filtered.slice(0, limit).map(t => ({
        id: t.id,
        title: t.title,
        category: t.category,
        priority: t.priority,
        dueDate: t.dueDate,
        status: t.status,
      }));

      return {
        toolName: name,
        data: {
          filter,
          totalMatching: filtered.length,
          tasks: tasksList,
        },
        display: {
          count: `${filtered.length} tasks matching "${filter}"`,
        },
      };
    }

    case 'list_risks': {
      const openRisks = context.risks.filter(r => r.status !== 'resolved');
      return {
        toolName: name,
        data: {
          openRisksCount: openRisks.length,
          risks: openRisks.map(r => ({ id: r.id, title: r.title, severity: r.severity })),
        },
        display: {
          openCount: `${openRisks.length} open risks`,
        },
      };
    }

    case 'compare_quotes': {
      const category = (args['category'] as string) || 'catering';
      const matchingQuotes = context.quotes.filter(q => {
        const v = context.vendors.find(vend => vend.id === q.vendorId);
        return v?.category === category;
      });

      if (matchingQuotes.length === 0) {
        return {
          toolName: name,
          data: { category, quotesCount: 0, message: `No quotes found for category ${category}` },
        };
      }

      const domainQuotes: QuoteInput[] = matchingQuotes.map(q => ({
        id: q.id,
        vendorId: q.vendorId,
        category,
        pricing: q.pricingModel === 'per_head'
          ? { type: 'per_head', unit: minor(q.baseAmount) }
          : { type: 'fixed', amount: minor(q.baseAmount) },
        taxMode: q.taxMode as any,
        gstPct: q.gstPct,
        inclusions: q.inclusions,
        validUntil: q.validUntil ? asIsoDate(q.validUntil) : undefined,
      }));

      const normCtx = {
        headcount: context.guestAggregates.totalGuests || 300,
        defaultGstPct: 18,
        today: asIsoDate(context.today),
      };

      const comparison = compareQuotes(domainQuotes, normCtx);

      return {
        toolName: name,
        data: {
          category,
          headcount: normCtx.headcount,
          comparable: comparison.comparable,
          ranked: comparison.ranked.map(r => {
            const original = matchingQuotes.find(mq => mq.id === r.quoteId);
            return {
              quoteId: r.quoteId,
              title: original?.title,
              score: r.score,
              payableLikelyPaise: r.payableLikely,
              flags: r.flags,
            };
          }),
        },
        display: {
          cheapest: comparison.ranked[0] ? formatMoney(comparison.ranked[0].payableLikely) : 'N/A',
          summary: `${comparison.ranked.length} quotes compared at ${normCtx.headcount} guests`,
        },
      };
    }

    case 'get_headcount_plan': {
      const counts = {
        yes: context.guestAggregates.confirmedYes,
        maybe: 0,
        pending: context.guestAggregates.unrepliedPending,
        declined: 0,
      };
      const estimate = estimateAttendance(counts, DEFAULT_ATTENDANCE);

      return {
        toolName: name,
        data: {
          yes: counts.yes,
          pending: counts.pending,
          low: estimate.low,
          likely: estimate.likely,
          high: estimate.high,
          cateringHeadcount: estimate.cateringHeadcount,
        },
        display: {
          cateringHeadcount: `${estimate.cateringHeadcount} plates (with buffer)`,
          likelyTurnout: `${estimate.likely} guests expected`,
        },
      };
    }

    case 'get_benchmarks': {
      const topic = (args['topic'] as string)?.toLowerCase() || '';
      const matches = BENCHMARKS.filter((b: Benchmark) => 
        b.label.toLowerCase().includes(topic) || b.id.toLowerCase().includes(topic)
      );

      return {
        toolName: name,
        data: {
          topic,
          benchmarks: (matches.length > 0 ? matches : BENCHMARKS.slice(0, 4)).map((b: Benchmark) => ({
            id: b.id,
            label: b.label,
            value: b.value,
            note: b.sourceNote,
          })),
        },
      };
    }

    // Proposal Tools (Drafting commands for human review)
    case 'propose_tasks': {
      const items = (args['tasks'] as any[]) || [];
      const commands: BaseCommand[] = items.map((item, idx) => ({
        type: 'ADD_TASK',
        eventId: context.event.id,
        payload: {
          id: `task_ai_${Date.now()}_${idx}`,
          eventId: context.event.id,
          title: String(item.title || 'New Task'),
          category: String(item.category || 'general'),
          priority: String(item.priority || 'medium'),
          dueDate: String(item.dueDate || context.event.date),
          status: 'todo',
          origin: { kind: 'assistant' },
          whyExplanation: String(item.whyThis || 'Recommended by GatherWise Copilot'),
        },
        meta: { actor: 'assistant_proposal', summary: `Add task "${item.title}"` },
      }));

      return {
        toolName: name,
        data: { proposedCount: commands.length, commands },
        display: { summary: `Proposed adding ${commands.length} new task(s)` },
      };
    }

    case 'propose_budget_reallocation': {
      const { fromCategory, toCategory, amountPaise } = args as {
        fromCategory: string;
        toCategory: string;
        amountPaise: number;
      };

      const fromLine = context.budgetLines.find(b => b.category === fromCategory);
      const toLine = context.budgetLines.find(b => b.category === toCategory);

      const commands: BaseCommand[] = [];
      if (fromLine) {
        commands.push({
          type: 'UPDATE_BUDGET_LINE',
          eventId: context.event.id,
          payload: { id: fromLine.id, estimate: Math.max(0, fromLine.estimate - amountPaise) },
          meta: { actor: 'assistant_proposal', summary: `Reduce ${fromCategory} by ${formatMoney(amountPaise as any)}` },
        });
      }
      if (toLine) {
        commands.push({
          type: 'UPDATE_BUDGET_LINE',
          eventId: context.event.id,
          payload: { id: toLine.id, estimate: toLine.estimate + amountPaise },
          meta: { actor: 'assistant_proposal', summary: `Increase ${toCategory} by ${formatMoney(amountPaise as any)}` },
        });
      }

      return {
        toolName: name,
        data: { netNewMoney: 0, commands },
        display: { summary: `Reallocate ${formatMoney(amountPaise as any)} from ${fromCategory} to ${toCategory}` },
      };
    }

    case 'propose_payment_record': {
      const { vendorName, amountPaise, mode } = args as {
        vendorName: string;
        amountPaise: number;
        mode?: string;
      };
      const vendor = context.vendors.find(v => v.name.toLowerCase().includes(vendorName.toLowerCase()));

      const command: BaseCommand = {
        type: 'RECORD_PAYMENT',
        eventId: context.event.id,
        payload: {
          id: `pay_ai_${Date.now()}`,
          eventId: context.event.id,
          amount: amountPaise,
          method: mode || 'upi',
          status: 'paid',
          notes: `Disbursement to ${vendorName}`,
        },
        meta: { actor: 'assistant_proposal', summary: `Record payment of ${formatMoney(amountPaise as any)} to ${vendorName}` },
      };

      return {
        toolName: name,
        data: { vendorFound: !!vendor, commands: [command] },
        display: { summary: `Proposed recording ${formatMoney(amountPaise as any)} payment to ${vendorName}` },
      };
    }

    default:
      return {
        toolName: name,
        data: { error: `Tool ${name} is not recognized` },
      };
  }
}
