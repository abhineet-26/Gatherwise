import type { Risk, Event, Task, BudgetLine } from '../../schemas';
import type { RiskRule } from '../../planning/types';

export function evaluateAndMergeRisks(
  rules: RiskRule[],
  persistedRisks: Risk[],
  ctx: {
    event: Event;
    tasks: Task[];
    budgetLines: BudgetLine[];
    daysToEvent: number;
  }
): Risk[] {
  const result: Risk[] = [];
  const persistedMap = new Map(persistedRisks.map(r => [r.dedupeKey, r]));

  for (const rule of rules) {
    const isTriggered = rule.evaluate({
      event: ctx.event,
      tasks: ctx.tasks,
      budgetLines: ctx.budgetLines,
      risks: persistedRisks,
      daysToEvent: ctx.daysToEvent,
    });

    const existing = persistedMap.get(rule.id);

    if (isTriggered) {
      if (!existing) {
        // New risk instance
        result.push({
          id: `risk_${rule.id}`,
          eventId: ctx.event.id,
          dedupeKey: rule.id,
          ruleId: rule.id,
          title: rule.title,
          detail: `Identified by rules engine for ${ctx.event.type}`,
          severity: rule.severity,
          status: 'open',
          mitigation: rule.mitigation,
          source: 'rule',
          refs: [],
        });
      } else {
        // Existing decision merge
        let status = existing.status;
        if (existing.status === 'resolved') {
          // Re-opened because condition returned! (INV per §5.9)
          status = 'open';
        } else if (existing.status === 'accepted' && existing.decidedAtSeverity) {
          // If severity escalated, re-open
          const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
          if (severityOrder[rule.severity] > severityOrder[existing.decidedAtSeverity]) {
            status = 'open';
          }
        }

        result.push({
          ...existing,
          title: rule.title,
          severity: rule.severity,
          mitigation: rule.mitigation,
          status,
        });
      }
    } else if (existing && existing.source === 'user') {
      // User manual risks persist even if not in rules
      result.push(existing);
    }
  }

  return result;
}
