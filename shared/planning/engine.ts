import type { Event, Task, BudgetLine, SubEvent, Risk } from '../schemas';
import type { TemplatePack } from './types';
import { type IsoDate, daysBetween } from '../domain/time/dates';
import { percentOf, minor } from '../domain/money/money';
import { allocateByWeights } from '../domain/money/allocate';
import { planTaskDates, type PlannedTask } from '../domain/tasks/schedule';

export interface GeneratedPlan {
  subEvents: SubEvent[];
  budgetLines: BudgetLine[];
  tasks: Task[];
  risks: Risk[];
  infeasibleTasks: Task[];
}

export function generatePlan(
  event: Event,
  pack: TemplatePack,
  today: IsoDate
): GeneratedPlan {
  // 1. Budget Lines allocation
  const contingency = percentOf(minor(event.budgetTarget), event.contingencyPct);
  const spendable = minor(event.budgetTarget - contingency);

  const profile = pack.budgetProfiles.standard;
  const categories = pack.categories;
  const weights = categories.map(cat => profile[cat.id] ?? 0);

  const allocations = allocateByWeights(spendable, weights);

  const budgetLines: BudgetLine[] = categories.map((cat, idx) => ({
    id: `bl_${cat.id}`,
    eventId: event.id,
    category: cat.id,
    name: cat.label,
    estimate: allocations[idx] ?? 0,
    basis: 'template',
    scalesWithHeadcount: cat.scalesWithHeadcount,
    notes: `Calculated from ${pack.id} standard profile (${profile[cat.id]}% of spendable budget)`,
  }));

  // 2. Sub-events (Functions / Sessions)
  const preset = pack.presets.find(p => p.id === event.presetId) || pack.presets[0];
  const functionNames = preset ? preset.startingFunctions : ['Main Celebration'];

  const subEvents: SubEvent[] = functionNames.map((name, idx) => ({
    id: `se_${idx + 1}`,
    eventId: event.id,
    name,
    kind: idx === 0 ? 'ceremony' : 'reception',
    date: event.date,
    headcountMode: 'from_guests',
    order: idx,
  }));

  // 3. Filter Tasks applying appliesWhen
  const eligibleTemplates = pack.tasks.filter(t => {
    if (!t.appliesWhen) return true;
    try {
      return t.appliesWhen(event);
    } catch {
      return true;
    }
  });

  // Schedule using golden domain kernel
  const scheduled: PlannedTask[] = planTaskDates(
    eligibleTemplates.map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      leadDays: t.leadDays,
      minLeadDays: t.minLeadDays,
      dependsOn: t.after || [],
    })),
    { eventDate: event.date, today }
  );

  const scheduledMap = new Map<string, PlannedTask>(scheduled.map(s => [s.id, s]));

  const tasks: Task[] = eligibleTemplates.map(template => {
    const s = scheduledMap.get(template.id);
    const dueDate = s ? s.dueDate : event.date;
    const why = `Lead time ${template.leadDays} days before ${event.name} (${s?.feasibility || 'ok'})`;

    return {
      id: `task_${template.id}`,
      eventId: event.id,
      title: template.title,
      category: template.category,
      priority: template.priority,
      dueDate,
      dueDateLocked: false,
      status: 'todo',
      dependsOn: (template.after || []).map(a => `task_${a}`),
      effort: template.effort || 'M',
      origin: { kind: 'template', templateId: template.id },
      anchor: {
        to: 'event',
        leadDays: template.leadDays,
        minLeadDays: template.minLeadDays,
      },
      whyExplanation: why,
      notes: '',
    };
  });

  const infeasibleTasks = tasks.filter(t => {
    const origId = t.origin.templateId;
    const s = origId ? scheduledMap.get(origId) : undefined;
    return s?.feasibility === 'infeasible';
  });

  // 4. Initial Risk Evaluation
  const daysToEvent = daysBetween(today, event.date);
  const risks: Risk[] = [];

  for (const rule of pack.riskRules) {
    const isTriggered = rule.evaluate({
      event,
      tasks,
      budgetLines,
      risks: [],
      daysToEvent,
    });

    if (isTriggered) {
      risks.push({
        id: `risk_${rule.id}`,
        eventId: event.id,
        dedupeKey: rule.id,
        ruleId: rule.id,
        title: rule.title,
        detail: `Identified by planning engine for ${event.type} event.`,
        severity: rule.severity,
        status: 'open',
        mitigation: rule.mitigation,
        source: 'rule',
        refs: [],
      });
    }
  }

  return {
    subEvents,
    budgetLines,
    tasks,
    risks,
    infeasibleTasks,
  };
}
