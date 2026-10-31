import type { Task, BudgetLine, Commitment, Payment, Guest, Risk } from '../../schemas';
import type { EssentialDef } from '../../planning/types';
import { type IsoDate, daysBetween } from '../time/dates';
import { computeBudgetSummary } from '../budget/budget';
import { minor } from '../money/money';

export interface ReadinessDimension {
  name: 'tasks' | 'essentials' | 'money' | 'guests' | 'safetyNet';
  label: string;
  maxPoints: number;
  score: number;
  expected: number;
}

export interface ReadinessResult {
  score: number; // 0-100
  expected: number; // 0-100
  pace: number; // score - expected
  paceLabel: 'On track' | 'Slightly behind' | 'Behind';
  dimensions: ReadinessDimension[];
  nextBestActions: {
    title: string;
    gain: number;
    effort: 'S' | 'M' | 'L';
  }[];
}

export function computeReadiness(input: {
  eventDate: IsoDate;
  today: IsoDate;
  budgetTarget: number;
  contingencyPct: number;
  tasks: Task[];
  essentials: EssentialDef[];
  budgetLines: BudgetLine[];
  commitments: Commitment[];
  payments: Payment[];
  guests: Guest[];
  risks: Risk[];
}): ReadinessResult {
  const { eventDate, today, tasks, essentials, budgetLines, commitments, payments, guests, risks } = input;
  const daysToEvent = daysBetween(today, eventDate);

  // 1. Tasks (35 pts)
  const taskWeight = (p: Task['priority']) => {
    switch (p) {
      case 'critical': return 3;
      case 'high': return 2;
      case 'medium': return 1;
      case 'low': return 0.5;
    }
  };

  const activeTasks = tasks.filter(t => t.status !== 'skipped');
  const totalTaskWeight = activeTasks.reduce((acc, t) => acc + taskWeight(t.priority), 0);
  const doneTaskWeight = activeTasks
    .filter(t => t.status === 'done')
    .reduce((acc, t) => acc + taskWeight(t.priority), 0);

  const taskScore = totalTaskWeight > 0 ? (doneTaskWeight / totalTaskWeight) * 35 : 35;

  const expectedTaskWeight = activeTasks
    .filter(t => t.status === 'done' || t.dueDate <= today)
    .reduce((acc, t) => acc + taskWeight(t.priority), 0);
  const expectedTaskScore = totalTaskWeight > 0 ? (expectedTaskWeight / totalTaskWeight) * 35 : 35;

  // 2. Essentials (25 pts)
  const activeCommitmentCategories = new Set(
    commitments
      .filter(c => c.status === 'active')
      .map(c => {
        const line = budgetLines.find(b => b.id === c.budgetLineId);
        return line ? line.category : '';
      })
  );

  let totalEssentialWeight = 0;
  let securedEssentialWeight = 0;
  let expectedEssentialWeight = 0;

  for (const ess of essentials) {
    const w = ess.weight;
    totalEssentialWeight += w;
    const isSecured = activeCommitmentCategories.has(ess.category);
    if (isSecured) securedEssentialWeight += w;
    if (isSecured || daysToEvent <= ess.bookByDays) {
      expectedEssentialWeight += w;
    }
  }

  const essentialScore = totalEssentialWeight > 0 ? (securedEssentialWeight / totalEssentialWeight) * 25 : 25;
  const expectedEssentialScore = totalEssentialWeight > 0 ? (expectedEssentialWeight / totalEssentialWeight) * 25 : 25;

  // 3. Money (20 pts)
  const budgetSummary = computeBudgetSummary({
    target: minor(input.budgetTarget),
    contingencyPct: input.contingencyPct,
    lines: budgetLines.map(b => ({ id: b.id, category: b.category, estimate: minor(b.estimate) })),
    commitments: commitments.map(c => ({
      id: c.id,
      budgetLineId: c.budgetLineId,
      amount: minor(c.amount),
      status: (c.status === 'cancelled' ? 'cancelled' : 'active') as 'active' | 'cancelled',
    })),
    payments: payments.map(p => ({
      id: p.id,
      budgetLineId: p.budgetLineId,
      commitmentId: p.commitmentId,
      kind: (p.isRefund ? 'refund' : 'expense') as 'refund' | 'expense',
      amount: minor(p.amount),
      status: (p.status === 'paid' ? 'paid' : p.status === 'cancelled' ? 'cancelled' : 'planned') as 'planned' | 'paid' | 'cancelled',
      dueDate: p.dueDate,
      paidDate: p.paidDate,
    })),
    today,
  });

  const healthFactor = budgetSummary.status === 'healthy' ? 1.0 : budgetSummary.status === 'tight' ? 0.85 : 0.5;
  const overduePenalty = budgetSummary.overduePayments.length * 0.1;
  const coverageRatio = budgetSummary.totals.projected > 0 ? Math.min(1, budgetSummary.totals.committed / budgetSummary.totals.projected) : 0;
  const moneyScore = Math.max(0, coverageRatio * healthFactor - overduePenalty) * 20;

  const expectedCoverage = Math.max(0, Math.min(0.9, 1 - daysToEvent / 180));
  const expectedMoneyScore = Math.max(0, expectedCoverage * healthFactor) * 20;

  // 4. Guests (10 pts)
  const totalInvited = guests.reduce((sum, g) => sum + g.partySize, 0);
  let guestScore = 10;
  let expectedGuestScore = 10;

  if (totalInvited > 0) {
    const invitesSent = guests.filter(g => g.inviteSent === 'sent').reduce((sum, g) => sum + g.partySize, 0);
    const repliesReceived = guests.filter(g => Object.values(g.invitations).some(i => i.status !== 'pending'))
      .reduce((sum, g) => sum + g.partySize, 0);

    const sentShare = invitesSent / totalInvited;
    const replyShare = repliesReceived / totalInvited;
    guestScore = (0.5 * sentShare + 0.5 * replyShare) * 10;

    const expectedSent = daysToEvent <= 45 ? 1.0 : Math.max(0, Math.min(1, 1 - (daysToEvent - 45) / 60));
    const expectedReply = Math.max(0, Math.min(0.9, 1 - daysToEvent / 60));
    expectedGuestScore = (0.5 * expectedSent + 0.5 * expectedReply) * 10;
  }

  // 5. Safety Net (10 pts)
  const openRisks = risks.filter(r => r.status === 'open');
  const criticalCount = openRisks.filter(r => r.severity === 'critical').length;
  const highCount = openRisks.filter(r => r.severity === 'high').length;
  const mediumCount = openRisks.filter(r => r.severity === 'medium').length;

  const riskDeduction = 0.4 * criticalCount + 0.2 * highCount + 0.05 * mediumCount;
  const safetyNetScore = Math.max(0, 1 - riskDeduction) * 10;
  const expectedSafetyNetScore = 10;

  // Dimensions
  const dimensions: ReadinessDimension[] = [
    { name: 'tasks', label: 'Tasks Completed', maxPoints: 35, score: Math.round(taskScore * 10) / 10, expected: Math.round(expectedTaskScore * 10) / 10 },
    { name: 'essentials', label: 'Essentials Secured', maxPoints: 25, score: Math.round(essentialScore * 10) / 10, expected: Math.round(expectedEssentialScore * 10) / 10 },
    { name: 'money', label: 'Budget Commitment', maxPoints: 20, score: Math.round(moneyScore * 10) / 10, expected: Math.round(expectedMoneyScore * 10) / 10 },
    { name: 'guests', label: 'Guest & RSVPs', maxPoints: 10, score: Math.round(guestScore * 10) / 10, expected: Math.round(expectedGuestScore * 10) / 10 },
    { name: 'safetyNet', label: 'Safety Net', maxPoints: 10, score: Math.round(safetyNetScore * 10) / 10, expected: expectedSafetyNetScore },
  ];

  const totalScore = Math.min(100, Math.max(0, Math.round(taskScore + essentialScore + moneyScore + guestScore + safetyNetScore)));
  const totalExpected = Math.min(100, Math.max(0, Math.round(expectedTaskScore + expectedEssentialScore + expectedMoneyScore + expectedGuestScore + expectedSafetyNetScore)));
  const pace = totalScore - totalExpected;

  const paceLabel: ReadinessResult['paceLabel'] =
    pace >= -5 ? 'On track' : pace >= -15 ? 'Slightly behind' : 'Behind';

  // Next Best Actions
  const candidates: { title: string; gain: number; effort: 'S' | 'M' | 'L' }[] = [];
  const todoCritical = tasks.filter(t => t.status === 'todo' && t.priority === 'critical');
  for (const t of todoCritical.slice(0, 2)) {
    candidates.push({ title: `Complete: ${t.title}`, gain: 3.5, effort: t.effort });
  }

  for (const ess of essentials) {
    if (!activeCommitmentCategories.has(ess.category)) {
      candidates.push({ title: `Secure ${ess.category} vendor quote/commitment`, gain: 4.0, effort: 'M' });
      break;
    }
  }

  if (openRisks.length > 0) {
    const topRisk = openRisks[0];
    if (topRisk) {
      candidates.push({ title: `Resolve risk: ${topRisk.title}`, gain: 2.0, effort: 'S' });
    }
  }

  return {
    score: totalScore,
    expected: totalExpected,
    pace,
    paceLabel,
    dimensions,
    nextBestActions: candidates.slice(0, 3),
  };
}
