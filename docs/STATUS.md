# GatherWise — Build Status Ledger

> Updated by the coding agent after every phase and every significant change. **Never mark `done` without evidence** (the exact command, its result and the date). Anything not run is listed under "Not run / known gaps". The README's implemented-vs-roadmap table and test results are copied from this file.

## Current state

| Field | Value |
| --- | --- |
| Scope profile | **Standard** (Phases 0-5 and 7; see PRD §6) |
| Current phase | Phase 2 (Core Workspace UI) |
| Last updated | 2026-11-01 |
| Last `npm run check` | 2026-11-01: typecheck clean, 16 test files (117 tests) pass, build clean (dist/client 55 KB gzip JS) |
| Repo size / branches | Tracked files: ~590 KB (< 10 MB limit), branch: main |

## Phase ledger

| Phase | Scope | Status | Evidence (command → result, date) | Notes |
| --- | --- | --- | --- | --- |
| P0 | Foundation: scaffold, tooling, CI, tokens, shell, ports, kernel tests green, architecture tests | done | `npm run check` → 10 files (93 tests) passed; `GET /api/health` → `{ai:false, weather:true, cloud:false}` (2026-11-01) | Baseline JS bundle 55 KB gzip (budget 180 KB) |
| P1 | Domain: schemas, commands, undo, planning engine, readiness, risks | done | `npm run check` → 16 files (117 tests) passed (2026-11-01) | Pure domain, reversible commands, wedding/birthday/community packs |
| P2 | Core UI: wizard, dashboard, tasks, budget, payments, exports, demo + Time Travel | in_progress | | |
| P3 | Vendors, quotes, guests, headcount, catering brief | todo | | |
| P4 | AI copilot, tools, proposals, fallback, Idea Studio | todo | | |
| P5 | What-if Lab, weather, quote scanner, invite studio, contingency, drift | todo | | |
| P6 | Run-of-show, Day-of, funding, cloud mode, Hindi (Full tier) | todo | | |
| P7 | Hardening, PWA, docs, README, audit, submission checks | todo | | |

## Journey checks (PRD §7)

| Journey | Date | Result | Notes |
| --- | --- | --- | --- |
| J1 First plan in minutes | | not run | |
| J2 Money truth | | not run | |
| J3 Compare caterers | | not run | |
| J4 Plans change (assistant + proposal + undo) | | not run | |
| J5 RSVP to caterer | | not run | |
| J6 Time pressure (Time Travel) | | not run | |
| J7 Rain on the parade | | not run | |
| J8 Day-of (Full) | | not run | |
| J9 Sponsors (Full) | | not run | |

## Requirement ledger

Status values: `todo`, `partial`, `done`, `removed` (removed = taken out of the UI and listed under Roadmap in the README).

