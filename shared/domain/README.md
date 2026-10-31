# Golden domain kernel

Pure, dependency-free TypeScript for the calculations that must never be wrong:
money, dates, budget identity, quotation normalisation, task scheduling and
headcount estimation. It ships with its tests (83 at the time of writing, including
property-based tests with `fast-check`).

**Rules for working with this folder**

- Use it as-is and extend it. Do not rewrite it, and do not re-implement any of
  these calculations elsewhere (UI, server or AI code must import from here).
- No imports from React, Express, Firebase, the DOM or the clock. `today` is always passed in.
- Every behaviour change needs a test change in the same commit.
- Formulas and worked examples live in `docs/DOMAIN-MODEL.md`; keep them in sync.

**Running the tests** (after Phase 0 tooling exists): `npx vitest run shared/domain`
Needs `vitest` and `fast-check` as dev dependencies and a `moduleResolution` of
`Bundler` (or extensionless imports resolved by Vite/Vitest).

| Module | What it guarantees |
| --- | --- |
| `money/money.ts` | Integer minor units, `₹5,00,000` formatting, `₹4.5 L` / `₹1.25 Cr`, parsing of `5 lakh`, `2.5cr`, `Rs. 25,000/-` |
| `money/allocate.ts` | Largest-remainder split: parts always sum exactly to the total |
| `budget/budget.ts` | Committed / paid / outstanding / projected with no double counting; contingency; overdue payments |
| `quotes/quotes.ts` | GST-aware true-cost normalisation, headcount sensitivity, transparent weighted comparison |
| `tasks/schedule.ts` | Lead-time planning with compression, dependency ordering, cycle detection, derived status |
| `guests/headcount.ts` | Expected attendance, catering headcount with buffer, calibration from earlier functions |
| `time/dates.ts` | Calendar-date arithmetic safe from DST; "today" in the event time zone |
