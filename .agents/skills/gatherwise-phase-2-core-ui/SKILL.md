---
name: gatherwise-phase-2-core-ui
description: "Runs Phase 2 of the GatherWise build (core workspace ui): local persistence, demo data with Time Travel, landing page, dashboard, creation wizard, tasks and timeline, budget and payments, exports, undo, settings. Use when the user asks to run phase 2, build the core UI, or build the wizard dashboard budget and tasks screens, or when docs/STATUS.md shows Phase 2 is the next incomplete phase."
---

# Phase 2 — Core workspace UI

**Goal.** Local persistence, demo data with Time Travel, landing page, dashboard, creation wizard, tasks and timeline, budget and payments, exports, undo, settings.

**Protocol (every phase).** Re-read `AGENTS.md`. Open `docs/STATUS.md` and confirm the previous phase is `done` with evidence (if not, finish it first). Write a short plan (files you will touch, in order) before coding. Work in small vertical slices, commit after each green unit (`npm run check`), and keep the app runnable at all times. Only open the docs this phase lists. Never claim a check passed unless you ran it. When the exit gate is met, update `docs/STATUS.md` (phase ledger, requirement ledger, journeys, decisions, not-run list) and give the report below. Then **stop and wait** for the next instruction unless the user asked for autonomous mode.

**Read first.** `docs/PRD.md` §7 (J1, J2, J6) and §8.1-8.4, §8.10; `docs/DESIGN-SYSTEM.md` (all); `docs/ARCHITECTURE.md` §7-9; `docs/DOMAIN-MODEL.md` §5.1-5.8.

**Build.**
1. `LocalRepository` (IndexedDB via `idb`, database `gatherwise-demo`) passing the shared repository contract tests (use `fake-indexeddb`); `useWorkspaceStore` with `dispatch`, `undo`, optimistic update and rollback on commit failure; `useUiStore`.
2. Demo: the three seeded scenarios from `PRD.md` Appendix A, built by dispatching real commands relative to "today"; **Time Travel** control; persistent demo banner; Reset.
3. Landing page (what it is, three honest feature highlights, *Try the demo*), then the app shell routes.
4. Dashboard: Readiness Bloom + Expected + Pace, three next best actions, BudgetBar with table toggle, next-7-days panel, top risks; all computed through domain functions.
5. Wizard (EVT-01..06, 08): type-specific steps, MoneyInput with live parse, past-date handling, draft recovery, plan preview with assumptions and per-item toggles/edit, then create.
6. Tasks: list, board and month calendar; filters; dependencies and critical path; derived statuses; date-change re-flow as a proposal-style diff the user approves.
7. Budget: lines with low/likely/high and basis badges; manual agreed amounts (commitments); payments with modes and kinds; alerts; post-event reconciliation view; per-guest sanity check with benchmark labelling.
8. Exports: print-ready plan, CSV (budget, tasks), ICS, JSON export, delete-all with confirmation. Activity log with Undo; Settings with privacy notice.
9. Accessibility and states on every screen (loading, empty, error, confirm), keyboard walkthrough of J1.

**Do not.** No vendors/quotes/guests yet (Phase 3). No AI. No placeholder charts. No screens that look finished but do nothing.

**Exit gate.** J1, J2 (using manual agreed amounts) and J6 pass by hand and are recorded in `STATUS.md`; refresh keeps data; Undo restores the previous state; axe smoke tests pass on dashboard, wizard and budget; `npm run check` green; bundle sizes recorded against budgets.

**Report format.**
```
PHASE 2 REPORT
Built: <what exists and works>
Evidence: <exact commands run -> results, with counts>
Journeys checked: <J ids and result>
Not run / gaps: <honest list>
Decisions logged: <ids or dates in STATUS.md>
Next: <first three tasks of the next phase>
```
