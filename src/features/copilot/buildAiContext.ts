import type { WorkspaceState } from 'shared/commands/types';
import type { AiContext } from 'shared/ai/types';
import { daysBetween, asIsoDate } from 'shared/domain/time/dates';

/**
 * Builds PII-minimised context for AI Copilot (AI-DESIGN.md §4).
 * Strips all guest names, phones, emails, addresses and private notes.
 */
export function buildAiContext(state: WorkspaceState, todayIso?: string): AiContext {
  const today = asIsoDate(todayIso || new Date().toISOString().slice(0, 10));
  const daysToEvent = daysBetween(today, asIsoDate(state.event.date));

  // Calculate guest aggregates anonymously
  let totalGuests = 0;
  let confirmedYes = 0;
  let unrepliedPending = 0;
  const dietaryCounts: Record<string, number> = {};

  for (const guest of state.guests) {
    const count = guest.partySize || 1;
    totalGuests += count;

    // Check RSVPs across invitations
    const invitations = Object.values(guest.invitations || {});
    const hasAttending = invitations.some(inv => inv.status === 'attending');
    const hasPending = invitations.length === 0 || invitations.some(inv => inv.status === 'pending');

    if (hasAttending) {
      confirmedYes += count;
    } else if (hasPending) {
      unrepliedPending += count;
    }

    if (guest.dietary) {
      if (Array.isArray(guest.dietary)) {
        for (const d of guest.dietary) {
          dietaryCounts[d] = (dietaryCounts[d] || 0) + count;
        }
      } else if (typeof guest.dietary === 'string' && guest.dietary !== 'regular') {
        dietaryCounts[guest.dietary] = (dietaryCounts[guest.dietary] || 0) + count;
      }
    }
  }

  const budgetTarget = Number((state.event as any).budgetTargetPaise ?? state.event.budgetTarget ?? 0);

  return {
    event: {
      id: state.event.id,
      type: state.event.type,
      subtype: state.event.subtype,
      date: state.event.date,
      daysToEvent,
      city: state.event.city,
      budgetTarget,
      contingencyPct: state.event.contingencyPct ?? 7,
      setting: state.event.setting,
      priorities: (state.event.priorities || []) as string[],
      dietaryTags: (state.event.dietary || []) as string[],
    },
    subEvents: state.subEvents.map(s => ({
      id: s.id,
      name: s.name,
      date: s.date,
    })),
    budgetLines: state.budgetLines.map(b => ({
      id: b.id,
      category: b.category,
      estimate: Number((b as any).estimatePaise ?? b.estimate ?? 0),
      locked: Boolean((b as any).isLocked ?? (b as any).locked),
    })),
    commitments: state.commitments.map(c => ({
      id: c.id,
      budgetLineId: c.budgetLineId,
      amount: Number((c as any).agreedAmountPaise ?? c.amount ?? 0),
      status: c.status || 'active',
    })),
    payments: state.payments.map(p => ({
      id: p.id,
      budgetLineId: p.budgetLineId || 'general',
      amount: Number((p as any).amountPaise ?? p.amount ?? 0),
      status: p.status || 'scheduled',
      dueDate: p.dueDate,
    })),
    vendors: (state.vendors || []).map(v => ({
      id: v.id,
      name: v.name,
      category: v.category,
      status: v.status || 'shortlisted',
    })),
    quotes: (state.quotes || []).map(q => ({
      id: q.id,
      vendorId: q.vendorId,
      title: q.title,
      pricingModel: (q as any).pricingModel || ((q as any).pricing?.model === 'per_head' ? 'per_person' : 'fixed'),
      baseAmount: Number((q as any).baseAmountPaise ?? (q as any).pricing?.baseAmount ?? (q as any).pricing?.unit ?? (q as any).baseAmount ?? 0),
      taxMode: q.taxMode || 'exclusive',
      gstPct: q.gstPct,
      inclusions: (q.inclusions as Record<string, boolean>) || {},
      validUntil: q.validUntil,
      status: q.status || 'received',
    })),
    tasks: state.tasks.map(t => ({
      id: t.id,
      title: t.title,
      category: t.category,
      priority: t.priority || 'medium',
      dueDate: t.dueDate,
      status: t.status || 'todo',
      dueDateLocked: Boolean((t as any).dueDateLocked ?? (t as any).isLocked),
      assigned: Boolean((t as any).assignee ?? (t as any).assigned),
    })),
    risks: state.risks.map(r => ({
      id: r.id,
      title: r.title,
      severity: r.severity,
      status: r.status || 'open',
    })),
    guestAggregates: {
      totalGuests,
      confirmedYes,
      unrepliedPending,
      dietaryCounts,
    },
    today,
  };
}
