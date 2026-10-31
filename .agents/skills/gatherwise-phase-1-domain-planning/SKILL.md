---
name: gatherwise-phase-1-domain-planning
description: "Runs Phase 1 of the GatherWise build (domain, commands and planning engine): Zod schemas, commands with reducers, inverses and previews, activity log and undo, planning engine with the three template packs, readiness score, risk engine. Use when the user asks to run phase 1, build the domain layer, or implement the planning engine, or when docs/STATUS.md shows Phase 1 is the next incomplete phase."
---

# Phase 1 — Domain, commands and planning engine

**Goal.** Zod schemas, commands with reducers, inverses and previews, activity log and undo, planning engine with the three template packs, readiness score, risk engine.

**Protocol (every phase).** Re-read `AGENTS.md`. Open `docs/STATUS.md` and confirm the previous phase is `done` with evidence (if not, finish it first). Write a short plan (files you will touch, in order) before coding. Work in small vertical slices, commit after each green unit (`npm run check`), and keep the app runnable at all times. Only open the docs this phase lists. Never claim a check passed unless you ran it. When the exit gate is met, update `docs/STATUS.md` (phase ledger, requirement ledger, journeys, decisions, not-run list) and give the report below. Then **stop and wait** for the next instruction unless the user asked for autonomous mode.

**Read first.** `docs/DOMAIN-MODEL.md` (all); `docs/TEMPLATE-PACKS.md` (all); `docs/BENCHMARKS.md`; `docs/ARCHITECTURE.md` §7; `docs/TEST-STRATEGY.md` §3-4.

**Build.**
1. `shared/schemas`: Zod schemas for every entity in `DOMAIN-MODEL.md` §2 with the stated length caps; infer types from them; `migrations.ts` stub with `schemaVersion: 1`.
2. `shared/commands`: the command catalogue in §6 (start with Core: events, sub-events, tasks, budget lines, vendors, quotations, accept-quotation, payments, guests, RSVP, risks, ideas), each with schema, pure reducer, **inverse**, summary, and an AI-allowed flag. `previewImpact(state, commands, today)`. Activity entries store inverses (last 50); implement undo.
3. `shared/planning`: generic `generatePlan(event, pack, today)`; packs for wedding, birthday and community exactly as in `TEMPLATE-PACKS.md` (tasks with leads, dependencies and `appliesWhen`; budget profiles using `allocateByWeights`; essentials; vendor checklists; risk rules; idea library; presets); `benchmarks.ts` with provenance and `verified: false`; per-guest sanity check; outstanding-decisions list; "Why this?" explanation on every generated item.
4. `shared/domain`: add `readiness` (dimensions, Expected, Pace, next best actions per §5.8), `risks` (rule evaluation, dedupe, persisted-decision merge and re-open logic per §5.9), and the CSV/ICS builders (pure, with the escaping and injection guard rules).
5. Tests: reducer inverse property (apply then inverse equals original; inputs never mutated); engine output for 300, 90 and 45 days and for outdoor, accessibility and sponsored variants; pack-as-data fixture proving a new event type needs no engine change; readiness invariants (0-100, completing a task never lowers it); risk dedupe and re-open; CSV/ICS escaping; benchmark records all have `sourceNote`, reliability and `verified: false`.

**Do not.** No UI work. No AI. No calculation duplicated outside `shared/domain`. No invented benchmarks or prices.

**Exit gate.** `npm run check` green; coverage reported for `shared/domain` (target 90%), `shared/commands` and `shared/planning` (85%); plans generated for the three demo scenarios in `PRD.md` Appendix A in tests; every command has an inverse test; `STATUS.md` updated.

**Report format.**
```
PHASE 1 REPORT
Built: <what exists and works>
Evidence: <exact commands run -> results, with counts>
Journeys checked: <J ids and result>
Not run / gaps: <honest list>
Decisions logged: <ids or dates in STATUS.md>
Next: <first three tasks of the next phase>
```
