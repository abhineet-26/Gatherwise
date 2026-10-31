import { type Minor, minor, percentOf } from '../money/money';
import { type IsoDate, daysBetween } from '../time/dates';

/**
 * Quotation normalisation and comparison.
 *
 * Indian vendor quotes arrive as "₹1,400 per plate + GST", "₹4.2 L all inclusive",
 * or with no tax wording at all. Comparing headline numbers is how people overpay,
 * so every quote is converted to a tax-inclusive payable at the planned headcount
 * before anything is ranked. GST rates are ALWAYS user-supplied inputs: this module
 * never asserts what the law says (see ADR-0010).
 */
export type TaxMode = 'inclusive' | 'exclusive' | 'unknown';

export type Pricing =
  | { type: 'fixed'; amount: Minor }
  | { type: 'per_head'; unit: Minor }
  | { type: 'per_unit'; unit: Minor; quantity: number };

export interface QuoteInput {
  id: string;
  vendorId: string;
  category: string;
  pricing: Pricing;
  taxMode: TaxMode;
  /** GST percentage as quoted by the vendor, e.g. 18. */
  gstPct?: number;
  /** Service charge percentage applied before tax, e.g. 10. */
  serviceChargePct?: number;
  /** Inclusion checklist: key -> is it included in this quote. */
  inclusions: Readonly<Record<string, boolean>>;
  depositPct?: number;
  validUntil?: IsoDate;
  /** Customer can cancel free of charge up to this many days before the event. */
  freeCancellationDaysBefore?: number;
}

export interface NormalizeContext {
  headcount: number;
  /** Rate to assume when a quote omits it. A planning default, not a statement of law. */
  defaultGstPct: number;
  today: IsoDate;
}

export type QuoteFlag =
  | 'expired'
  | 'expiring_soon'
  | 'tax_unknown'
  | 'gst_rate_missing'
  | 'headcount_missing';

export interface NormalizedQuote {
  quoteId: string;
  /** Price before service charge and tax. */
  base: Minor;
  serviceCharge: Minor;
  payableLow: Minor;
  /** The figure to budget with. For unknown tax treatment this is the cautious (tax-extra) figure. */
  payableLikely: Minor;
  payableHigh: Minor;
  flags: QuoteFlag[];
  assumptions: string[];
}

const EXPIRING_SOON_DAYS = 7;

function baseAmount(pricing: Pricing, headcount: number): Minor {
  switch (pricing.type) {
    case 'fixed':
      return pricing.amount;
    case 'per_head':
      return minor(pricing.unit * Math.max(0, Math.round(headcount)));
    case 'per_unit':
      return minor(pricing.unit * Math.max(0, Math.round(pricing.quantity)));
  }
}

export function normalizeQuote(quote: QuoteInput, ctx: NormalizeContext): NormalizedQuote {
  const flags: QuoteFlag[] = [];
  const assumptions: string[] = [];

  if (quote.pricing.type === 'per_head' && ctx.headcount <= 0) flags.push('headcount_missing');
  const base = baseAmount(quote.pricing, ctx.headcount);
  const serviceCharge = percentOf(base, quote.serviceChargePct ?? 0);
  const subtotal = minor(base + serviceCharge);

  let low = subtotal;
  let likely = subtotal;
  let high = subtotal;

  switch (quote.taxMode) {
    case 'inclusive':
      assumptions.push('GST is included in the quoted price.');
      break;
    case 'exclusive': {
      if (quote.gstPct === undefined) {
        flags.push('gst_rate_missing');
        assumptions.push(`GST rate not stated; using ${ctx.defaultGstPct}% (editable).`);
      }
      const payable = minor(subtotal + percentOf(subtotal, quote.gstPct ?? ctx.defaultGstPct));
      low = likely = high = payable;
      break;
    }
    case 'unknown':
      flags.push('tax_unknown');
      assumptions.push('Tax treatment unknown: budgeting with GST extra until the vendor confirms.');
      high = minor(subtotal + percentOf(subtotal, quote.gstPct ?? ctx.defaultGstPct));
      likely = high;
      break;
  }

  if (quote.validUntil !== undefined) {
    const daysLeft = daysBetween(ctx.today, quote.validUntil);
    if (daysLeft < 0) flags.push('expired');
    else if (daysLeft <= EXPIRING_SOON_DAYS) flags.push('expiring_soon');
  }

  return { quoteId: quote.id, base, serviceCharge, payableLow: low, payableLikely: likely, payableHigh: high, flags, assumptions };
}

