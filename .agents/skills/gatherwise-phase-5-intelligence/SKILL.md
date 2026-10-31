---
name: gatherwise-phase-5-intelligence
description: "Runs Phase 5 of the GatherWise build (intelligence and differentiators): What-if Lab, commitment drift, Weather Watch, Quote Scanner, Invite Studio, contingency planner, quick-add by chat, date assist. Use when the user asks to run phase 5, build the What-if Lab, add weather watch, or build the quote scanner, or when docs/STATUS.md shows Phase 5 is the next incomplete phase."
---

# Phase 5 — Intelligence and differentiators

**Goal.** What-if Lab, commitment drift, Weather Watch, Quote Scanner, Invite Studio, contingency planner, quick-add by chat, date assist.

**Protocol (every phase).** Re-read `AGENTS.md`. Open `docs/STATUS.md` and confirm the previous phase is `done` with evidence (if not, finish it first). Write a short plan (files you will touch, in order) before coding. Work in small vertical slices, commit after each green unit (`npm run check`), and keep the app runnable at all times. Only open the docs this phase lists. Never claim a check passed unless you ran it. When the exit gate is met, update `docs/STATUS.md` (phase ledger, requirement ledger, journeys, decisions, not-run list) and give the report below. Then **stop and wait** for the next instruction unless the user asked for autonomous mode.

**Read first.** `docs/PRD.md` §6, §7 (J7), §8.3, §8.5, §8.7-8.8; `docs/DOMAIN-MODEL.md` §5.5, §5.10, §5.13; `docs/AI-DESIGN.md` §9; `docs/TEMPLATE-PACKS.md` §5.

**Build.**
Implement in this order, finishing each completely (tests, accessibility, docs) before starting the next; stop when the scope profile is satisfied:
1. **What-if Lab** (BUD-07): scenario inputs, deltas, priority conflicts, saved scenarios and side-by-side compare, apply via proposal. Default numeric inputs blank; no market data.
2. **Commitment drift** (BUD-08) and its risk rule.
3. **Weather Watch** (INT-03): `server/integrations/openMeteo.ts` (geocode then forecast, 3-hour cache, timeouts, `WEATHER_ENABLED`), rain/heat/wind rules, seasonal note outside the forecast window, graceful failure; `GET /api/weather` validated and rate limited.
4. **Contingency planner** (AST-09): Plan B proposals for rain, vendor cancellation, headcount change; new rupee figures stay blank.
5. **Quote Scanner** (VND-07): upload validation (mime allow-list, magic bytes, size), `extractFromDocument`, deterministic recomputation and mismatch flags, editable form, `propose_quote`, `source: 'scanner'`; the file is never stored or logged.
6. **Invite Studio** (GUE-07): languages, tones, channels, drafts with placeholders, review notice, `lang` attributes.
7. **Quick-add by chat** (AST-07) and **date assist** (EVT-07).

**Do not.** No feature may ship half-finished: complete it or remove its UI and add it to the Roadmap. No invented prices. No auto-sending anything.

**Exit gate.** J7 passes (using a mocked weather provider in tests; a real call only if the network allows, otherwise "not run"); each built feature has tests including failure paths; `npm run check` green; `STATUS.md` marks each requirement `done` or `removed`.

**Report format.**
```
PHASE 5 REPORT
Built: <what exists and works>
Evidence: <exact commands run -> results, with counts>
Journeys checked: <J ids and result>
Not run / gaps: <honest list>
Decisions logged: <ids or dates in STATUS.md>
Next: <first three tasks of the next phase>
```
