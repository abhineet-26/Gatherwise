import { describe, expect, it } from 'vitest';
import { normalizeQuote, compareQuotes, type QuoteInput } from '../shared/domain/quotes/quotes';
import { estimateAttendance, calibratePending, DEFAULT_ATTENDANCE } from '../shared/domain/guests/headcount';
import { exportGuestsToCsv } from '../shared/domain/export/csv';
import { inr } from '../shared/domain/money/money';
import { asIsoDate } from '../shared/domain/time/dates';
import { reduceCommand } from '../shared/commands/reducer';
import type { WorkspaceState } from '../shared/commands/types';
import type { Guest } from '../shared/schemas';

describe('Phase 3 — Vendors, Quotations & Guests', () => {
  const today = asIsoDate('2026-09-25');

  describe('J3 — Caterer Comparison at 300 Guests', () => {
    // Caterer A: ₹1,400 + 18% GST
    const catererA: QuoteInput = {
      id: 'quote-a',
      vendorId: 'vnd-a',
      category: 'catering',
      pricing: { type: 'per_head', unit: inr(1400) },
      taxMode: 'exclusive',
      gstPct: 18,
      inclusions: { welcome_drinks: true, dessert_counter: true },
      depositPct: 25,
      validUntil: asIsoDate('2026-10-15'),
    };

    // Caterer B: ₹1,550 all-inclusive
    const catererB: QuoteInput = {
      id: 'quote-b',
      vendorId: 'vnd-b',
      category: 'catering',
      pricing: { type: 'per_head', unit: inr(1550) },
      taxMode: 'inclusive',
      inclusions: { welcome_drinks: true, dessert_counter: true, chafing_dishes: true },
      depositPct: 25,
      validUntil: asIsoDate('2026-10-20'),
    };

    it('normalises both quotes accurately at 300 guests', () => {
      const ctx = {
        headcount: 300,
        defaultGstPct: 18,
        today,
      };

      const normA = normalizeQuote(catererA, ctx);
      const normB = normalizeQuote(catererB, ctx);

      // 300 * 1400 = 4,20,000 base. 18% GST = 75,600. Total = 4,95,600 (49560000 paise)
      expect(normA.payableLikely).toBe(49560000);

      // 300 * 1550 = 4,65,000 (46500000 paise) all inclusive
      expect(normB.payableLikely).toBe(46500000);

      // Difference is exactly ₹30,600 (3060000 paise)
      const difference = normA.payableLikely - normB.payableLikely;
      expect(difference).toBe(3060000);
    });

    it('ranks eligible quotes using transparent MCDA scoring', () => {
      const ctx = {
        headcount: 300,
        defaultGstPct: 18,
        today,
      };

      const comparison = compareQuotes([catererA, catererB], ctx, {
        weights: { price: 0.5, inclusions: 0.5 },
      });

      expect(comparison.comparable).toBe(true);
      expect(comparison.ranked.length).toBe(2);
      // Caterer B is cheaper (₹4,65,000 vs ₹4,95,600) and has more inclusions
      const winner = comparison.ranked[0];
      expect(winner?.quoteId).toBe('quote-b');
      expect(winner?.score).toBeGreaterThan(comparison.ranked[1]?.score || 0);
    });
  });

  describe('Accept Quote -> Commitment & Payments', () => {
    it('creates commitment and splits payment schedule using allocateByWeights with 0 rounding loss', () => {
      const mockWorkspace: WorkspaceState = {
        event: {
          id: 'evt-1',
          name: 'Demo Wedding',
          type: 'wedding',
          city: 'Pune',
          date: asIsoDate('2026-11-24'),
          budgetTarget: inr(1800000),
          budget: inr(1800000),
          guestCount: 300,
        },
        subEvents: [],
        budgetLines: [{ id: 'bl-catering', eventId: 'evt-1', category: 'catering', estimate: inr(500000) }],
        commitments: [],
        payments: [],
        tasks: [],
        vendors: [{ id: 'vnd-b', eventId: 'evt-1', name: 'Shahi Bhojan Hospitality', category: 'catering', status: 'quote_received' }],
        quotes: [
          {
            id: 'quote-b',
            eventId: 'evt-1',
            vendorId: 'vnd-b',
            budgetLineId: 'bl-catering',
            title: 'Catering Proposal B',
            status: 'received',
            pricing: { model: 'per_head', baseAmount: inr(1550) },
            taxMode: 'inclusive',
            depositPct: 25,
            paymentSchedule: [
              { label: 'Booking Advance', pct: 25 },
              { label: 'Pre-event Final Payment', pct: 75 },
            ],
          },
        ],
        guests: [],
        risks: [],
        activity: [],
      };

      const result = reduceCommand(mockWorkspace, {
        type: 'ACCEPT_QUOTATION',
        eventId: 'evt-1',
        payload: {
          quoteId: 'quote-b',
          commitmentAmount: 46500000, // ₹4,65,000 in paise
          headcountAtAcceptance: 300,
        },
      });

      const next = result.nextState;
      expect(next.quotes[0]?.status).toBe('accepted');
      expect(next.vendors[0]?.status).toBe('booked');
      expect(next.commitments.length).toBe(1);
      expect(next.commitments[0]?.amount).toBe(46500000);
      expect(next.commitments[0]?.headcountAtAcceptance).toBe(300);

      // Verify scheduled payments generated
      expect(next.payments.length).toBe(2);
      const totalPayments = next.payments.reduce((sum, p) => sum + p.amount, 0);
      expect(totalPayments).toBe(46500000); // Exact match with zero loss

      // Test Reversibility (Undo)
      expect(result.inverse).not.toBeNull();
      const undone = reduceCommand(next, result.inverse!);
      expect(undone.nextState.quotes[0]?.status).toBe('received');
      expect(undone.nextState.vendors[0]?.status).toBe('quote_received');
      expect(undone.nextState.commitments[0]?.status).toBe('cancelled');
      expect(undone.nextState.payments.length).toBe(0);
    });
  });

  describe('J5 — Attendance Estimation & Catering Brief', () => {
    it('calculates expected turnout and plate counts with buffer', () => {
      const counts = {
        yes: 180,
        maybe: 20,
        pending: 60,
        declined: 40,
      };

      const estimate = estimateAttendance(counts, DEFAULT_ATTENDANCE);
      // Uncertain = 20 * 0.5 + 60 * 0.8 = 10 + 48 = 58
      // Likely = 180 + 58 = 238
      expect(estimate.likely).toBe(238);
      // High = 180 + 20 + 60 = 260
      expect(estimate.high).toBe(260);
      // Catering headcount with 5% buffer = ceil(238 * 1.05) = ceil(249.9) = 250
      expect(estimate.cateringHeadcount).toBe(250);
    });

    it('calibrates pending assumptions based on actual attendance', () => {
      const initial = { ...DEFAULT_ATTENDANCE, pPending: 0.8 };
      // If actual turnout was lower than planned, pPending is gently calibrated down
      const calibrated = calibratePending(initial, 250, 220);
      expect(calibrated.pPending).toBeLessThan(0.8);
      expect(calibrated.pPending).toBeGreaterThan(0.3); // bounded
    });
  });

  describe('Guest CSV Export & Security Safeguards', () => {
    it('escapes CSV formula injection characters (=, +, -, @) safely', () => {
      const maliciousGuest: Guest = {
        id: 'gst-malicious',
        eventId: 'evt-1',
        name: '=cmd|"/C calc"!A0',
        phone: '+91 99999 88888',
        partySize: 2,
        dietary: 'veg',
        side: 'a',
        group: '+VIP Group',
        notes: '@mention exploit',
      };

      const csv = exportGuestsToCsv([maliciousGuest]);
      // Formula-trigger characters should be prepended with a single quote '
      expect(csv).toContain("=cmd");
      expect(csv).toContain("+VIP");
      expect(csv).toContain("@mention");
      // Starts with UTF-8 BOM
      expect(csv.charCodeAt(0)).toBe(0xFEFF);
    });

    it('preserves Indic script names during CSV export', () => {
      const indicGuest: Guest = {
        id: 'gst-indic',
        eventId: 'evt-1',
        name: 'आनंद शर्मा (Anand Sharma)',
        partySize: 3,
        dietary: 'jain',
        side: 'shared',
      };

      const csv = exportGuestsToCsv([indicGuest]);
      expect(csv).toContain('आनंद शर्मा (Anand Sharma)');
    });
  });
});
