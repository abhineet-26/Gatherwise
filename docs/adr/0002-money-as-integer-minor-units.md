# ADR-0002: Money as integer minor units

**Status:** Accepted · **Date:** 2026-10-24

## Context
Floating-point amounts drift (1.005 × 100 = 100.49999999999999) and budgets must add up to the paisa. Users type "5 lakh" and read ₹5,00,000.

## Decision
Represent every amount as a branded integer `Minor` (paise for INR). Use BigInt inside percent and allocation maths. Convert only at the edges: `parseMoney` for input, `formatMoney` and `formatInrCompact` for display. Split totals with largest-remainder allocation.

## Consequences
Totals are exact and testable with properties. Safe range is about ±9×10¹³ rupees, far beyond event budgets. Every module must route conversions through `money.ts`.

## Alternatives considered
decimal.js (extra dependency, slower, still needs rounding policy); floats with rounding (silent drift); BigInt everywhere (poor ergonomics in UI code).
