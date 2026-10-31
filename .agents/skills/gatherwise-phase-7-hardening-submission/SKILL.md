---
name: gatherwise-phase-7-hardening-submission
description: "Runs Phase 7 of the GatherWise build (hardening and submission): accessibility, performance and security passes, PWA, Dockerfile, README from the template, final audit, repo rules. Use when the user asks to run phase 7, prepare the submission, harden the app, or finalise the README, or when docs/STATUS.md shows Phase 7 is the next incomplete phase."
---

# Phase 7 — Hardening and submission

**Goal.** Accessibility, performance and security passes, PWA, Dockerfile, README from the template, final audit, repo rules.

**Protocol (every phase).** Re-read `AGENTS.md`. Open `docs/STATUS.md` and confirm the previous phase is `done` with evidence (if not, finish it first). Write a short plan (files you will touch, in order) before coding. Work in small vertical slices, commit after each green unit (`npm run check`), and keep the app runnable at all times. Only open the docs this phase lists. Never claim a check passed unless you ran it. When the exit gate is met, update `docs/STATUS.md` (phase ledger, requirement ledger, journeys, decisions, not-run list) and give the report below. Then **stop and wait** for the next instruction unless the user asked for autonomous mode.

**Read first.** `docs/SECURITY-PRIVACY.md` §8; `docs/DESIGN-SYSTEM.md` §10; `docs/TEST-STRATEGY.md` §9-10; `docs/ARCHITECTURE.md` §13, §15, §17; `docs/templates/README.template.md`; the repository rules in `AGENTS.md` §10.

**Build.**
1. **Scope truth pass:** remove every unfinished route, button and card; mark requirements `removed` in `STATUS.md`; the README Roadmap lists them.
2. **Accessibility:** jsx-a11y clean; axe smoke on every main screen; keyboard-only run of J1-J7; 320 px and 200% zoom; dark mode; reduced motion; forced-colours spot check; record what was not verified.
3. **Performance:** run the production build; record chunk sizes against `ARCHITECTURE.md` §13; fix regressions (lazy routes, lazy charts, dynamic Firebase); Lighthouse only if available.
4. **Security:** work through `SECURITY-PRIVACY.md` §8 line by line; add the bundle secret-scan test (architecture item 8); run `npm audit --omit=dev` and record the result; verify CSP in the built app.
5. **PWA** (`vite-plugin-pwa`, update prompt) and a multi-stage **Dockerfile** (Node 22 slim, non-root, `npm ci --omit=dev`).
6. **Docs:** reconcile `docs/` with the code (ADR for every deviation), generate `README.md` from the template using only real results from `STATUS.md`, and keep README claims strictly within what is `done`.
7. **Final gates:** `npm run check`, `bash scripts/verify-submission.sh` (single `main` branch, < 10 MB, no secrets, README sections), then run the `gatherwise-audit` skill and fix confirmed defects.

**Do not.** No new features. No deleting working features to simplify. No fabricated URLs, test counts, deployments or integrations. No force-pushes that hide history of a leaked secret (rotate the key instead).

**Exit gate.** All gates green with evidence in `STATUS.md`; `verify-submission.sh` passes; README has no placeholders; the final completion report lists features implemented, tests actually run (and not run), unresolved issues, manual configuration required, repository status and exact submission steps.

**Report format.**
```
PHASE 7 REPORT
Built: <what exists and works>
Evidence: <exact commands run -> results, with counts>
Journeys checked: <J ids and result>
Not run / gaps: <honest list>
Decisions logged: <ids or dates in STATUS.md>
Next: <first three tasks of the next phase>
```
