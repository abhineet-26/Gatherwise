import { describe, it, expect, beforeEach } from 'vitest';
import { buildAiContext } from '../src/features/copilot/buildAiContext';
import { runFallbackAssistant } from '../server/ai/fallback';
import { auditNumbers } from '../server/ai/numberAudit';
import { validateAndDryRunProposals } from '../server/ai/proposalValidator';
import { AiOrchestrator, clearAiResponseCache } from '../server/ai/orchestrator';
import { FakeLlm } from '../server/ai/llm/fake';
import type { WorkspaceState } from 'shared/commands/types';
import { minor } from 'shared/domain/money/money';

function createMockWorkspace(): WorkspaceState {
  return {
    event: {
      id: 'evt-test-1',
      name: 'Priya & Rahul Wedding',
      type: 'wedding',
      city: 'Pune',
      date: '2026-11-24' as any,
      budgetTarget: minor(2500000),
      contingencyPct: 10,
      priorities: ['food', 'decor'] as any,
      dietary: ['jain', 'vegan'] as any,
      setting: 'outdoor',
      cityTier: 'tier2',
      venueStatus: 'booked',
      guestCount: 100,
      fundingMode: 'self_funded',
      attendanceModel: 'invite_list',
      audience: 'local',
      attendanceAssumptions: { pMaybe: 0.5, pPending: 0.8, bufferPct: 0.05 },
      style: { formality: 'formal', vibe: [] },
      accessibilityNeeds: [],
      culturalNotes: '',
      sideLabels: { a: 'Bride', b: 'Groom' },
      schemaVersion: 1,
      ownerId: 'demo',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    subEvents: [
      { id: 'se-1', eventId: 'evt-test-1', name: 'Sangeet', date: '2026-11-23' as any, order: 1 },
      { id: 'se-2', eventId: 'evt-test-1', name: 'Wedding', date: '2026-11-24' as any, order: 2 },
    ],
    budgetLines: [
      { id: 'bl-1', eventId: 'evt-test-1', category: 'catering', name: 'Catering', estimate: minor(800000), basis: 'template', scalesWithHeadcount: true },
      { id: 'bl-2', eventId: 'evt-test-1', category: 'decor', name: 'Mandap Decor', estimate: minor(400000), basis: 'template', scalesWithHeadcount: false, isLocked: true } as any,
    ],
    commitments: [
      { id: 'com-1', eventId: 'evt-test-1', vendorId: 'vnd-1', budgetLineId: 'bl-1', amount: minor(750000), status: 'active', createdAt: '' },
    ],
    payments: [
      { id: 'pay-1', eventId: 'evt-test-1', commitmentId: 'com-1', budgetLineId: 'bl-1', amount: minor(200000), dueDate: '2026-10-01' as any, status: 'paid', paidAt: '2026-10-01', method: 'upi', mode: 'upi', isRefund: false },
    ],
    vendors: [
      { id: 'vnd-1', eventId: 'evt-test-1', name: 'Royal Caterers', category: 'catering', status: 'contacted', userRating: 5 },
    ],
    quotes: [
      {
        id: 'quo-1',
        eventId: 'evt-test-1',
        vendorId: 'vnd-1',
        title: 'Royal Caterers Premium',
        pricing: { model: 'per_head', baseAmount: minor(1400) },
        taxMode: 'exclusive',
        gstPct: 18,
        status: 'received',
        inclusions: { welcomeDrink: true, dessertCounter: true },
        source: 'manual',
      },
    ],
    tasks: [
      {
        id: 'tsk-1',
        eventId: 'evt-test-1',
        title: 'Book bridal makeup artist',
        category: 'attire_beauty',
        priority: 'high',
        dueDate: '2026-10-15' as any,
        status: 'todo',
        isLocked: false,
        dueDateLocked: false,
        dependsOn: [],
        notes: '',
      },
      {
        id: 'tsk-2',
        eventId: 'evt-test-1',
        title: 'Finalise venue layout',
        category: 'venue',
        priority: 'critical',
        dueDate: '2026-09-01' as any,
        status: 'todo',
        isLocked: true,
        dueDateLocked: true,
        dependsOn: [],
        notes: '',
      },
    ],
    guests: [
      {
        id: 'gst-1',
        eventId: 'evt-test-1',
        name: 'Ramesh Sharma',
        phone: '+919820098200',
        contact: { phone: '+919820098200', email: 'ramesh@example.com' },
        notes: 'Needs first row seat near ramp',
        partySize: 4,
        childrenUnder5: 0,
        children5to12: 1,
        dietary: 'jain',
        side: 'a',
        inviteSent: 'sent',
        invitations: {
          'se-1': { invited: true, status: 'attending', confirmedParty: 4 },
          'se-2': { invited: true, status: 'attending', confirmedParty: 4 },
        },
        accessibility: ['wheelchair'],
      },
      {
        id: 'gst-2',
        eventId: 'evt-test-1',
        name: 'Sunita Mehra',
        phone: '+919811122233',
        contact: { phone: '+919811122233' },
        partySize: 2,
        childrenUnder5: 0,
        children5to12: 0,
        dietary: 'vegan',
        side: 'b',
        inviteSent: 'sent',
        invitations: {
          'se-1': { invited: true, status: 'pending' },
        },
        accessibility: [],
        notes: '',
      },
    ],
    risks: [
      { id: 'rsk-1', eventId: 'evt-test-1', title: 'Open lawn rain risk in late November', severity: 'medium', status: 'open' } as any,
    ],
    activity: [],
  };
}

describe('Phase 4: AI Copilot & Safety Layers', () => {
  beforeEach(() => {
    clearAiResponseCache();
  });

  it('strictly minimises PII in buildAiContext (never leaks names, contacts, notes)', () => {
    const ws = createMockWorkspace();
    const ctx = buildAiContext(ws, '2026-10-10');

    // Confirm anonymised aggregates are computed accurately
    expect(ctx.guestAggregates.totalGuests).toBe(6);
    expect(ctx.guestAggregates.confirmedYes).toBe(4);
    expect(ctx.guestAggregates.unrepliedPending).toBe(2);
    expect(ctx.guestAggregates.dietaryCounts).toEqual({ jain: 4, vegan: 2 });

    // Confirm NO guest names, phone numbers or private notes exist anywhere in context JSON
    const ctxJson = JSON.stringify(ctx);
    expect(ctxJson).not.toContain('Ramesh');
    expect(ctxJson).not.toContain('Sunita');
    expect(ctxJson).not.toContain('9820098200');
    expect(ctxJson).not.toContain('ramesh@example.com');
    expect(ctxJson).not.toContain('first row seat');
  });

  it('runs deterministic rule-based fallback assistant when Gemini is offline', () => {
    const ws = createMockWorkspace();
    const ctx = buildAiContext(ws, '2026-10-10');

    // Budget query
    const budgetRes = runFallbackAssistant('Are we over budget?', ctx);
    expect(budgetRes.source).toBe('fallback');
    expect(budgetRes.evidence.length).toBeGreaterThan(0);
    expect(budgetRes.text).toContain('₹');

    // Overdue tasks query
    const taskRes = runFallbackAssistant("What's overdue?", ctx);
    expect(taskRes.source).toBe('fallback');
    expect(taskRes.text).toContain('Book bridal makeup artist');

    // Quotes query
    const quoteRes = runFallbackAssistant('Compare my caterer quotes', ctx);
    expect(quoteRes.source).toBe('fallback');
    expect(quoteRes.toolTrace[0]).toContain('compareQuotes');
  });

  it('audits numbers and flags fabricated figures (Number Audit)', () => {
    const fakeToolResults = [
      {
        toolName: 'get_budget_summary',
        data: { targetPaise: 250000000, committedPaise: 75000000 },
        display: { target: '₹25,00,000', committed: '₹7,50,000' },
      },
    ];

    // Response cites actual known numbers
    const validAudit = auditNumbers('Your budget target is ₹25,00,000 and committed is ₹7,50,000.', 'Check budget', fakeToolResults);
    expect(validAudit).toEqual([]);

    // Response invents a number not present in tool results or user prompt
    const fakeAudit = auditNumbers('You spent ₹99,40,000 on flowers and 45% on music.', 'Check budget', fakeToolResults);
    expect(fakeAudit).toContain('₹99,40,000');
    expect(fakeAudit).toContain('45%');
  });

  it('enforces proposal invariants: command allow-list, locked lines, and new-money rule', () => {
    const ws = createMockWorkspace();
    const ctx = buildAiContext(ws, '2026-10-10');

    // 1. Unauthorized command type (e.g. DELETE_EVENT or arbitrary command)
    const unauthorized = validateAndDryRunProposals(
      [{ title: 'Delete event', whyThis: 'clean', commands: [{ type: 'DELETE_EVENT' as any, eventId: 'evt-test-1', payload: {} }] }],
      ctx,
      'clean up'
    );
    expect(unauthorized.valid).toBe(false);
    expect(unauthorized.errors[0]).toContain('forbidden');

    // 2. Modifying a locked budget line (bl-2 isLocked: true)
    const lockedLine = validateAndDryRunProposals(
      [{
        title: 'Reallocate decor',
        whyThis: 'save money',
        commands: [{ type: 'UPDATE_BUDGET_LINE', eventId: 'evt-test-1', payload: { id: 'bl-2', estimatePaise: minor(300000) } }],
      }],
      ctx,
      'reduce decor'
    );
    expect(lockedLine.valid).toBe(false);
    expect(lockedLine.errors[0]).toContain('locked budget line');

    // 3. New-money rule: cannot create net new rupee amount unless user specified it
    const netNewMoney = validateAndDryRunProposals(
      [{
        title: 'Inflate catering',
        whyThis: 'buffer',
        commands: [{ type: 'UPDATE_BUDGET_LINE', eventId: 'evt-test-1', payload: { id: 'bl-1', estimatePaise: minor(1200000) } }],
      }],
      ctx,
      'make it nicer' // user did NOT mention 1200000 or 12 lakh
    );
    expect(netNewMoney.valid).toBe(false);
    expect(netNewMoney.errors[0]).toContain('New-money rule');

    // 4. Valid zero-sum reallocation
    const zeroSum = validateAndDryRunProposals(
      [{
        title: 'Shift from catering to contingency',
        whyThis: 'balance',
        commands: [
          { type: 'UPDATE_BUDGET_LINE', eventId: 'evt-test-1', payload: { id: 'bl-1', estimatePaise: minor(750000) } }, // -50k
        ],
      }],
      ctx,
      'reduce catering by ₹50,000'
    );
    // User mentioned ₹50,000 so delta is explicitly authorized
    expect(zeroSum.valid).toBe(true);
  });

  it('orchestrator runs tool loop with FakeLlm and surfaces evidence chips & tool traces', async () => {
    const ws = createMockWorkspace();
    const ctx = buildAiContext(ws, '2026-10-10');

    const fakeLlm = new FakeLlm('normal');
    const orchestrator = new AiOrchestrator(fakeLlm);

    const res = await orchestrator.processChat('Are we over budget?', ctx);
    expect(res.source).toBe('gemini');
    expect(res.text).toContain('KNOWN: Your budget status is');
    expect(res.toolTrace).toContain('Called get_budget_summary');
    expect(res.evidence.length).toBeGreaterThan(0);
    expect(res.evidence.some(e => e.includes('25,00,000') || e.includes('25'))).toBe(true);
  });

  it('orchestrator safely detects malicious LLM invent mode and flags unverified numbers', async () => {
    const ws = createMockWorkspace();
    const ctx = buildAiContext(ws, '2026-10-10');

    const maliciousLlm = new FakeLlm('malicious_invent');
    const orchestrator = new AiOrchestrator(maliciousLlm);

    const res = await orchestrator.processChat('How much did we spend?', ctx);
    expect(res.unverifiedNumbers).toBeDefined();
    expect(res.unverifiedNumbers).toContain('₹89,45,210');
  });

  it('orchestrator seamlessly falls back to rule-based assistant on timeout or failure', async () => {
    const ws = createMockWorkspace();
    const ctx = buildAiContext(ws, '2026-10-10');

    const failingLlm = new FakeLlm('timeout');
    const orchestrator = new AiOrchestrator(failingLlm);

    const res = await orchestrator.processChat('Are we over budget?', ctx);
    expect(res.source).toBe('fallback');
    expect(res.text).toContain('₹');
  });

  it('Idea Studio delivers tailored concepts and filters by budget tier', () => {
    const ws = createMockWorkspace();
    const ctx = buildAiContext(ws, '2026-10-10');

    const orchestrator = new AiOrchestrator(new FakeLlm('normal'));
    const ideas = orchestrator.getCuratedIdeas(ctx, 'decor');

    expect(ideas.length).toBeGreaterThan(0);
    for (const idea of ideas) {
      expect(idea.whyItFits).toBeDefined();
      expect(idea.budgetTier).toBeGreaterThanOrEqual(1);
      expect(idea.budgetTier).toBeLessThanOrEqual(3);
    }
  });
});
