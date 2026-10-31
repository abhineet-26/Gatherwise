---
name: gatherwise-phase-0-foundation
description: "Runs Phase 0 of the GatherWise build (foundation): project scaffold, tooling, CI, design tokens, app shell, ports, golden kernel tests, architecture tests, zero-config boot. Use when the user asks to run phase 0, start the GatherWise build, or set up the project skeleton, or when docs/STATUS.md shows Phase 0 is the next incomplete phase."
---

# Phase 0 — Foundation

**Goal.** Project scaffold, tooling, CI, design tokens, app shell, ports, golden kernel tests, architecture tests, zero-config boot.

**Protocol (every phase).** Re-read `AGENTS.md`. Open `docs/STATUS.md` and confirm the previous phase is `done` with evidence (if not, finish it first). Write a short plan (files you will touch, in order) before coding. Work in small vertical slices, commit after each green unit (`npm run check`), and keep the app runnable at all times. Only open the docs this phase lists. Never claim a check passed unless you ran it. When the exit gate is met, update `docs/STATUS.md` (phase ledger, requirement ledger, journeys, decisions, not-run list) and give the report below. Then **stop and wait** for the next instruction unless the user asked for autonomous mode.

**Read first.** `AGENTS.md`; `docs/ARCHITECTURE.md` §4-8, §10, §13, §17; `docs/DESIGN-SYSTEM.md` §2-6, §9; `docs/TEST-STRATEGY.md` §2; `docs/SECURITY-PRIVACY.md` §3.1 and §3.4.

**Build.**
1. Inspect the workspace. Reuse any platform scaffold, otherwise create a Vite + React + TypeScript client and an Express server in **one** `package.json` (Node 22). Keep platform-required entry points but route them into `server/` and `src/`. Scripts: `dev` (API + Vite), `build`, `start`, `typecheck`, `lint`, `test`, `check` (typecheck + lint + test + build), `verify:submission`.
2. Tooling: TypeScript strict with `noUncheckedIndexedAccess`; path aliases for `shared/*`; ESLint flat config with `typescript-eslint`, `react-hooks`, `jsx-a11y` and `no-restricted-imports` overrides that encode the dependency table in `ARCHITECTURE.md` §5; Prettier; Vitest with a `node` project (shared, server) and a `jsdom` project (src); coverage via v8.
3. Keep `shared/domain/**` exactly as provided (golden kernel, 83 tests). Add `vitest` and `fast-check`, and make those tests pass unchanged. Never edit kernel behaviour in this phase.
4. Server: `config/env.ts` (Zod-parsed env; boots with every variable blank), `createApp(deps)`, middleware (request id, helmet + CSP builder, rate limit, Zod `validate`, safe error envelope), `GET /api/health` returning `{ai, weather, cloud}` capability flags. Test it on an ephemeral port.
5. Client: `tokens.css`, `base.css`, `print.css` from the design system (light, dark, event accents); self-hosted Bricolage Grotesque + Figtree with **both `latin` and `latin-ext`** so ₹ renders in the brand font; primitives (Button, IconButton, Input, Card, StatusPill, Banner, Dialog/ConfirmDialog, Toast, EmptyState, Skeleton); app shell (rail on desktop, bottom tabs on mobile, top bar with capability chip and demo banner); lazy routes; error boundary. Routes for later phases may show an honest "Coming in Phase N" empty state for now; they must be removed or finished before submission.
6. Ports: `WorkspaceRepository`, `Clock`, `IdGenerator` interfaces and an `InMemoryRepository` with a shared contract test suite.
7. `tests/architecture.test.ts` implementing `ARCHITECTURE.md` §17 items 1-7 (item 8 needs a build and is added when it exists).
8. `git init -b main` if needed; commit the docs, `.gitignore`, `.env.example`, CI workflow and scripts as provided.

**Do not.** Do not start features. Do not hard-code a Gemini model id or key. Do not add dependencies outside the allow-list.

**Exit gate.** `npm run check` is green; the 83 kernel tests pass untouched; `npm run dev` boots with an empty environment and `/api/health` reports `ai: false`; ₹ renders in Figtree/Bricolage (unit test of the font-face ranges or a recorded visual check); architecture tests pass; initial bundle size recorded in `STATUS.md` as the baseline.

**Report format.**
```
PHASE 0 REPORT
Built: <what exists and works>
Evidence: <exact commands run -> results, with counts>
Journeys checked: <J ids and result>
Not run / gaps: <honest list>
Decisions logged: <ids or dates in STATUS.md>
Next: <first three tasks of the next phase>
```
