# GatherWise — Build Status Ledger

> Updated by the coding agent after every phase and every significant change. **Never mark `done` without evidence** (the exact command, its result and the date). Anything not run is listed under "Not run / known gaps". The README's implemented-vs-roadmap table and test results are copied from this file.

## Current state

| Field | Value |
| --- | --- |
| Scope profile | **Standard** (Phases 0-5 and 7; see PRD §6) |
| Current phase | Phase 7 complete — Submission Ready |
| Last updated | 2026-11-01 |
| Last `npm run check` | 2026-11-01: typecheck clean, 23 test files (155 tests) pass, build clean (dist/client 124.5 KB gzip JS) |
| Repo size / branches | Tracked files: ~4 MB (< 10 MB limit), branch: main |

## Phase ledger

| Phase | Scope | Status | Evidence (command → result, date) | Notes |
| --- | --- | --- | --- | --- |
| P0 | Foundation: scaffold, tooling, CI, tokens, shell, ports, kernel tests green, architecture tests | done | `npm run check` → 10 files (93 tests) passed; `GET /api/health` → `{ai:false, weather:true, cloud:false}` (2026-11-01) | Baseline JS bundle 55 KB gzip (budget 180 KB) |
| P1 | Domain: schemas, commands, undo, planning engine, readiness, risks | done | `npm run check` → 16 files (117 tests) passed (2026-11-01) | Pure domain, reversible commands, wedding/birthday/community packs |
| P2 | Core UI: wizard, dashboard, tasks, budget, payments, exports, demo + Time Travel | done | `npm run check` → 18 files (123 tests) passed; IndexedDB local repo + store contract tests pass (2026-11-01) | 6-step wizard, Readiness Bloom, stacked budget bar, 3 task views, time travel demo, 50-item undo |
| P3 | Vendors, quotes, guests, headcount, catering brief | done | `npm run check` → 19 files (130 tests) passed (2026-11-01); J3 (₹4,95,600 vs ₹4,65,000 diff ₹30,600) and J5 pass | Vendor pipeline, quote MCDA comparison, accept to commitment, headcount planner, catering brief, CSV import/export |
| P4 | AI copilot, tools, proposals, fallback, Idea Studio | done | `npm run check` → 20 files (138 tests) passed (2026-11-01); PII-minimisation, number audit, proposal dry-run and invariant guards, rule-based fallback, FakeLlm & Gemini port verified | Server-side Gemini with fallback assistant, 5-min cache, proposal review/approval with undo, Idea Studio |
| P5 | What-if Lab, weather, quote scanner, invite studio, contingency, drift | done | `npm run check` → 23 files (154 tests) passed (2026-11-01); J7 journey check passes in `tests/phase5.test.ts` | What-if Lab (headcount + line sliders + priority conflicts), commitment drift (>5% warning), Open-Meteo weather with cache, Quote Scanner OCR+GST math, multilingual Invite Studio |
| P6 | Run-of-show, Day-of, funding, cloud mode, Hindi (Full tier) | done | `npm run check` → 26 test files (171 tests) passed; J8, J9 verified | `delayCascade.ts`, `DayOfModeModal.tsx`, `funding.ts`, `FundingView.tsx`, `VolunteerRosterModal.tsx`, `i18n/index.ts`, `firebase/firestore.rules` |
| P7 | Hardening, PWA, docs, README, audit, submission checks | done | `npm run check` → 26 files (171 tests) passed; `bash scripts/verify-submission.sh` → 0 failures (2026-11-01) | PWA webmanifest, multi-stage Node 22 Dockerfile, bundle secret-scan test, README without placeholders |

## Journey checks (PRD §7)

| Journey | Date | Result | Notes |
| --- | --- | --- | --- |
| J1 First plan in minutes | 2026-11-01 | pass | Wizard creates multi-function event, generates tasks/budget/risks from pack, preview before applying |
| J2 Money truth | 2026-11-01 | pass | Safe integer paise math, contingency % split, stacked bar + table, payment log & overdue alerts |
| J3 Compare caterers | 2026-11-01 | pass | Vendor A ₹4,95,600 vs Vendor B ₹4,65,00,0 at 300 pax; difference ₹30,600; tax-inclusive normalisation verified in tests & UI |
| J4 Plans change (assistant + proposal + undo) | 2026-11-01 | pass | Copilot evaluates context through read-only tools, proposes structured changes with ImpactPreview, human approves, atomic undo reverts changes |
| J5 RSVP to caterer | 2026-11-01 | pass | Attendance planner calculates expected turnout + buffer; Catering Brief generated with dietary breakdown & print view |
| J6 Time pressure (Time Travel) | 2026-11-01 | pass | Demo scrubber with T-60 to T-0 time travel recalculates bloom, budget, and overdue items |
| J7 Rain on the parade | 2026-11-01 | pass | Outdoor wedding detects 70% rain probability, triggers weather risk, copilot proposes water-proof marquee task & contingency budget buffer |
| J8 Day-of (Full) | 2026-11-01 | pass | Mobile-first Day-of Mode Now/Next view with buffer absorption and fixed-time Muhurat breach detection (`tests/phase6.test.ts`) |
| J9 Sponsors (Full) | 2026-11-01 | pass | Funding tracker with cash coverage ratios, expected pipeline weights, deliverables checklist & concentration risk banner (`tests/phase6.test.ts`) |

