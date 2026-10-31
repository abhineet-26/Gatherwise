import type { BaseCommand, WorkspaceState } from 'shared/commands/types';
import { AI_ALLOWED_COMMANDS } from 'shared/commands/types';
import { previewImpact, type ImpactPreview } from 'shared/commands/preview';
import { asIsoDate } from 'shared/domain/time/dates';
import type { ProposalItem, AiContext } from './types';

export interface ValidationOutcome {
  valid: boolean;
  proposals: ProposalItem[];
  errors: string[];
}

export function validateAndDryRunProposals(
  rawProposals: { title?: string; whyThis?: string; commands: BaseCommand[] }[],
  context: AiContext,
  userMessage: string
): ValidationOutcome {
  const errors: string[] = [];
  const validProposals: ProposalItem[] = [];

  // Reconstruct a lightweight WorkspaceState for previewImpact
  const workspaceSnapshot: WorkspaceState = {
    event: {
      id: context.event.id,
      name: `${context.event.type} in ${context.event.city}`,
      type: context.event.type as any,
      city: context.event.city,
      date: asIsoDate(context.event.date),
      budgetTarget: context.event.budgetTarget as any,
      budget: context.event.budgetTarget as any,
      contingencyPct: context.event.contingencyPct,
      guestCount: context.guestAggregates.totalGuests,
      createdAt: context.today,
      updatedAt: context.today,
    },
    subEvents: context.subEvents.map((s, idx) => ({
      id: s.id,
      eventId: context.event.id,
      name: s.name,
      date: asIsoDate(s.date),
      kind: 'ceremony',
      order: idx,
    })),
    budgetLines: context.budgetLines.map(b => ({
      id: b.id,
      eventId: context.event.id,
      category: b.category,
      estimate: b.estimate as any,
      basis: 'template',
    })),
    commitments: context.commitments.map(c => ({
      id: c.id,
      eventId: context.event.id,
      budgetLineId: c.budgetLineId,
      amount: c.amount as any,
      status: c.status as any,
    })),
    payments: context.payments.map(p => ({
      id: p.id,
      eventId: context.event.id,
      budgetLineId: p.budgetLineId,
      amount: p.amount as any,
      status: p.status as any,
      dueDate: p.dueDate ? asIsoDate(p.dueDate) : undefined,
    })),
    tasks: context.tasks.map(t => ({
      id: t.id,
      eventId: context.event.id,
      title: t.title,
      category: t.category,
      priority: t.priority as any,
      dueDate: asIsoDate(t.dueDate),
      status: t.status as any,
      dueDateLocked: t.dueDateLocked,
    })),
    vendors: (context.vendors || []).map(v => ({
      id: v.id,
      eventId: context.event.id,
      name: v.name,
      category: v.category,
      status: v.status as any,
    })),
    quotes: context.quotes.map(q => ({
      id: q.id,
      eventId: context.event.id,
      vendorId: q.vendorId,
      title: q.title,
      status: q.status as any,
    })),
    guests: [],
    risks: context.risks.map(r => ({
      id: r.id,
      eventId: context.event.id,
      title: r.title,
      severity: r.severity as any,
      status: r.status as any,
    })),
    activity: [],
  };

  const today = asIsoDate(context.today);

  for (const raw of rawProposals) {
    const commands = raw.commands || [];
    if (commands.length === 0) continue;

    let hasViolations = false;
    let netNewEstimatePaise = 0;

    for (const cmd of commands) {
      // 1. Allow-list check
      if (!AI_ALLOWED_COMMANDS.has(cmd.type)) {
        errors.push(`AI command "${cmd.type}" is forbidden by security policy.`);
        hasViolations = true;
        break;
      }

      // 2. Invariant checks: locked tasks and lines
      if (cmd.type === 'UPDATE_TASK') {
        const taskId = cmd.payload['id'] as string;
        const task = context.tasks.find(t => t.id === taskId);
        if (task?.dueDateLocked && cmd.payload['dueDate'] && cmd.payload['dueDate'] !== task.dueDate) {
          errors.push(`Cannot move dueDate of locked task "${task.title}".`);
          hasViolations = true;
          break;
        }
      }

      if (cmd.type === 'UPDATE_BUDGET_LINE') {
        const lineId = cmd.payload['id'] as string;
        const line = context.budgetLines.find(b => b.id === lineId);
        if (line?.locked) {
          errors.push(`Cannot modify estimate of locked budget line "${line.category}".`);
          hasViolations = true;
          break;
        }
        const newEstimate = cmd.payload['estimatePaise'] !== undefined ? cmd.payload['estimatePaise'] : cmd.payload['estimate'];
        if (newEstimate !== undefined && line) {
          netNewEstimatePaise += (Number(newEstimate) - line.estimate);
        }
      }
    }

    if (hasViolations) continue;

    // 3. New-Money Rule check (AI-DESIGN.md §8)
    // If net new money > 0, the number must appear in the user's message
    if (netNewEstimatePaise > 0) {
      const rupeeAmountStr = String(Math.round(netNewEstimatePaise / 100));
      const userMessageClean = userMessage.replace(/[,.]/g, '');
      if (!userMessageClean.includes(rupeeAmountStr)) {
        errors.push(
          `New-money rule violated: Proposal attempts to introduce ₹${(netNewEstimatePaise / 100).toLocaleString('en-IN')} not specified by user.`
        );
        continue;
      }
    }

    // 4. Calculate deterministic impact using pure domain previewImpact
    const impact: ImpactPreview = previewImpact(workspaceSnapshot, commands, today);

    validProposals.push({
      id: `prop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: raw.title || 'Recommended Action',
      whyThis: raw.whyThis || 'Generated by GatherWise Copilot',
      commands,
      impact,
    });
  }

  return {
    valid: errors.length === 0,
    proposals: validProposals,
    errors,
  };
}