/** What a per-head quote costs at other headcounts (fixed quotes stay constant). */
export function headcountSensitivity(
  quote: QuoteInput,
  ctx: NormalizeContext,
  headcounts: readonly number[],
): Array<{ headcount: number; payableLikely: Minor }> {
  return headcounts.map((headcount) => ({
    headcount,
    payableLikely: normalizeQuote(quote, { ...ctx, headcount }).payableLikely,
  }));
}

export interface CompareWeights {
  price: number;
  inclusions: number;
  terms: number;
  reliability: number;
  fit: number;
}

export const DEFAULT_COMPARE_WEIGHTS: Readonly<CompareWeights> = {
  price: 0.4,
  inclusions: 0.25,
  terms: 0.15,
  reliability: 0.1,
  fit: 0.1,
};

export interface CompareOptions {
  requiredInclusions?: readonly string[];
  weights?: Partial<CompareWeights>;
  /** The organiser's own 0-5 scores, keyed by quote id. Optional. */
  reliability?: Readonly<Record<string, number>>;
  fit?: Readonly<Record<string, number>>;
}

export interface ComparedQuote {
  quoteId: string;
  eligible: boolean;
  /** 0-100, or null when the quote is ineligible. */
  score: number | null;
  breakdown: Partial<Record<keyof CompareWeights, number>>;
  payableLikely: Minor;
  flags: QuoteFlag[];
}

export interface Comparison {
  /** A ranking only means something with at least two eligible quotes. */
  comparable: boolean;
  ranked: ComparedQuote[];
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Transparent weighted scoring (MCDA). Criteria without data are dropped and the
 * remaining weights re-normalised, so a missing reliability score never silently
 * pushes a quote up or down. Expired quotes are listed last and never ranked.
 */
export function compareQuotes(
  quotes: readonly QuoteInput[],
  ctx: NormalizeContext,
  options: CompareOptions = {},
): Comparison {
  const weights = { ...DEFAULT_COMPARE_WEIGHTS, ...options.weights };
  const normalized = quotes.map((quote) => ({ quote, n: normalizeQuote(quote, ctx) }));
  const eligible = normalized.filter(({ n }) => !n.flags.includes('expired'));
  const prices = eligible.map(({ n }) => n.payableLikely);
  const cheapest = Math.min(...prices);
  const dearest = Math.max(...prices);
  const required = options.requiredInclusions ?? [];

  const scored: ComparedQuote[] = normalized.map(({ quote, n }) => {
    if (n.flags.includes('expired')) {
      return { quoteId: quote.id, eligible: false, score: null, breakdown: {}, payableLikely: n.payableLikely, flags: n.flags };
    }
    const breakdown: Partial<Record<keyof CompareWeights, number>> = {};
    breakdown.price = dearest === cheapest ? 1 : (dearest - n.payableLikely) / (dearest - cheapest);
    if (required.length > 0) {
      breakdown.inclusions = required.filter((key) => quote.inclusions[key] === true).length / required.length;
    }
    const termParts: number[] = [];
    if (quote.depositPct !== undefined) termParts.push(1 - clamp01(quote.depositPct / 100));
    if (quote.freeCancellationDaysBefore !== undefined) termParts.push(clamp01(quote.freeCancellationDaysBefore / 60));
    if (termParts.length > 0) breakdown.terms = termParts.reduce((a, b) => a + b, 0) / termParts.length;
    const reliability = options.reliability?.[quote.id];
    if (reliability !== undefined) breakdown.reliability = clamp01(reliability / 5);
    const fit = options.fit?.[quote.id];
    if (fit !== undefined) breakdown.fit = clamp01(fit / 5);

    let weighted = 0;
    let weightUsed = 0;
    for (const key of Object.keys(breakdown) as Array<keyof CompareWeights>) {
      weighted += (breakdown[key] ?? 0) * weights[key];
      weightUsed += weights[key];
    }
    const score = weightUsed > 0 ? Math.round((weighted / weightUsed) * 1000) / 10 : 0;
    return { quoteId: quote.id, eligible: true, score, breakdown, payableLikely: n.payableLikely, flags: n.flags };
  });

  const ranked = [...scored].sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    // Higher score first; on a tie the cheaper quote wins, then id keeps the order stable.
    return (b.score ?? 0) - (a.score ?? 0) || a.payableLikely - b.payableLikely || a.quoteId.localeCompare(b.quoteId);
  });
  return { comparable: eligible.length >= 2, ranked };
}
