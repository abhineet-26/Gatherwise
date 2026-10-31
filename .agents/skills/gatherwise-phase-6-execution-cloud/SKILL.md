---
name: gatherwise-phase-6-execution-cloud
description: "Runs Phase 6 of the GatherWise build (execution and cloud (full tier)): run-of-show and Day-of Mode, funding and sponsor tracker, volunteer roster, Hindi UI, optional Firebase cloud mode. Use when the user asks to run phase 6, build day-of mode, run of show, funding tracker, or firebase cloud mode, or when docs/STATUS.md shows Phase 6 is the next incomplete phase."
---

# Phase 6 — Execution and cloud (Full tier)

**Goal.** Run-of-show and Day-of Mode, funding and sponsor tracker, volunteer roster, Hindi UI, optional Firebase cloud mode.

**Protocol (every phase).** Re-read `AGENTS.md`. Open `docs/STATUS.md` and confirm the previous phase is `done` with evidence (if not, finish it first). Write a short plan (files you will touch, in order) before coding. Work in small vertical slices, commit after each green unit (`npm run check`), and keep the app runnable at all times. Only open the docs this phase lists. Never claim a check passed unless you ran it. When the exit gate is met, update `docs/STATUS.md` (phase ledger, requirement ledger, journeys, decisions, not-run list) and give the report below. Then **stop and wait** for the next instruction unless the user asked for autonomous mode.

**Read first.** `docs/PRD.md` §7 (J8, J9) and §8.9; `docs/DOMAIN-MODEL.md` §5.11-5.12; `docs/SECURITY-PRIVACY.md` §3.2, §3.4, §6; `docs/ARCHITECTURE.md` §8, §12.

**Build.**
Only if the scope profile is Full or time remains after Phase 5. Order: 
1. **Run-of-show** (EXE-01): items per function with owner, buffer, fixed-time flag; overlap/conflict detection; `applyDelay` cascade as a pure tested function.
2. **Day-of Mode** (EXE-02): mobile-first Now/Next view, large targets, offline (service worker precache of the shell; data already local), delay button using the cascade, one-tap call/WhatsApp.
3. **Funding tracker** (FND-01): sources by kind and stage, coverage and expected coverage with editable stage weights, deliverables checklist, concentration and gap risks, sponsor report print.
4. **Hindi UI** (SYS-06) via the i18n dictionary, with `lang` attributes; **volunteer roster** (EXE-03) and **seating helper** (GUE-09) only if time remains.
5. **Cloud mode** (SYS-05): Firebase Auth (Google) + `FirestoreRepository` + `firebase/firestore.rules` from `SECURITY-PRIVACY.md` §6 + contract tests shared with the other repositories + the extra CSP allowances built from env. Verify against the emulator or a real project; if neither is available, mark cloud mode **"implemented, not verified"** in the README and keep it off by default.

**Do not.** Do not call cloud mode working unless exercised. Do not break local mode. Do not add collaborators/roles (roadmap).

**Exit gate.** J8 and J9 pass by hand; delay-cascade and funding functions have unit and property tests; offline reload of Day-of works (manual, recorded); cloud mode status stated truthfully; `npm run check` green.

**Report format.**
```
PHASE 6 REPORT
Built: <what exists and works>
Evidence: <exact commands run -> results, with counts>
Journeys checked: <J ids and result>
Not run / gaps: <honest list>
Decisions logged: <ids or dates in STATUS.md>
Next: <first three tasks of the next phase>
```
