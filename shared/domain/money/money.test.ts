import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { formatInrCompact, formatMoney, fromMajor, inr, minor, parseMoney, percentOf, sum } from './money';

describe('minor / fromMajor', () => {
  it('refuses anything that is not a safe integer', () => {
    expect(() => minor(10.5)).toThrow(RangeError);
    expect(() => minor(Number.NaN)).toThrow(RangeError);
    expect(() => minor(2 ** 60)).toThrow(RangeError);
  });

  it('converts rupees to paise without float drift', () => {
    expect(fromMajor(0.1 + 0.2)).toBe(30);
    expect(fromMajor(1.005)).toBe(101); // half away from zero, noise-safe
    expect(fromMajor(-1.005)).toBe(-101);
    expect(inr(5_00_000)).toBe(5_00_00_000);
  });
});

describe('percentOf', () => {
  it('rounds half away from zero to a whole paisa', () => {
    expect(percentOf(inr(1000), 18)).toBe(inr(180));
    expect(percentOf(minor(5), 10)).toBe(1); // 0.5 -> 1
    expect(percentOf(minor(-5), 10)).toBe(-1);
    expect(percentOf(inr(4_50_000), 2.5)).toBe(inr(11_250));
  });

  it('stays exact on crore-sized amounts', () => {
    expect(percentOf(inr(10_00_00_000), 18)).toBe(inr(1_80_00_000));
  });
});

describe('formatMoney', () => {
  it('uses lakh/crore digit grouping for INR', () => {
    expect(formatMoney(inr(5_00_000))).toBe('₹5,00,000');
    expect(formatMoney(inr(12_34_567.89))).toBe('₹12,34,567.89');
    expect(formatMoney(inr(0))).toBe('₹0');
    expect(formatMoney(inr(-5000))).toBe('-₹5,000');
  });

  it('prints compact lakh and crore figures', () => {
    expect(formatInrCompact(inr(4_50_000))).toBe('₹4.5 L');
    expect(formatInrCompact(inr(1_25_00_000))).toBe('₹1.25 Cr');
    expect(formatInrCompact(inr(75_000))).toBe('₹75,000');
    expect(formatInrCompact(inr(99_99_995))).toBe('₹1 Cr'); // 99.99995 L rounds up to a crore
    expect(formatMoney(inr(18_00_000), 'INR', { compact: true })).toBe('₹18 L');
  });

  it('formats other currencies with their own locale', () => {
    expect(formatMoney(minor(123_456), 'USD')).toBe('$1,234.56');
  });
});

describe('parseMoney', () => {
  it.each([
    ['₹5,00,000', inr(5_00_000)],
    ['500000', inr(5_00_000)],
    ['5 lakh', inr(5_00_000)],
    ['5L', inr(5_00_000)],
    ['5 lac', inr(5_00_000)],
    ['2.5 cr', inr(2_50_00_000)],
    ['2.5Cr', inr(2_50_00_000)],
    ['75k', inr(75_000)],
    ['Rs. 25,000/-', inr(25_000)],
    ['₹ 1.5 lakhs', inr(1_50_000)],
    ['1,234.56', minor(123_456)],
    ['-5000', inr(-5_000)],
    ['-₹5,000', inr(-5_000)],
    ['500,000', inr(5_00_000)],
  ])('reads %s', (text, expected) => {
    expect(parseMoney(text)).toBe(expected);
  });

  it.each(['', 'abc', '₹', '1,2,3', '5 banana', '1.2.3', '12,34', '5 lakh crore'])('rejects %j', (text) => {
    expect(parseMoney(text)).toBeNull();
  });

  it('round-trips whatever formatMoney prints (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: -100_000_000_000, max: 100_000_000_000 }), (n) => {
        expect(parseMoney(formatMoney(minor(n)))).toBe(n);
      }),
    );
  });
});

describe('sum', () => {
  it('adds integers exactly', () => {
    expect(sum([minor(1), minor(2), minor(3)])).toBe(6);
    expect(sum([])).toBe(0);
  });
});