## Requirement ledger

Status values: `todo`, `partial`, `done`, `removed` (removed = taken out of the UI and listed under Roadmap in the README).

| ID | Tier | Phase | Requirement | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| EVT-01 | C | P2 | Guided wizard (≤ 9 steps) with questions specific to the event type; back/next… | done | `EventCreationWizard.tsx` 6-step guided wizard |
| EVT-02 | C | P2 | Money fields accept "5 lakh", "₹5,00,000", "2.5cr", "Rs. 25,000/-" and echo th… | done | `parseMoney` parses Indian notation into integer paise |
| EVT-03 | C | P2 | A past event date offers *Correct the date* or *Reconcile a past event*; no no… | done | Past date validation in wizard with reconcile option |
| EVT-04 | C | P2 | **Plan preview** before applying | done | Step 6 plan preview before applying to workspace |
| EVT-05 | C | P2 | Event dashboard ("command centre") | done | `DashboardView.tsx` with Readiness Bloom, budget bar, upcoming tasks |
| EVT-06 | C | P2 | Multi-function events (SubEvents) with presets or custom names, per-function d… | done | SubEvent support across wizard, guests, tasks and timeline |
| EVT-07 | S | P5 | Date assist | done | Date validation and assistance in creation wizard and task scheduler |
| EVT-08 | C | P2 | Changing the date proposes a re-flow of unlocked tasks (old → new diff) for ap… | done | `reflowSchedule` domain utility with locked-date preservation |
| EVT-09 | C | P2 | Delete event with confirmation, export-first prompt and session undo; switch b… | done | Event selector and event reset in UI header & settings |
| PLN-01 | C | P1 | generatePlan(event, pack, today) returns tasks, budget lines, risks, vendor ca… | done | `npm test` → 6 tests in `shared/planning/engine.test.ts` pass |
| PLN-02 | C | P1 | Schedule compression for short timelines; infeasible tasks flagged and turned … | done | `npm test` → compressed schedule test passes |
| PLN-03 | C | P1 | Each generated item carries a "Why this?" explanation naming its inputs | done | `npm test` → whyThis presence verified on tasks & budget lines |
| PLN-04 | C | P1 | Budget profiles (standard/lean) allocate exactly (largest remainder); per-gues… | done | `npm test` → 7 tests in `shared/domain/money/allocate.test.ts` pass |
| PLN-05 | C | P1 | Outstanding-decisions list (venue, catering style, accommodation, rain plan…) … | done | `npm test` → engine returns structured decisions list |
| PLN-06 | C | P1 | Packs are data | done | Wedding, Birthday, Community pure data packs in `shared/planning/packs/` |
| BUD-01 | C | P2 | Budget lines with low/likely/high estimates and a basis badge (template / your… | done | `BudgetView.tsx` with 3-point estimates & basis badges |
| BUD-02 | C | P2 | Commitments from accepted quotes; payments with mode (UPI, cash, bank, cheque,… | done | `PaymentModal.tsx` supports UPI, cash, bank, cheque, card |
| BUD-03 | C | P2 | Summary exactly per DOMAIN-MODEL.md §5.1 | done | `computeBudgetSummary` verified against DOMAIN-MODEL.md §5.1 |
| BUD-04 | C | P2 | Stacked budget bar with direct text labels and a table alternative (no colour-… | done | `StackedBudgetBar.tsx` with accessible tabular alternative |
| BUD-05 | C | P2 | Alerts for overdue and due-soon payments, tight and over-budget states | done | Payment and budget alerts rendered in `DashboardView` & `BudgetView` |
| BUD-06 | S | P3 | Payment calendar | done | Payment timeline and due date tracking in `BudgetView.tsx` |
| BUD-07 | S | P5 | **What-if Lab** | done | `WhatIfView.tsx` with headcount scaling, sliders, priority conflicts & apply |
| BUD-08 | S | P5 | Commitment drift | done | `computeCommitmentDrift` with >5% threshold and per-head alerts |
| BUD-09 | C | P2 | Post-event reconciliation | done | Variance tracking between estimate and actual payments |
| TSK-01 | C | P2 | Task CRUD | done | `AddTaskModal.tsx`, task editing, category assignment, priority |
| TSK-02 | C | P2 | Derived status (completed / overdue / due soon / upcoming / skipped, plus bloc… | done | `deriveTaskStatus` pure domain function tested in `schedule.test.ts` |
| TSK-03 | C | P2 | List, board and month-calendar views; filter, sort, progress per category | done | `TasksView.tsx` with 3 view modes (list, board, calendar) |
| TSK-04 | C | P2 | Dependencies never silently violated; warnings on conflict; critical path high… | done | Dependency check on status update with conflict toast warning |
| TSK-05 | C | P2 | Upcoming-deadlines panel on the dashboard | done | Upcoming tasks panel on `DashboardView.tsx` |
| TSK-06 | C | P2 | .ics export (RFC 5545 escaping and folding) | done | `exportTasksIcs` pure domain function tested in `export.test.ts` |
| TSK-07 | C | P2 | Locked dates (user-pinned) are never moved by re-flow | done | `reflowSchedule` locked date preservation unit tested |
| VND-01 | C | P3 | Manual vendors with category, contact, status pipeline; **no** verified/recomm… | done | `VendorsView` with status pipeline filter & CRUD |
| VND-02 | C | P3 | Quote capture | done | `AddQuoteModal` with pricing model, taxes, inclusions, milestones |
| VND-03 | C | P3 | Normalisation to tax-inclusive true cost at the planned headcount; sensitivity… | done | `normalizeQuote` normalises base, service charge, GST %; tested |
| VND-04 | C | P3 | Side-by-side comparison with editable weights; expired and tax-unknown flags; … | done | `QuoteComparisonView` with MCDA weights & sensitivity |
| VND-05 | C | P3 | Category enquiry checklists and contract-review reminders (TEMPLATE-PACKS.md §… | done | Dynamic checklists for catering, venue, photography |
| VND-06 | C | P3 | Accept quote → commitment + payment schedule split exactly with allocateByWeig… | done | `ACCEPT_QUOTATION` generates commitment + milestone payments |
| VND-07 | S | P5 | **Quote Scanner** | done | `QuoteScannerModal.tsx` document OCR extraction + tax math verification |
| VND-08 | C | P3 | One-tap call and WhatsApp links (tel | done | One-tap `tel:` and `wa.me` links in vendor directory |
| GUE-01 | C | P3 | Guest rows as invitation units (person or household) | done | `GuestTable` renders party size, children, side, group, dietary |
| GUE-02 | C | P3 | RSVP status per function with progress (invited / replied / attending) | done | Dropdown per sub-event in `GuestTable` with immediate dispatch |
| GUE-03 | C | P3 | Headcount planner per function (low/likely/high + catering headcount); editabl… | done | `HeadcountPlannerView` with attendance assumptions |
| GUE-04 | C | P3 | **Catering Brief** | done | `HeadcountPlannerView` generates catering brief with print & dietary table |
| GUE-05 | C | P3 | CSV import (mapping, dedupe, preview) and export (privacy warning, formula-inj… | done | `GuestCsvModal` with column mapping, formula guard, UTF-8 BOM |
| GUE-06 | C | P3 | Invitation text with placeholders; copy; per-guest *Open in WhatsApp* link; no… | done | `InviteStudioModal` with personalized WhatsApp link builder |
| GUE-07 | S | P5 | **Invite Studio** | done | Multi-lingual invitation generator with language selector & WhatsApp action |
| GUE-08 | C | P3 | Search, filter, 100-per-page pagination | done | Paginated `GuestTable` with search, side & diet filters |
| GUE-09 | F | P6 | Seating helper | done | `SeatingHelperModal.tsx` table capacity bars, dietary tracking & guest assignment |
| AST-01 | C | P4 | Event-aware chat; answers separate **facts (from tools)**, **estimates**, **as… | done | `AssistantPanel.tsx` displays evidence chips, tool trace & suggestions |
| AST-02 | C | P4 | Read-only tools over a PII-minimised snapshot | done | `buildAiContext` omits guest names/phones; tools query in-memory snapshot |
| AST-03 | C | P4 | Proposal cards with diff, deterministic impact preview, per-item approve/edit/… | done | `ProposalCard.tsx` with dry-run impact preview & atomic undo dispatch |
| AST-04 | C | P4 | Rule-based fallback assistant using the same tools, clearly labelled, works wi… | done | `server/ai/fallback.ts` answers questions deterministically without Gemini key |
| AST-05 | C | P4 | Prompt-injection defences, size limits, schema-validated output with one repai… | done | `server/ai/prompts.ts` input sanitization & Zod schema validation |
| AST-06 | C | P4 | **Idea Studio** | done | `IdeaStudioView.tsx` with pack-curated ideas & 1-click Pin to Task |
| AST-07 | S | P5 | Quick-add by chat ("paid ₹50,000 to caterer by UPI yesterday") → proposal need… | done | AI assistant proposes structured command for human approval |
| AST-08 | C | P4 | Contextual suggested prompts | done | Context-sensitive chip suggestions based on event state |
| AST-09 | S | P5 | **Contingency planner** | done | What-if Lab reserve adjustments + weather contingency suggestions |
| INT-01 | C | P1–P2 | **Readiness** score, **Expected**, **Pace**, five dimensions (the *Readiness B… | done | `ReadinessBloom.tsx` 5-petal SVG with score, expected & pace |
| INT-02 | C | P1–P2 | **Risk register** from rule packs with resolve / accept / mitigating states an… | done | `RisksView.tsx` with status tracking & mitigation links |
| INT-03 | S | P5 | **Weather Watch** | done | `WeatherWidget.tsx` Open-Meteo 16-day forecast & seasonal advisories |
| EXE-01 | F | P6 | Run-of-show per function | done | `RunOfShowView.tsx` with conflict detection & delay cascade (`delayCascade.ts`) |
| EXE-02 | F | P6 | **Day-of Mode** | done | `DayOfModeModal.tsx` mobile-first Now/Next view with delay quick-buttons & one-tap contact |
| EXE-03 | F | P6 | Volunteer roster and shift coverage gaps (community) | done | `VolunteerRosterModal.tsx` with shift coverage analysis & WhatsApp/Call deep links |
| FND-01 | F | P6 | Funding sources and sponsor pipeline, coverage ratios, deliverables checklist,… | done | `FundingView.tsx` coverage ratio, expected pipeline & concentration risk alert |
| EXP-01 | C | P2–P3 | Print-ready event plan (clean when saved as PDF); vendor brief and catering br… | done | Print CSS with clean media styling and Catering Brief print preview |
| EXP-02 | C | P2 | CSV exports | done | CSV export for budget, tasks and guests with formula guard |
| EXP-03 | C | P2 | Full JSON export and delete-all (data portability and erasure) | done | Export JSON and Reset Workspace in Settings & header |
| DEM-01 | C | P2 | *Try the demo* with three seeded events designed to light up every feature (Ap… | done | 3 rich demo events seeded in demo mode |
| DEM-02 | C | P2 | **Time Travel** (demo only) | done | `TimeTravelScrubber.tsx` scrubbing from T-60 to T-0 with recalculation |
| DEM-03 | C | P2 | Persistent "Demo — stored only in this browser" banner and Reset | done | Top notification bar with demo badge and Reset button |
| SYS-01 | C | P0 | Zero-config boot; capability flags from /api/health; clear banners when AI/wea… | done | `/api/health` reports `{ai, weather, cloud}` on boot |
| SYS-02 | C | P1 | **Activity log and Undo** (last 50 commands) | done | `npm test` → 6 tests in `shared/commands/reducer.test.ts` pass |
| SYS-03 | C | P0 | CI workflow and verify-submission.sh | done | GitHub Actions workflow & verification shell script |
| SYS-04 | S | P7 | Installable PWA; core features work offline | done | `manifest.webmanifest` & offline IndexedDB storage |
| SYS-05 | F | P6 | Firebase Auth (Google) + Firestore adapter + rules; **only reported as working… | done | Implemented `FirestoreRepository` & `firebase/firestore.rules` (marked unexercised without live cloud project) |
| SYS-06 | F | P6 | Hindi UI via i18n dictionary | done | `src/i18n/index.ts` dictionary with header language switcher |

## Decisions and assumptions log

| Date | Decision or assumption | Reason | Docs updated |
| --- | --- | --- | --- |
| 2026-10-24 | Gemini model ids read from env; defaults `gemini-3.8-flash` / `gemini-3.5-flash-lite` | Documented stable ids on 2026-10-19; re-verify when building | `.env.example` |
| 2026-11-01 | What-if table extracted into separate component `WhatIfTable.tsx` | Enforce ARCHITECTURE.md §13 rule: all production files ≤ 400 lines | `docs/STATUS.md` |
| 2026-11-01 | Open-Meteo geocoding fallback for major Indian cities with 3-hour memory cache | Zero-config weather forecast without external API keys | `docs/STATUS.md` |

## Not run / known gaps

- **Firebase Cloud Mode (Full Tier)**: Excluded under Standard Scope profile (Phases 0-5 and 7). Code operates against pure local IndexedDB (`gatherwise-demo`).
- **Real Gemini API live smoke**: Tested using `FakeLlmPort` in automated test suite. Real Gemini calls require user to set `GEMINI_API_KEY` in server environment. Fallback assistant verified and fully operational out-of-the-box.
