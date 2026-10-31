<!--
TEMPLATE for the repository README (Phase 7). Copy to /README.md, then replace every
<!-- AGENT: … --> placeholder with REAL values taken from docs/STATUS.md and actual command output.
Delete sections for features that were not built (move them to Roadmap). Do not invent URLs,
test counts, benchmarks, deployments or integrations. scripts/verify-submission.sh fails while
any AGENT placeholder remains.
-->

# GatherWise

**Plan beautifully. Spend wisely. Celebrate confidently.**

An execution-first planning workspace for Indian celebrations — weddings, birthdays and community events — with budgets that add up, timelines that adapt, vendor checklists and quote comparison, and an AI copilot that *proposes* changes you approve.

## Chosen vertical

**Challenge 5 — Celebration & Event Planner:** a GenAI-powered planning assistant that helps people organise weddings, birthdays and community events with budgets, timelines, vendor checklists and personalised ideas. <!-- AGENT: one sentence on which user types the demo covers -->

## The problem

<!-- AGENT: 4–6 lines adapted from docs/PRD.md §2: budget surprises (+GST vs inclusive quotes, double-counted deposits), missed lead times, per-function headcounts, scattered coordination, tools that advise but do not calculate. -->

## Approach and logic

GatherWise is built on three rules that are visible in the code, not just the pitch:

1. **The app calculates.** Money is integer paise; budgets, quote comparison, schedules, headcounts and readiness are pure functions in `shared/domain` with property-based tests. No arithmetic is delegated to an LLM.
2. **The AI proposes.** Gemini reads the plan through read-only tools and returns *proposals*. Each proposal is validated, previewed with exact before/after numbers, approved by a human, applied as an undoable command.
3. **Everything is explained.** Every task, risk and score shows the inputs that produced it; heuristics are labelled with provenance (`docs/BENCHMARKS.md`).

Key algorithms: the budget identity (committed / paid / outstanding / projected with no double counting), GST-aware true-cost quote normalisation, lead-time scheduling with compression for short timelines, attendance and catering headcount per function, an explainable Readiness score with Expected and Pace, and a rule-based risk register. Formulas and worked examples: `docs/DOMAIN-MODEL.md`.

## How it works

<!-- AGENT: paste the system-context Mermaid diagram from docs/ARCHITECTURE.md §3 and the AI sequence diagram from docs/AI-DESIGN.md §6. -->

**A first plan in minutes:** choose the event type → answer a short wizard → review the generated plan and its assumptions → create the workspace → track tasks, money, vendors and guests → ask the copilot questions about *your* event.

<!-- AGENT: 4–6 lines describing the demo path actually implemented (journeys J1–J7 that pass in docs/STATUS.md). -->

## Features

| Area | Implemented | Notes |
| --- | --- | --- |
<!-- AGENT: one row per module with ✓ only for requirements marked `done` in docs/STATUS.md. -->

**Roadmap (not implemented):** <!-- AGENT: list every requirement marked todo/partial/removed, plus: guest-facing RSVP page, collaborators and roles, vendor partner data, native mobile apps. -->

## Assumptions

- Planning numbers (lead times, budget splits, attendance rates, contingency) are **editable heuristics**, not facts or quotes; sources and reliability are in `docs/BENCHMARKS.md`.
- GST and permit information is entered by the user or shown as "verify locally" prompts; GatherWise gives no legal or tax advice.
- Vendors, prices and availability are entered by the organiser; the app never invents or verifies vendors.
- Demo data is fictional and labelled; demo mode stores data only in your browser.
- <!-- AGENT: add any assumption made during the build, copied from the decisions log in docs/STATUS.md -->

## Tech stack and structure

TypeScript (strict) · React + Vite + Tailwind + Radix · Zustand · Node 22 + Express · Zod · Gemini via `@google/genai` (server only) · IndexedDB (default) / Firestore (optional) · Vitest + Testing Library + fast-check.