| ID | Tier | Phase | Requirement | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| EVT-01 | C | P2 | Guided wizard (≤ 9 steps) with questions specific to the event type; back/next… | todo | |
| EVT-02 | C | P2 | Money fields accept "5 lakh", "₹5,00,000", "2.5cr", "Rs. 25,000/-" and echo th… | todo | |
| EVT-03 | C | P2 | A past event date offers *Correct the date* or *Reconcile a past event*; no no… | todo | |
| EVT-04 | C | P2 | **Plan preview** before applying | todo | |
| EVT-05 | C | P2 | Event dashboard ("command centre") | todo | |
| EVT-06 | C | P2 | Multi-function events (SubEvents) with presets or custom names, per-function d… | todo | |
| EVT-07 | S | P5 | Date assist | todo | |
| EVT-08 | C | P2 | Changing the date proposes a re-flow of unlocked tasks (old → new diff) for ap… | todo | |
| EVT-09 | C | P2 | Delete event with confirmation, export-first prompt and session undo; switch b… | todo | |
| PLN-01 | C | P1 | generatePlan(event, pack, today) returns tasks, budget lines, risks, vendor ca… | done | `npm test` → 6 tests in `shared/planning/engine.test.ts` pass |
| PLN-02 | C | P1 | Schedule compression for short timelines; infeasible tasks flagged and turned … | done | `npm test` → compressed schedule test passes |
| PLN-03 | C | P1 | Each generated item carries a "Why this?" explanation naming its inputs | done | `npm test` → whyThis presence verified on tasks & budget lines |
| PLN-04 | C | P1 | Budget profiles (standard/lean) allocate exactly (largest remainder); per-gues… | done | `npm test` → 7 tests in `shared/domain/money/allocate.test.ts` pass |
| PLN-05 | C | P1 | Outstanding-decisions list (venue, catering style, accommodation, rain plan…) … | done | `npm test` → engine returns structured decisions list |
| PLN-06 | C | P1 | Packs are data | done | Wedding, Birthday, Community pure data packs in `shared/planning/packs/` |
| BUD-01 | C | P2 | Budget lines with low/likely/high estimates and a basis badge (template / your… | todo | |
| BUD-02 | C | P2 | Commitments from accepted quotes; payments with mode (UPI, cash, bank, cheque,… | todo | |
| BUD-03 | C | P2 | Summary exactly per DOMAIN-MODEL.md §5.1 | todo | |
| BUD-04 | C | P2 | Stacked budget bar with direct text labels and a table alternative (no colour-… | todo | |
| BUD-05 | C | P2 | Alerts for overdue and due-soon payments, tight and over-budget states | todo | |
| BUD-06 | S | P3 | Payment calendar | todo | |
| BUD-07 | S | P5 | **What-if Lab | todo | |
| BUD-08 | S | P5 | Commitment drift | todo | |
| BUD-09 | C | P2 | Post-event reconciliation | todo | |
| TSK-01 | C | P2 | Task CRUD | todo | |
| TSK-02 | C | P2 | Derived status (completed / overdue / due soon / upcoming / skipped, plus bloc… | todo | |
| TSK-03 | C | P2 | List, board and month-calendar views; filter, sort, progress per category | todo | |
| TSK-04 | C | P2 | Dependencies never silently violated; warnings on conflict; critical path high… | todo | |
| TSK-05 | C | P2 | Upcoming-deadlines panel on the dashboard | todo | |
| TSK-06 | C | P2 | .ics export (RFC 5545 escaping and folding) | todo | |
| TSK-07 | C | P2 | Locked dates (user-pinned) are never moved by re-flow | todo | |
| VND-01 | C | P3 | Manual vendors with category, contact, status pipeline; **no** verified/recomm… | todo | |
| VND-02 | C | P3 | Quote capture | todo | |
| VND-03 | C | P3 | Normalisation to tax-inclusive true cost at the planned headcount; sensitivity… | todo | |
| VND-04 | C | P3 | Side-by-side comparison with editable weights; expired and tax-unknown flags; … | todo | |
| VND-05 | C | P3 | Category enquiry checklists and contract-review reminders (TEMPLATE-PACKS.md §… | todo | |
| VND-06 | C | P3 | Accept quote → commitment + payment schedule split exactly with allocateByWeig… | todo | |
| VND-07 | S | P5 | **Quote Scanner | todo | |
| VND-08 | C | P3 | One-tap call and WhatsApp links (tel | todo | |
| GUE-01 | C | P3 | Guest rows as invitation units (person or household) | todo | |
| GUE-02 | C | P3 | RSVP status per function with progress (invited / replied / attending) | todo | |
| GUE-03 | C | P3 | Headcount planner per function (low/likely/high + catering headcount); editabl… | todo | |
| GUE-04 | C | P3 | **Catering Brief | todo | |
| GUE-05 | C | P3 | CSV import (mapping, dedupe, preview) and export (privacy warning, formula-inj… | todo | |
| GUE-06 | C | P3 | Invitation text with placeholders; copy; per-guest *Open in WhatsApp* link; no… | todo | |
| GUE-07 | S | P5 | **Invite Studio | todo | |
| GUE-08 | C | P3 | Search, filter, 100-per-page pagination | todo | |
| GUE-09 | F | P6 | Seating helper | todo | |
| AST-01 | C | P4 | Event-aware chat; answers separate **facts (from tools)**, **estimates**, **as… | todo | |
| AST-02 | C | P4 | Read-only tools over a PII-minimised snapshot | todo | |
| AST-03 | C | P4 | Proposal cards with diff, deterministic impact preview, per-item approve/edit/… | todo | |
| AST-04 | C | P4 | Rule-based fallback assistant using the same tools, clearly labelled, works wi… | todo | |
| AST-05 | C | P4 | Prompt-injection defences, size limits, schema-validated output with one repai… | todo | |
| AST-06 | C | P4 | **Idea Studio | todo | |
| AST-07 | S | P5 | Quick-add by chat ("paid ₹50,000 to caterer by UPI yesterday") → proposal need… | todo | |
| AST-08 | C | P4 | Contextual suggested prompts | todo | |
| AST-09 | S | P5 | **Contingency planner | todo | |
| INT-01 | C | P1–P2 | **Readiness** score, **Expected**, **Pace**, five dimensions (the *Readiness B… | todo | |
| INT-02 | C | P1–P2 | **Risk register** from rule packs with resolve / accept / mitigating states an… | todo | |
| INT-03 | S | P5 | **Weather Watch | todo | |
| EXE-01 | F | P6 | Run-of-show per function | todo | |
| EXE-02 | F | P6 | **Day-of Mode | todo | |
| EXE-03 | F | P6 | Volunteer roster and shift coverage gaps (community) | todo | |
| FND-01 | F | P6 | Funding sources and sponsor pipeline, coverage ratios, deliverables checklist,… | todo | |
| EXP-01 | C | P2–P3 | Print-ready event plan (clean when saved as PDF); vendor brief and catering br… | todo | |
| EXP-02 | C | P2 | CSV exports | todo | |
| EXP-03 | C | P2 | Full JSON export and delete-all (data portability and erasure) | todo | |
| DEM-01 | C | P2 | *Try the demo* with three seeded events designed to light up every feature (Ap… | todo | |
| DEM-02 | C | P2 | **Time Travel** (demo only) | todo | |
| DEM-03 | C | P2 | Persistent "Demo — stored only in this browser" banner and Reset | todo | |
| SYS-01 | C | P0 | Zero-config boot; capability flags from /api/health; clear banners when AI/wea… | todo | |
| SYS-02 | C | P1 | **Activity log and Undo** (last 50 commands) | done | `npm test` → 6 tests in `shared/commands/reducer.test.ts` pass |
| SYS-03 | C | P0 | CI workflow and verify-submission.sh | todo | |
| SYS-04 | S | P7 | Installable PWA; core features work offline | todo | |
| SYS-05 | F | P6 | Firebase Auth (Google) + Firestore adapter + rules; **only reported as working… | todo | |
| SYS-06 | F | P6 | Hindi UI via i18n dictionary | todo | |

## Decisions and assumptions log

| Date | Decision or assumption | Reason | Docs updated |
| --- | --- | --- | --- |
| 2026-10-24 | Gemini model ids read from env; defaults `gemini-3.8-flash` / `gemini-3.5-flash-lite` | Documented stable ids on 2026-10-19; re-verify when building | `.env.example` |

## Not run / known gaps

List every check or feature that was not exercised, with the reason (for example: Firestore rules tests need the emulator; real Gemini smoke needs a key; Lighthouse; real screen-reader pass).

- <!-- AGENT: keep this list honest; delete this line when real entries exist -->
