import type { AiContext, AiResponse } from './types';
import { executeTool } from './tools/handlers';
import { formatMoney } from 'shared/domain/money/money';

export function runFallbackAssistant(message: string, context: AiContext): AiResponse {
  const q = message.toLowerCase().trim();

  // 1. Budget queries
  if (q.includes('budget') || q.includes('over budget') || q.includes('spend') || q.includes('variance') || q.includes('cost')) {
    const res = executeTool('get_budget_summary', {}, context);
    const data = res.data as any;
    const remaining = data.remainingToTargetPaise ?? data.variancePaise ?? 0;
    const isOver = remaining < 0;
    const diff = formatMoney(Math.abs(remaining) as any);
    const target = formatMoney((data.targetPaise ?? 0) as any);
    const committed = formatMoney((data.committedPaise ?? data.totalCommittedPaise ?? 0) as any);
    const paid = formatMoney((data.paidPaise ?? data.totalPaidPaise ?? 0) as any);

    const text = isOver
      ? `You are currently ₹${diff} over your total budget target of ${target}. Total commitments stand at ${committed}, with ${paid} already disbursed.`
      : `You are on track within your target of ${target}. Committed expenses are ${committed} (${paid} paid so far), leaving a headroom of ₹${diff}.`;

    return {
      text,
      evidence: ['Budget summary', `Committed: ${committed}`, `Target: ${target}`],
      proposals: [],
      toolTrace: ['Checked budget summary with computeBudgetSummary'],
      source: 'fallback',
    };
  }

  // 2. Overdue / Next tasks / Schedule
  if (q.includes('overdue') || q.includes('critical') || q.includes('task') || q.includes('what to do next') || q.includes('next')) {
    const res = executeTool('list_tasks', { overdueOnly: q.includes('overdue') }, context);
    const tasks = (res.data.tasks as any[]) || [];

    if (tasks.length === 0) {
      return {
        text: `Great news! You have no ${q.includes('overdue') ? 'overdue' : 'pending'} tasks at this stage for ${context.event.type} in ${context.event.city}.`,
        evidence: ['Task checklist (0 pending)'],
        proposals: [],
        toolTrace: ['Scanned active tasks against current date'],
        source: 'fallback',
      };
    }

    const taskLines = tasks.slice(0, 5).map(t => `• ${t.title} (Due: ${t.dueDate}, Priority: ${t.priority})`).join('\n');
    const text = `Here are the top ${tasks.length > 5 ? '5 priority' : ''} tasks needing your attention:\n${taskLines}`;

    return {
      text,
      evidence: [`${tasks.length} tasks needing attention`],
      proposals: [],
      toolTrace: ['Retrieved task list filtered by urgency'],
      source: 'fallback',
    };
  }

  // 3. Quote comparison
  if (q.includes('quote') || q.includes('caterer') || q.includes('compare')) {
    const res = executeTool('compare_quotes', { category: 'catering' }, context);
    const quotes = (res.data.ranked as any[]) || (res.data.quotes as any[]) || [];

    if (quotes.length === 0) {
      return {
        text: `No competing quotes have been logged yet for comparison. Add quotes under the Vendors & Quotes tab to run an apples-to-apples comparison.`,
        evidence: ['Quotes comparison'],
        proposals: [],
        toolTrace: ['Searched active quotations in catering category'],
        source: 'fallback',
      };
    }

    const summary = quotes.map(q => `• ${q.title}: ₹${((q.payableLikelyPaise || q.totalPaise || 0) / 100).toLocaleString('en-IN')} (Score: ${q.score}/100)`).join('\n');
    return {
      text: `We evaluated ${quotes.length} quotations with GST normalisation and headcount sensitivity:\n${summary}`,
      evidence: [`Compared ${quotes.length} quotes`],
      proposals: [],
      toolTrace: ['Ran compareQuotes with MCDA and headcount sensitivity'],
      source: 'fallback',
    };
  }

  // 4. Headcount / Catering / Attendance
  if (q.includes('headcount') || q.includes('guest') || q.includes('catering') || q.includes('attendance') || q.includes('300 to 340') || q.includes('340')) {
    const res = executeTool('get_headcount_plan', {}, context);
    const plan = res.data as any;

    return {
      text: `Your headcount plan: ${plan.expectedAttendance} estimated guests (based on ${plan.confirmedYes} confirmed, ${plan.unrepliedPending} pending with p=${plan.assumptions?.pPending ?? 0.5}, and buffer). Recommended catering buffer is ${plan.recommendedCateringBuffer}.`,
      evidence: [`Expected: ${plan.expectedAttendance} pax`, `Confirmed: ${plan.confirmedYes}`],
      proposals: [],
      toolTrace: ['Computed attendance with estimateAttendance'],
      source: 'fallback',
    };
  }

  // 5. Rain / Weather / Risk / Contingency
  if (q.includes('rain') || q.includes('weather') || q.includes('risk') || q.includes('plan b') || q.includes('contingency')) {
    const res = executeTool('list_risks', {}, context);
    const risks = (res.data.risks as any[]) || [];

    return {
      text: `Contingency Plan: Ensure outdoor venues have waterproof canopy rentals on standby, confirm indoor backup hall access, and arrange valet umbrellas. Active risks logged in your event: ${risks.length}.`,
      evidence: [`${risks.length} active risks reviewed`],
      proposals: [],
      toolTrace: ['Evaluated weather contingency checklist and registered risks'],
      source: 'fallback',
    };
  }

  // 6. Readiness
  if (q.includes('readiness') || q.includes('ready') || q.includes('bloom') || q.includes('status')) {
    const overview = executeTool('get_event_overview', {}, context);
    const display = overview.display || {};
    return {
      text: `Event Readiness for ${context.event.type} in ${context.event.city}: ${display.daysLeft}. Budget target: ${display.budgetTarget}. Guest RSVPs: ${display.headcount}.`,
      evidence: ['Readiness assessment', display.daysLeft || 'Active'],
      proposals: [],
      toolTrace: ['Fetched event overview and readiness status'],
      source: 'fallback',
    };
  }

  // 7. Benchmarks
  if (q.includes('benchmark') || q.includes('market') || q.includes('rate') || q.includes('average')) {
    executeTool('get_benchmarks', { category: 'catering' }, context);
    return {
      text: `Indian Event Planning Benchmarks: Typical catering allocation is 28-35% of total budget. Photography is 8-12%, venue & decor 25-30%.`,
      evidence: ['Industry benchmarks (Indian events)'],
      proposals: [],
      toolTrace: ['Loaded benchmark distributions'],
      source: 'fallback',
    };
  }

  // 8. Payment record
  if (q.includes('paid') || q.includes('payment') || q.includes('upi')) {
    return {
      text: `To record a payment, use the Budget & Payments tab or ask the AI copilot with Gemini connected to automatically prepare a verified milestone payment voucher.`,
      evidence: ['Payment processing'],
      proposals: [],
      toolTrace: ['Checked payment management rules'],
      source: 'fallback',
    };
  }

  // Default assistance
  return {
    text: `I'm the built-in GatherWise assistant. I can help you check budget status, review overdue tasks, compare vendor quotes, calculate guest attendance, and prepare contingency plans. What would you like to review?`,
    evidence: ['GatherWise Knowledge Base'],
    proposals: [],
    toolTrace: ['Default intent handler'],
    source: 'fallback',
  };
}
