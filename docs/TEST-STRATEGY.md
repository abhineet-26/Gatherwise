# GatherWise — Test Strategy

> **Status:** v1.0, 24 Oct 2026. Testing carries a *low* rubric weight but is the evidence that the *high*-weight items (correct logic, maintainable code) are real. So: test the risky core exhaustively, the boundaries sensibly, and the UI as smoke. Keep the gate light enough to run on a modest laptop (Node 22 + npm only; no browser downloads, no emulators).

## 1. Principles

1. **Risk-based.** Spend tests where a bug costs money or trust: money, dates, budgets, schedules, quotes, scores, reducers, AI guards.
2. **Deterministic.** Injected clock and ids; no real network, no real Gemini, no sleeps (use fake timers).
3. **Fast.** The full unit suite runs in under ~60 s; one command for everything: `npm run check`.
4. **Honest.** A check is "passed" only if it ran and passed. Everything that was not run is listed as **not run** with the reason.
5. **Readable.** One behaviour per test, Arrange-Act-Assert, descriptive names, factories instead of copy-pasted fixtures.

## 2. Tooling

| Need | Tool |
| --- | --- |
| Unit / integration | Vitest (`environment: node` for shared/server, `jsdom` for components) |
| Components | `@testing-library/react`, `@testing-library/user-event` |
| Accessibility smoke | `vitest-axe` (axe-core) on key screens in jsdom |
| Property-based | `fast-check` (already used in the golden kernel) |
| HTTP | Node `fetch` against `createApp(deps)` on an ephemeral port (no extra dependency) |
| Storage | `fake-indexeddb` for the local repository; `InMemoryRepository` elsewhere |
| Optional (not in the gate) | `@firebase/rules-unit-testing` (needs the Firestore emulator), Lighthouse, Playwright |

Static checks in the gate: `tsc --noEmit` (strict), ESLint with `typescript-eslint`, `react-hooks`, `jsx-a11y`, and the import-boundary rules; Prettier check.

## 3. What to test, by tier

| Tier | Area | Depth | Examples |
| --- | --- | --- | --- |
| **T1** exhaustive | `shared/domain` (money, dates, budget, quotes, schedule, headcount, readiness, risks, scenarios, run-of-show cascade, funding) | Examples + edge cases + properties | Zero guests, zero or tiny budget, overpayment, refunds, cancelled commitments, expired quotes, unknown tax, event today, event in the past, cycles, compression and infeasible tasks, negative lead (after-event) tasks, ties |
| **T1** | `shared/commands` | Every reducer: result, change set, **inverse restores the original**, input not mutated, `previewImpact` equals applying | Create/update/delete flows, AI allow-list, locked dates and lines |
| **T1** | `shared/planning` | Engine output per pack and per constraint set; pack-as-data fixture | Wedding 300 vs 45 days; outdoor adds rain plan; accessibility adds access tasks; sponsored adds funding tasks |
| **T1** | Exports | CSV (quoting, BOM, formula guard), ICS (escaping, folding, UID), print data builders | `=SUM(A1)` cell neutralised; commas/newlines in names |
| **T1** | AI guards | Allow-list, new-money rule, number audit, schema repair, injection corpus, `buildAiContext` PII exclusion | Malicious fake LLM cannot delete tasks or invent amounts |
| **T2** boundaries | API routes | Validation, auth (fake verifier), rate limit, error envelope, body limits, health capabilities | Unknown keys rejected; 413 on oversize; 429 with `retryAfterSeconds` |
| **T2** | AI orchestration | Fake LLM scripted tool loops: golden prompts (`AI-DESIGN.md` §10), timeout, malformed output, fallback switch | Chat returns evidence + proposal; no key → `AI_UNAVAILABLE` → fallback answer |
| **T2** | Repositories and store | Local adapter against fake-indexeddb; commit atomicity and rollback; `dispatch → undo`; draft recovery | Failed commit rolls back UI state |
| **T3** smoke | Components and screens | Render, key interaction, a11y | Wizard validation and back/next; MoneyInput parsing "5 lakh"; BudgetBar table alternative; ProposalCard approve/reject; ConfirmDialog focus trap and Escape; axe on dashboard, budget, assistant |
| **T4** manual | Journeys J1–J7 (J8–J9 if built), keyboard-only pass, 320 px, print preview, offline reload, screen-reader spot check | Checklist in `STATUS.md` | Recorded with date and result; unverified items stay "not run" |

## 4. Property-based invariants (minimum set)

- `allocateByWeights`: parts sum to total; each within one paisa of the exact share; zero weights get zero.
- `parseMoney(formatMoney(x)) === x` for INR.
- Budget: `Σ line.projected === totals.projected`; `outstanding ≥ 0`; `projected ≥ paid`.
- Schedule: every date between today and the event (for non-negative lead); dependencies never violated.
- Reducers: `apply` then `inverse` yields a deeply equal state; `previewImpact` never mutates its input (deep-freeze inputs in tests).
- Readiness: score within 0–100; completing a task never lowers it; adding an overdue critical task never raises it.
- Quotes: normalisation is monotonic in headcount for per-head pricing.

## 5. Architecture and security tests

`tests/architecture.test.ts` implements `ARCHITECTURE.md` §17; `tests/security/**` implements `SECURITY-PRIVACY.md` §7. They are part of the normal suite so a boundary violation fails the same `npm run check` that everything else uses.

## 6. Coverage targets (reported, not worshipped)

`shared/domain` ≥ 90 % lines and ≥ 85 % branches · `shared/commands` and `shared/planning` ≥ 85 % · `server` ≥ 75 % · UI: no number; judge by the T3 list. Coverage is printed in CI; a drop below target in T1 areas fails the review, not the build.

## 7. Conventions

- Colocated unit tests (`foo.ts` + `foo.test.ts`); cross-cutting tests under `tests/`.
- Factories in `tests/factories.ts` (`makeEvent`, `makeTask`, `makeQuote`, `makeWorkspace`) with a fixed clock (`2026-10-21`) and deterministic ids.
- No snapshot tests except the `buildAiContext` PII snapshot and printed export fixtures.
- Prefer testing behaviour through the public function; no testing of private helpers.
- A bug fix starts with a failing test.

## 8. CI

`.github/workflows/ci.yml` (Node 22): `npm ci` → `npm run typecheck` → `npm run lint` → `npm test -- --coverage` → `npm run build` → bundle secret scan → `npm audit --omit=dev` (reported, non-blocking). `npm run check` runs the same steps locally. `scripts/verify-submission.sh` is run manually before each submission attempt (it checks branches, size, secrets, README sections).

## 9. Reporting rules

At the end of every phase append to `docs/STATUS.md`: the exact command run, the pass/fail counts, the date, and anything **not run** (e.g. Firestore rules tests, real Gemini smoke, Lighthouse, screen reader) with the reason. The README's testing section is copied from those real results; never write numbers from memory.

## 10. Manual QA script (10 minutes)

1. Fresh browser profile, no env keys: app boots, demo banner visible, AI banner says "built-in assistant".
2. Run J1 through J7 using only the keyboard for J1.
3. At 320 px and 1280 px: no horizontal scroll, focus always visible, targets comfortable.
4. Toggle dark mode and reduced motion; check contrast of statuses and charts (text + icon, not colour alone).
5. Reload offline (service worker): core screens load; AI shows a connection state.
6. Print the plan to PDF: readable, no nav chrome, no cut-off tables.
7. Settings: export JSON, delete all, confirm nothing remains.
8. Search the build output for secrets (`AIza`, `GEMINI_API_KEY`).
