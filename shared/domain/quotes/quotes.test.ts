import { describe, expect, it } from 'vitest';
import { inr } from '../money/money';
import { asIsoDate } from '../time/dates';
import { type NormalizeContext, type QuoteInput, compareQuotes, headcountSensitivity, normalizeQuote } from './quotes';

const ctx: NormalizeContext = { headcount: 300, defaultGstPct: 18, today: asIsoDate('2026-10-21') };
const quote = (q: Partial<QuoteInput> & Pick<QuoteInput, 'id' | 'pricing' | 'taxMode'>): QuoteInput => ({
  vendorId: `v-${q.id}`, category: 'catering', inclusions: {}, ...q,
});

describe('normalizeQuote', () => {
  it('adds GST to an exclusive per-plate quote at the planned headcount', () => {
    const n = normalizeQuote(quote({ id: 'a', pricing: { type: 'per_head', unit: inr(1_400) }, taxMode: 'exclusive', gstPct: 18 }), ctx);
    expect(n.base).toBe(inr(4_20_000));
    expect(n.payableLikely).toBe(inr(4_95_600)); // 4,20,000 x 1.18
    expect(n.flags).toEqual([]);
  });

  it('leaves an inclusive quote untouched', () => {
    const n = normalizeQuote(quote({ id: 'b', pricing: { type: 'per_head', unit: inr(1_550) }, taxMode: 'inclusive' }), ctx);
    expect(n.payableLikely).toBe(inr(4_65_000));
  });

  it('applies service charge before GST', () => {
    const n = normalizeQuote(quote({ id: 'c', pricing: { type: 'fixed', amount: inr(4_50_000) }, taxMode: 'exclusive', gstPct: 18, serviceChargePct: 10 }), ctx);
    expect(n.serviceCharge).toBe(inr(45_000));
    expect(n.payableLikely).toBe(inr(5_84_100)); // (4,50,000 + 45,000) x 1.18
  });

  it('budgets cautiously when tax treatment is unknown and says so', () => {
    const n = normalizeQuote(quote({ id: 'd', pricing: { type: 'fixed', amount: inr(1_00_000) }, taxMode: 'unknown' }), ctx);
    expect(n.payableLow).toBe(inr(1_00_000));
    expect(n.payableLikely).toBe(inr(1_18_000));
    expect(n.payableHigh).toBe(inr(1_18_000));
    expect(n.flags).toContain('tax_unknown');
  });

  it('flags an exclusive quote with no stated rate and uses the planning default', () => {
    const n = normalizeQuote(quote({ id: 'e', pricing: { type: 'fixed', amount: inr(1_00_000) }, taxMode: 'exclusive' }), ctx);
    expect(n.payableLikely).toBe(inr(1_18_000));
    expect(n.flags).toContain('gst_rate_missing');
  });

  it('flags missing headcount instead of quoting zero as a fact', () => {
    const n = normalizeQuote(quote({ id: 'f', pricing: { type: 'per_head', unit: inr(1_000) }, taxMode: 'inclusive' }), { ...ctx, headcount: 0 });
    expect(n.flags).toContain('headcount_missing');
    expect(n.payableLikely).toBe(0);
  });

  it('flags expired and soon-to-expire quotes', () => {
    const fixed = { pricing: { type: 'fixed', amount: inr(1) } as const, taxMode: 'inclusive' as const };
    expect(normalizeQuote(quote({ id: 'x', ...fixed, validUntil: asIsoDate('2026-10-20') }), ctx).flags).toContain('expired');
    expect(normalizeQuote(quote({ id: 'y', ...fixed, validUntil: asIsoDate('2026-10-28') }), ctx).flags).toContain('expiring_soon');
    expect(normalizeQuote(quote({ id: 'z', ...fixed, validUntil: asIsoDate('2026-10-29') }), ctx).flags).toEqual([]);
  });
});

describe('headcountSensitivity', () => {
  it('scales per-head quotes and leaves fixed quotes alone', () => {
    const perHead = quote({ id: 'a', pricing: { type: 'per_head', unit: inr(1_000) }, taxMode: 'inclusive' });
    const fixed = quote({ id: 'b', pricing: { type: 'fixed', amount: inr(2_00_000) }, taxMode: 'inclusive' });
    expect(headcountSensitivity(perHead, ctx, [270, 300, 330]).map((r) => r.payableLikely)).toEqual([inr(2_70_000), inr(3_00_000), inr(3_30_000)]);
    expect(new Set(headcountSensitivity(fixed, ctx, [270, 300, 330]).map((r) => r.payableLikely))).toEqual(new Set([inr(2_00_000)]));
  });
});

describe('compareQuotes', () => {
  const lowHeadline = quote({ id: 'low', pricing: { type: 'per_head', unit: inr(1_400) }, taxMode: 'exclusive', gstPct: 18, inclusions: { crockery: true, staff: true } });
  const allIn = quote({ id: 'allin', pricing: { type: 'per_head', unit: inr(1_550) }, taxMode: 'inclusive', inclusions: { crockery: true, staff: true } });

  it('ranks by true cost, not by headline price', () => {
    // ₹1,400 + GST is ₹4,95,600 at 300 guests; ₹1,550 all-in is ₹4,65,000.
    const result = compareQuotes([lowHeadline, allIn], ctx, { requiredInclusions: ['crockery', 'staff'] });
    expect(result.comparable).toBe(true);
    expect(result.ranked[0]?.quoteId).toBe('allin');
    expect(result.ranked[0]?.breakdown.price).toBe(1);
    expect(result.ranked[1]?.breakdown.price).toBe(0);
  });

  it('rewards inclusions and re-normalises weights when a criterion has no data', () => {
    const thin = { ...allIn, id: 'thin', inclusions: { crockery: false, staff: false } };
    const result = compareQuotes([allIn, thin], ctx, { requiredInclusions: ['crockery', 'staff'] });
    expect(result.ranked[0]?.quoteId).toBe('allin');
    // Only price + inclusions have data, so 0.4 and 0.25 are re-normalised to 100%.
    // The prices tie (both score 1); `thin` loses only on inclusions: (0.4*1 + 0.25*0) / 0.65 = 61.5.
    expect(result.ranked[0]?.score).toBe(100);
    expect(result.ranked[1]?.score).toBe(61.5);
  });

  it('keeps expired quotes out of the ranking and reports a single quote as not comparable', () => {
    const expired = { ...lowHeadline, id: 'old', validUntil: asIsoDate('2026-09-01') };
    const result = compareQuotes([allIn, expired], ctx);
    expect(result.comparable).toBe(false);
    expect(result.ranked.map((r) => [r.quoteId, r.eligible])).toEqual([['allin', true], ['old', false]]);
    expect(result.ranked[1]?.score).toBeNull();
  });

  it('breaks exact ties in favour of the cheaper quote, then by id', () => {
    const a = { ...allIn, id: 'b' };
    const b = { ...allIn, id: 'a' };
    expect(compareQuotes([a, b], ctx).ranked.map((r) => r.quoteId)).toEqual(['a', 'b']);
  });
});