<!-- AGENT: short tree of the real top-level folders and one line on the dependency rules (docs/ARCHITECTURE.md §5). -->

## Quick start (no keys needed)

```bash
git clone <!-- AGENT: repo URL from the user, only if it exists -->
cd gatherwise
npm install
npm run dev          # http://localhost:3000  (demo mode, built-in assistant)
```

**Enable Gemini (optional):** copy `.env.example` to `.env`, set `GEMINI_API_KEY` (and check `GEMINI_MODEL` against Google's current model list). The key stays on the server; the app works without it.
**Cloud mode (optional):** <!-- AGENT: include only if built and exercised; otherwise write "not enabled in this submission". -->

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server (client + API) |
| `npm run check` | Typecheck + lint + tests + build + architecture/security tests |
| `npm test` | Unit and integration tests |
| `npm run build` / `npm start` | Production build and server |
| `bash scripts/verify-submission.sh` | Branch, size, secrets and README checks |

## Testing

<!-- AGENT: paste the REAL summary of `npm run check` (file/test counts, coverage for shared/domain) with the date. List what was NOT run and why (e.g. Firestore rules emulator, real Gemini smoke, Lighthouse, screen reader). Do not write numbers from memory. -->

Strategy: `docs/TEST-STRATEGY.md`.

## Security and privacy

Server-side secrets · Zod validation at every boundary · rate limits and a daily AI cap · CSP and security headers · no raw HTML rendering · CSV/ICS escaping · AI sees a PII-minimised summary, never guest names or contacts · AI cannot change data without approval · export and delete-all available. Details and honest limitations: `docs/SECURITY-PRIVACY.md`. <!-- AGENT: state the result of `npm audit` and of the secret scans, or say not run. -->

## Accessibility

Keyboard-operable UI, visible focus, labelled controls, status never conveyed by colour alone, chart table alternatives, reduced-motion support, verified contrast (`docs/DESIGN-SYSTEM.md`). <!-- AGENT: state what was checked (jsx-a11y, axe smoke, keyboard walkthrough) and what was not (e.g. no screen-reader run). -->

## Efficiency

Route-level code splitting, lazy charts and Firebase, bounded and paged reads, cached AI responses, small dependency allow-list. <!-- AGENT: paste real build output sizes versus the budgets in docs/ARCHITECTURE.md §13. -->

## Known limitations

<!-- AGENT: honest list: heuristics not validated with users, no live vendor data, AI quality depends on the model, cloud mode status, languages supported, browsers tested. -->

## Deployment

<!-- AGENT: how to build and run (`npm run build`, `npm start`, env vars, health check `/api/health`, Dockerfile if added). Do not claim a live URL unless one exists. -->

## How this maps to the evaluation criteria

| Criterion | Where to look |
| --- | --- |
| Code quality | `docs/ARCHITECTURE.md` (layers, patterns, fitness tests), `docs/adr/`, `AGENTS.md`, `shared/domain/` |
| Problem-statement alignment | PRD journeys J1–J7, `docs/TEMPLATE-PACKS.md`, budget/timeline/vendor/idea modules |
| Security | `docs/SECURITY-PRIVACY.md`, `server/middleware`, `tests/security` |
| Efficiency | Build output, lazy routes, bounded reads, AI cache |
| Testing | `npm run check` output above, `docs/TEST-STRATEGY.md` |
| Accessibility | `docs/DESIGN-SYSTEM.md` §10, a11y tests |

## Repository rules

Public repository · single branch `main` · under 10 MB · no secrets committed · verify with `bash scripts/verify-submission.sh`.

## Data sources and credits

Planning heuristics are drawn from published guides and press reports listed in `docs/BENCHMARKS.md` (not independently verified). Fonts: Bricolage Grotesque and Figtree (SIL OFL). Weather: Open-Meteo (non-commercial use). <!-- AGENT: add any other attribution that applies. -->
