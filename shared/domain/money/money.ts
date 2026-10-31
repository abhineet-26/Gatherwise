/**
 * Money kernel. Every monetary value in GatherWise is an INTEGER count of minor
 * units (paise for INR). Floats never cross a module boundary, so totals can
 * never drift by a paisa. See ADR-0002.
 */
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD' | 'AUD' | 'CAD';
export type Minor = number & { readonly __brand: 'Minor' };

export const CURRENCIES: Record<CurrencyCode, { symbol: string; locale: string }> = {
  INR: { symbol: '₹', locale: 'en-IN' },
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  GBP: { symbol: '£', locale: 'en-GB' },
  AED: { symbol: 'AED', locale: 'en-AE' },
  SGD: { symbol: 'S$', locale: 'en-SG' },
  AUD: { symbol: 'A$', locale: 'en-AU' },
  CAD: { symbol: 'C$', locale: 'en-CA' },
};

/** Brand a safe integer as minor units. Throws on fractions, NaN or overflow. */
export function minor(value: number): Minor {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Minor units must be a safe integer, got ${value}`);
  }
  return value as Minor;
}

export const ZERO: Minor = 0 as Minor;

/** Round half away from zero (Math.round alone rounds -2.5 up to -2). */
export function roundHalfAwayFromZero(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/** Convert a major-unit amount (e.g. rupees) to minor units, ignoring binary float noise. */
export function fromMajor(major: number): Minor {
  if (!Number.isFinite(major)) throw new RangeError(`Amount must be finite, got ${major}`);
  // 1.005 * 100 === 100.49999999999999; toPrecision(15) restores the intended 100.5.
  const scaled = Number((major * 100).toPrecision(15));
  return minor(roundHalfAwayFromZero(scaled));
}

/** Shorthand used heavily in tests and seed data: inr(5_00_000) is five lakh rupees. */
export const inr = fromMajor;

/** For display and charting only. Never feed the result back into calculations. */
export function toMajor(amount: Minor): number {
  return amount / 100;
}

export function add(a: Minor, b: Minor): Minor {
  return minor(a + b);
}

export function subtract(a: Minor, b: Minor): Minor {
  return minor(a - b);
}

export function sum(values: readonly Minor[]): Minor {
  return minor(values.reduce((total, value) => total + value, 0));
}

/** Integer division of BigInts, rounding half away from zero. `divisor` must be positive. */
export function divRound(numerator: bigint, divisor: bigint): number {
  if (divisor <= 0n) throw new RangeError('divisor must be positive');
  const negative = numerator < 0n;
  const magnitude = negative ? -numerator : numerator;
  const quotient = (2n * magnitude + divisor) / (2n * divisor);
  return Number(negative ? -quotient : quotient);
}

/**
 * `pct` percent of `amount`, rounded half away from zero to a whole minor unit.
 * `pct` carries at most two decimals (18, 2.5, 0.25). Uses BigInt, so
 * amount × rate cannot overflow or lose precision.
 */
export function percentOf(amount: Minor, pct: number): Minor {
  if (!Number.isFinite(pct)) throw new RangeError(`Percentage must be finite, got ${pct}`);
  const basisPoints = Math.round(pct * 100);
  return minor(divRound(BigInt(amount) * BigInt(basisPoints), 10_000n));
}

const roundTo2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

/** Compact Indian notation: ₹4.5 L, ₹1.25 Cr. Below one lakh the full grouped figure is used. */
export function formatInrCompact(amount: Minor): string {
  const sign = amount < 0 ? '-' : '';
  const rupees = Math.abs(amount) / 100;
  const lakh = roundTo2(rupees / 1e5);
  // lakh >= 100 catches 99.999 L rounding up to 100 L, which reads better as 1 Cr.
  if (rupees >= 1e7 || lakh >= 100) return `${sign}₹${roundTo2(rupees / 1e7)} Cr`;
  if (rupees >= 1e5) return `${sign}₹${lakh} L`;
  return formatMoney(amount, 'INR');
}

export interface FormatMoneyOptions {
  /** ₹4.5 L / ₹1.25 Cr for INR; locale compact notation for other currencies. */
  compact?: boolean;
}

export function formatMoney(
  amount: Minor,
  currency: CurrencyCode = 'INR',
  options: FormatMoneyOptions = {},
): string {
  const { locale } = CURRENCIES[currency];
  if (options.compact) {
    if (currency === 'INR') return formatInrCompact(amount);
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(amount / 100);
  }
  const hasFraction = amount % 100 !== 0;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

const UNIT_MULTIPLIER: Readonly<Record<string, bigint>> = {
  k: 1_000n,
  thousand: 1_000n,
  l: 100_000n,
  lac: 100_000n,
  lacs: 100_000n,
  lakh: 100_000n,
  lakhs: 100_000n,
  cr: 10_000_000n,
  crore: 10_000_000n,
  crores: 10_000_000n,
  m: 1_000_000n,
  mn: 1_000_000n,
  million: 1_000_000n,
};

// Accepts Indian (12,34,567), western (1,234,567) and ungrouped (1234567) integer parts.
const INTEGER_PART_RE = /^(?:\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3}|\d+)$/;
const INPUT_RE = /^(-)?\s*(?:₹|rs\.?|inr)?\s*(-)?\s*([\d,]+(?:\.\d+)?)\s*([a-z]*)$/i;

/**
 * Parse what people actually type into a money field:
 * "5 lakh", "₹5,00,000", "2.5cr", "75k", "Rs. 25,000/-", "1,234.56".
 * Returns null (never throws) for anything it cannot read unambiguously.
 */
export function parseMoney(input: string): Minor | null {
  const cleaned = input.trim().replace(/\s*\/-\s*$/, '');
  const match = INPUT_RE.exec(cleaned);
  if (!match) return null;
  const negative = match[1] === '-' || match[2] === '-';
  const numberText = match[3] ?? '';
  const unit = (match[4] ?? '').toLowerCase();

  const [integerPart = '', fractionPart = ''] = numberText.split('.');
  if (!INTEGER_PART_RE.test(integerPart)) return null;
  const multiplier = unit === '' ? 1n : UNIT_MULTIPLIER[unit];
  if (multiplier === undefined) return null;

  // Exact decimal arithmetic: digits × multiplier × 100 / 10^fractionDigits.
  const digits = BigInt(integerPart.replace(/,/g, '') + fractionPart);
  const numerator = digits * multiplier * 100n;
  const value = divRound(numerator, 10n ** BigInt(fractionPart.length));
  const signed = negative ? -value : value;
  return Number.isSafeInteger(signed) ? (signed as Minor) : null;
}
