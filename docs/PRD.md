# GatherWise — Product Requirements Document

> **Product:** GatherWise — *Plan beautifully. Spend wisely. Celebrate confidently.*
> **Challenge:** Challenge 5 — Celebration & Event Planner (GenAI planning assistant for weddings, birthdays and community events).
> **Version:** 1.0 · 24 Oct 2026 · **Status:** Approved for build.
> Companion documents: `ARCHITECTURE.md`, `DOMAIN-MODEL.md`, `TEMPLATE-PACKS.md`, `AI-DESIGN.md`, `DESIGN-SYSTEM.md`, `SECURITY-PRIVACY.md`, `TEST-STRATEGY.md`, `BENCHMARKS.md`.

## 1. Summary

GatherWise is an **execution-first planning workspace** for Indian celebrations. It turns a few answers about an event into a realistic plan (tasks that fit the time left, a budget that adds up, vendor checklists, risks, personalised ideas), then keeps that plan honest as reality changes. An AI copilot answers questions about the organiser's own event using the same deterministic calculations the app uses, and **proposes** changes that a human approves, previews and can undo.

## 2. Problem

Planning a wedding, birthday or community event in India means juggling many commitments at once: money (often part-paid in cash and UPI), vendors whose quotes arrive as WhatsApp messages and PDFs, relatives and volunteers, and hard deadlines. The common failure modes are concrete:

- **Budget surprises.** Quotes "+GST" versus "all-inclusive" are compared on headline price; deposits and instalments are double-counted or forgotten; per-plate commitments quietly grow when the guest count rises.
- **Missed lead times.** Venue and caterer are booked late; nobody knows which tasks are critical when only 45 days remain.
- **Headcount guesswork.** Caterers bill per plate; RSVPs are informal; multi-function weddings need a separate count per function.
- **Fragmented coordination.** Notes, spreadsheets and chat threads disagree; on the day, nobody has a single run sheet.
- **Weak tools.** Generic checklists ignore context; marketplaces sell vendors, not plans; chatbots give advice but hold no state and cannot add up.

## 3. Goals and non-goals

| # | Goal (measurable) | Verified by |
| --- | --- | --- |
| G1 | A first usable plan in **under 5 minutes** from the landing page, no sign-up (demo mode) | Journey J1 timed manual run |
| G2 | **Every rupee figure** comes from the integer money kernel; totals never drift by a paisa | Kernel property tests; architecture test bans floats in money paths |
| G3 | Plans adapt to **≥ 8 context inputs** (type, date, guests, budget, city tier, setting, priorities, dietary/accessibility) and each recommendation says why | Planning-engine tests + "Why this?" in UI |
| G4 | **Zero silent AI mutations:** 100 % of AI-originated changes go through preview → approval → command → undo | Assistant integration tests with a fake LLM |
| G5 | The whole product works with **no keys and no network** except AI features, which degrade to a labelled rule-based assistant | Boot test with empty env |
| G6 | The repository passes `npm run check` (typecheck, lint, tests, build) and `scripts/verify-submission.sh` | CI + final report |

**Non-goals** (and why): a vendor marketplace or live vendor pricing (we would have to fabricate or scrape data; users enter their own quotes); processing payments or sending invitations (needs licensed providers; we generate copy-ready text and WhatsApp deep links instead); legal or tax advice (GST and permits appear as *inputs and verify-locally prompts*); native mobile apps (a PWA covers phones); team billing or multi-tenant admin; drag-and-drop seating (stretch).

## 4. Personas (archetypes, not research participants)

| Persona | Situation | What they need from GatherWise |
| --- | --- | --- |
| **Ananya, 27, bride-to-be** (co-organises with parents and a brother) | Multi-function wedding, ~220 guests, ₹15–25 L, 10+ vendors, family contributions, outdoor lawn | Per-function headcounts, GST-correct quote comparison, payment calendar, a plan the family can all see, a rain plan |
| **Rahul, 34, birthday dad** | Daughter's 6th birthday, 35 guests, ₹45,000, three weeks to go | A compressed plan, theme and activity ideas for the age, allergy-safe food counts, a 3-hour run sheet |
| **Meera, 20, fest core-team head** | 3-day college fest, ~2,000 footfall, ₹6.5 L, mostly sponsor-funded, 60 volunteers | Sponsor pipeline and coverage, permissions checklist, volunteer roles, day-wise run-of-show, risk register |
| **Suresh, 52, neighbourhood organiser** | Community festival, public collection, volunteers, loudspeaker and safety norms | Simple budget and receipts, permissions prompts, waste plan, accessibility plan |

## 5. Product principles

1. **Numbers you can trust:** integer money, one formula per concept, every total reproducible by hand.
2. **Propose, preview, approve, undo:** the AI never writes to the plan.
3. **Explain everything:** recommendations, risks and scores show the inputs behind them.
4. **India-first, not India-only:** lakh/crore, GST-aware quotes, WhatsApp, cash and UPI, multi-function weddings; currencies, time zones and cultural presets stay configurable and no tradition is hard-coded.
5. **Works anywhere:** zero-config boot, offline day-of, graceful AI fallback.
6. **Honest about uncertainty:** heuristics are labelled, sample data is labelled, nothing fabricated is presented as fact.

## 6. Scope tiers

The build is gated by phases (see `AGENTS.md` and `.agents/skills`). **Never start a higher tier until the lower tier's exit gate passes.** Anything unfinished is removed from the UI and listed under "Roadmap" in the README.

| Tier | Contents | Phases |
| --- | --- | --- |
| **Core (Lite)** | Wizard, planning engine, tasks/timeline, budget & payments, vendors & quotes with GST-aware comparison, guests/RSVP/headcount/catering brief, Idea Studio, tool-grounded Copilot with proposals + fallback, readiness score, risk register, exports, activity log + undo, demo with Time Travel | P0–P4 |
| **Standard (recommended)** | Core + What-if Lab, Weather Watch, Quote Scanner, Invite Studio, contingency planner, commitment drift, quick-add by chat, PWA | + P5, P7 |
| **Full** | Standard + Run-of-Show and Day-of Mode, Funding & sponsorship tracker, Firebase cloud mode, Hindi UI, seating helper | + P6 |

## 7. Key user journeys (the demo path)

Each journey is an acceptance test run by hand at the end of its phase and again in the final audit.

- **J1 — First plan in minutes.** Landing → *Try the demo* → *New event* → wedding wizard (type, date, city, guests, budget "18 lakh", priorities, dietary) → plan preview showing assumptions and "Why this?" → edit one estimate → *Create*. The workspace shows tasks, budget bar, risks and readiness. *Accepted when* all steps work by keyboard alone and the plan survives a refresh.
- **J2 — Money truth.** Accept a venue quote → a commitment appears → record a ₹1,00,000 UPI deposit and a planned instalment → budget shows committed, paid, outstanding, projected without double counting → mark the instalment overdue via Time Travel and see the alert.
- **J3 — Compare caterers.** Enter "₹1,400 per plate + 18 % GST" and "₹1,550 per plate inclusive" at 300 guests → comparison shows **₹4,95,600 vs ₹4,65,000**, flags, headcount sensitivity at ±10 %, and a ranking whose weights the user can edit.
- **J4 — Plans change.** Ask the Copilot "Guests went from 300 to 340 — what happens?" → answer cites tool evidence (budget, headcount, quote drift) → a proposal appears with before/after impact → approve part of it → totals update → *Undo* restores the previous state.
- **J5 — RSVP to caterer.** Import a CSV of guests → set RSVPs per function → headcount planner shows low/likely/high and a catering headcount with buffer → Catering Brief lists counts by dietary tag and allergy flags → print it → send a WhatsApp invitation via deep link.
- **J6 — Time pressure.** Time Travel +45 days → overdue tasks, a compressed schedule, readiness pace *Behind*, the top three next best actions with point gains, and risks with mitigations; accept one mitigation as proposed tasks.
- **J7 — Rain on the parade.** Outdoor event inside the forecast window → Weather Watch raises a rain risk → the contingency planner proposes a Plan B (covered area, vendor notices, timing shift) with cost impact computed by the app.
- **J8 (Full) — Day-of.** Open Day-of Mode on a phone, offline → current and next item → mark "Baraat arrives +20 min late" → the cascade shifts later items, absorbs buffers and stops at a fixed-time ritual with a conflict warning.
- **J9 (Full) — Sponsors.** Fest event → add sponsors by stage → coverage and concentration risk update → deliverables checklist → sponsor report print.

## 8. Functional requirements

Tier: **C** Core · **S** Standard · **F** Full. "Phase" is the phase that delivers it.

### 8.1 Events and wizard (EVT)

| ID | Requirement | Tier | Phase |
| --- | --- | :-: | :-: |
| EVT-01 | Guided wizard (≤ 9 steps) with questions specific to the event type; back/next, inline validation, **draft recovery** after reload | C | P2 |
| EVT-02 | Money fields accept "5 lakh", "₹5,00,000", "2.5cr", "Rs. 25,000/-" and echo the parsed value live | C | P2 |
| EVT-03 | A past event date offers *Correct the date* or *Reconcile a past event*; no normal future schedule is generated | C | P2 |
| EVT-04 | **Plan preview** before applying: assumptions panel, toggle/edit generated items, then *Create* | C | P2 |
| EVT-05 | Event dashboard ("command centre"): readiness, pace, next 7 days, money bar, top risks, next best actions | C | P2 |
| EVT-06 | Multi-function events (SubEvents) with presets or custom names, per-function date, time and headcount | C | P2 |
| EVT-07 | Date assist: compare candidate dates by lead time, weekend/weekday, user blackout dates and a seasonal note | S | P5 |
| EVT-08 | Changing the date proposes a re-flow of unlocked tasks (old → new diff) for approval | C | P2 |
| EVT-09 | Delete event with confirmation, export-first prompt and session undo; switch between multiple events | C | P2 |

### 8.2 Planning engine (PLN)

| ID | Requirement | Tier | Phase |
| --- | --- | :-: | :-: |
| PLN-01 | `generatePlan(event, pack, today)` returns tasks, budget lines, risks, vendor categories, outstanding decisions and assumptions | C | P1 |
| PLN-02 | Schedule compression for short timelines; infeasible tasks flagged and turned into risks | C | P1 |
| PLN-03 | Each generated item carries a "Why this?" explanation naming its inputs | C | P1 |
| PLN-04 | Budget profiles (standard/lean) allocate exactly (largest remainder); per-guest sanity check labelled with benchmark provenance | C | P1 |
| PLN-05 | Outstanding-decisions list (venue, catering style, accommodation, rain plan…) derived from event state | C | P1 |
| PLN-06 | Packs are data: a fixture pack for a new event type loads with no engine change (test) | C | P1 |

### 8.3 Budget and payments (BUD)

| ID | Requirement | Tier | Phase |
| --- | --- | :-: | :-: |
| BUD-01 | Budget lines with low/likely/high estimates and a basis badge (template / your estimate / quote / actual) | C | P2 |
| BUD-02 | Commitments from accepted quotes; payments with mode (UPI, cash, bank, cheque, card), kind (deposit, instalment, final, expense, refund), due and paid dates | C | P2 |
| BUD-03 | Summary exactly per `DOMAIN-MODEL.md` §5.1: committed, paid, outstanding, projected, remaining, contingency, status | C | P2 |
| BUD-04 | Stacked budget bar with direct text labels and a table alternative (no colour-only meaning) | C | P2 |
| BUD-05 | Alerts for overdue and due-soon payments, tight and over-budget states | C | P2 |
| BUD-06 | Payment calendar: dues by month and what is already paid | S | P3 |
| BUD-07 | **What-if Lab:** headcount, line adjustments, per-plate override, disabled lines; deltas, priority conflicts, saved scenarios, apply via proposal | S | P5 |
| BUD-08 | Commitment drift: per-head commitments show the exposure at the current headcount | S | P5 |
| BUD-09 | Post-event reconciliation: planned vs actual by category with variance | C | P2 |

### 8.4 Tasks and timeline (TSK)

| ID | Requirement | Tier | Phase |
| --- | --- | :-: | :-: |
| TSK-01 | Task CRUD: title, description, category, priority, due date, status, assignee (free text), notes, dependencies | C | P2 |
| TSK-02 | Derived status (completed / overdue / due soon / upcoming / skipped, plus blocked) recalculated on any date or status change | C | P2 |
| TSK-03 | List, board and month-calendar views; filter, sort, progress per category | C | P2 |
| TSK-04 | Dependencies never silently violated; warnings on conflict; critical path highlighted | C | P2 |
| TSK-05 | Upcoming-deadlines panel on the dashboard | C | P2 |
| TSK-06 | `.ics` export (RFC 5545 escaping and folding) | C | P2 |
| TSK-07 | Locked dates (user-pinned) are never moved by re-flow | C | P2 |

### 8.5 Vendors and quotations (VND)

| ID | Requirement | Tier | Phase |
| --- | --- | :-: | :-: |
| VND-01 | Manual vendors with category, contact, status pipeline; **no** verified/recommended/rating labels except the organiser's own score | C | P3 |
| VND-02 | Quote capture: pricing model, tax mode, GST %, service charge, inclusions checklist, deposit %, validity, cancellation terms, payment schedule | C | P3 |
| VND-03 | Normalisation to tax-inclusive true cost at the planned headcount; sensitivity at other headcounts | C | P3 |
| VND-04 | Side-by-side comparison with editable weights; expired and tax-unknown flags; needs ≥ 2 eligible quotes | C | P3 |
| VND-05 | Category enquiry checklists and contract-review reminders (`TEMPLATE-PACKS.md` §4) | C | P3 |
| VND-06 | Accept quote → commitment + payment schedule split exactly with `allocateByWeights` | C | P3 |
| VND-07 | **Quote Scanner:** image/PDF → editable quote form; app recomputes totals and flags mismatches; file never stored | S | P5 |
| VND-08 | One-tap call and WhatsApp links (`tel:`, `https://wa.me/`) | C | P3 |

### 8.6 Guests (GUE)

| ID | Requirement | Tier | Phase |
| --- | --- | :-: | :-: |
| GUE-01 | Guest rows as invitation units (person or household): party size, children counts, side, group, dietary, accessibility, per-function invitation | C | P3 |
| GUE-02 | RSVP status per function with progress (invited / replied / attending) | C | P3 |
| GUE-03 | Headcount planner per function (low/likely/high + catering headcount); editable assumptions; calibration after a function | C | P3 |
| GUE-04 | **Catering Brief:** counts by dietary tag, plate equivalents, buffer, allergen flags; print and CSV | C | P3 |
| GUE-05 | CSV import (mapping, dedupe, preview) and export (privacy warning, formula-injection guard, UTF-8 BOM for Excel) | C | P3 |
| GUE-06 | Invitation text with placeholders; copy; per-guest *Open in WhatsApp* link; nothing is sent by the app | C | P3 |
| GUE-07 | **Invite Studio:** AI drafts in chosen language and tone with a "review before sending" notice | S | P5 |
| GUE-08 | Search, filter, 100-per-page pagination | C | P3 |
| GUE-09 | Seating helper: table capacity bars and auto-assign by group | F | P6 |

### 8.7 Assistant (AST)

| ID | Requirement | Tier | Phase |
| --- | --- | :-: | :-: |
| AST-01 | Event-aware chat; answers separate **facts (from tools)**, **estimates**, **assumptions** and **open questions**; evidence chips | C | P4 |
| AST-02 | Read-only tools over a PII-minimised snapshot: budget, tasks, quotes comparison, headcount, readiness, risks, scenario simulate, benchmarks | C | P4 |
| AST-03 | Proposal cards with diff, deterministic impact preview, per-item approve/edit/reject; applied as commands; undoable | C | P4 |
| AST-04 | Rule-based fallback assistant using the same tools, clearly labelled, works with no key | C | P4 |
| AST-05 | Prompt-injection defences, size limits, schema-validated output with one repair attempt, rate limits, daily cap, short-lived response cache | C | P4 |
| AST-06 | **Idea Studio:** personalised themes, menus, décor, activities (library offline + AI), pin → task or note | C | P4 |
| AST-07 | Quick-add by chat ("paid ₹50,000 to caterer by UPI yesterday") → proposal needing explicit confirm | S | P5 |
| AST-08 | Contextual suggested prompts | C | P4 |
| AST-09 | **Contingency planner:** Plan B proposals for rain, vendor cancellation, headcount change | S | P5 |

### 8.8 Intelligence (INT)

| ID | Requirement | Tier | Phase |
| --- | --- | :-: | :-: |
| INT-01 | **Readiness** score, **Expected**, **Pace**, five dimensions (the *Readiness Bloom*) and the three next best actions with point gains (`DOMAIN-MODEL.md` §5.8) | C | P1–P2 |
| INT-02 | **Risk register** from rule packs with resolve / accept / mitigating states and re-open logic | C | P1–P2 |
| INT-03 | **Weather Watch:** Open-Meteo forecast for the event date (when in range), seasonal note otherwise; feeds the risk register | S | P5 |

### 8.9 Execution and funding (EXE, FND)

| ID | Requirement | Tier | Phase |
| --- | --- | :-: | :-: |
| EXE-01 | Run-of-show per function: items with owner, buffer, fixed-time flag; overlap and conflict detection | F | P6 |
| EXE-02 | **Day-of Mode:** mobile-first current/next view, offline, delay cascade, one-tap call/WhatsApp | F | P6 |
| EXE-03 | Volunteer roster and shift coverage gaps (community) | F | P6 |
| FND-01 | Funding sources and sponsor pipeline, coverage ratios, deliverables checklist, concentration risk | F | P6 |

### 8.10 Exports, demo and platform (EXP, DEM, SYS)

| ID | Requirement | Tier | Phase |
| --- | --- | :-: | :-: |
| EXP-01 | Print-ready event plan (clean when saved as PDF); vendor brief and catering brief print pages | C | P2–P3 |
| EXP-02 | CSV exports: budget, tasks, vendors, guests (UTF-8 BOM, formula-injection guard) | C | P2 |
| EXP-03 | Full JSON export and delete-all (data portability and erasure) | C | P2 |
| DEM-01 | *Try the demo* with three seeded events designed to light up every feature (Appendix A) | C | P2 |
| DEM-02 | **Time Travel** (demo only): move "today" forward to watch statuses, scores and risks change | C | P2 |
| DEM-03 | Persistent "Demo — stored only in this browser" banner and Reset | C | P2 |
| SYS-01 | Zero-config boot; capability flags from `/api/health`; clear banners when AI/weather are unavailable | C | P0 |
| SYS-02 | **Activity log and Undo** (last 50 commands) | C | P1 |
| SYS-03 | CI workflow and `verify-submission.sh` | C | P0 |
| SYS-04 | Installable PWA; core features work offline | S | P7 |
| SYS-05 | Firebase Auth (Google) + Firestore adapter + rules; **only reported as working if exercised** | F | P6 |
| SYS-06 | Hindi UI via i18n dictionary | F | P6 |

## 9. Non-functional requirements

| Area | Requirement |
| --- | --- |
| Accessibility | WCAG 2.2 AA target: semantic HTML, labelled inputs, visible focus, keyboard-operable dialogs/menus/wizard, ≥ 24 px (44 px on touch) targets, contrast verified (`DESIGN-SYSTEM.md`), status never colour-only, charts with text/table alternatives, live regions for async results, reduced-motion respected, `lang` set on non-English text |
| Performance | Budgets in `ARCHITECTURE.md` §13; route-level code splitting; no repeated storage reads or duplicate AI calls |
| Security | Server-side secrets, validated boundaries, safe rendering, CSP and headers, rate limits, no secrets in the bundle (`SECURITY-PRIVACY.md`) |
| Privacy | PII-minimised AI context, guest data stays on-device in demo mode, export and erase, DPDP-aware design (`SECURITY-PRIVACY.md` §8) |
| Reliability | Atomic change sets with rollback; AI failures never break core flows; error boundary per route |
| Compatibility | Latest two versions of Chrome, Edge, Firefox, Safari; 320 px to 1440 px; no horizontal scroll |
| Localisation | English first; Indian number grouping; 12-hour time display; i18n dictionary structure ready for Hindi |
| Maintainability | Boundaries enforced by tests; ≤ 400 lines per file; Zod-first types; docs updated with code |

## 10. Success metrics

*Challenge (primary):* rubric evidence per Appendix B; `npm run check` green; `verify-submission.sh` green; the J1–J7 demo path completes without errors; zero secrets in git history; repository < 10 MB on a single `main` branch.
*Product (if launched; measured without third-party trackers, e.g. opt-in local counters or a pilot survey):* activation (event created and plan applied within the first session); plan adoption (share of generated tasks kept); proposal approval rate and undo rate; quotes compared per event; seven-day return rate; AI fallback rate; error rate per 1,000 sessions.

## 11. Riskiest assumptions and pre-mortem

**Riskiest assumptions:** (RA1) organisers act on numbers they can trace — mitigated by "Why this?" and formulas shown; (RA2) GST-normalised comparison and per-function headcounts matter enough to change decisions — validate with 3–5 organisers; (RA3) a PII-minimised snapshot gives useful answers — golden-prompt evaluation set in `AI-DESIGN.md` §10; (RA4) the model calls tools reliably — fallback assistant and tool-loop caps; (RA5) lead-time heuristics are reasonable — editable and labelled.

**Pre-mortem — "it is submission day and we failed because…"**

| Failure | Prevention |
| --- | --- |
| The agent built a pretty shell with broken flows | Vertical slices per phase, journey checks as exit gates |
| An arithmetic or date bug embarrassed us | Golden kernel + property tests; no calculation outside `shared/domain` |
| AI features crash without a key | `LlmPort` + fake adapter; rule-based fallback; capability banners |
| Scope ballooned and nothing finished | Tiers, cut line, "remove unfinished UI" rule |
| A secret or `.env` was committed | `.gitignore`, secret scan in CI and `verify-submission.sh` |
| Reviewers could not run it | Zero-config boot; README quick start; demo data |
| Code quality drifted | Lint, architecture tests, file-size limits, ADRs |
| Accessibility was bolted on | `jsx-a11y` lint, Radix primitives, axe smoke tests, keyboard check per phase |
| README promised more than the code does | Implemented vs roadmap table; README results pasted from real runs |
| Repo broke the rules (size, branches) | `verify-submission.sh` before every submission attempt |

## 12. Open questions

| Question | Owner | Blocking? |
| --- | --- | :-: |
| Which exact agent/IDE version and limits will build the project (rule files are capped at 12,000 characters in Antigravity)? | Builder | No — rules are written to fit |
| Is a Firebase project available for cloud mode? | Builder | No — cloud is Full tier |
| Is a public hosted demo wanted beyond the repository link? | Builder | No |
| Are Hindi strings needed for judging, or is the structure enough? | Builder | No |
| Do evaluators run the code or read it? | Unknown | No — design for both |

## Appendix A — Demo scenarios (seeded relative to "today")

Names, vendors and numbers are fictional and labelled **Sample**.

| Scenario | Setup | Deliberate imperfections that light up features |
| --- | --- | --- |
| **Aarohi & Kabir's wedding** (Pune, tier 1) | Wedding, multi-function preset: Haldi (45), Wedding (220), Reception (260 invited); ₹18,00,000; event in 100 days; wedding lawn (mixed setting); priorities food, photography, savings; ~140 guest rows; two caterer quotes (₹1,400 + 18 % GST vs ₹1,550 inclusive); venue booked with a UPI deposit | No rain plan; photographer quote with unknown tax expiring in 5 days; a decorator deposit overdue; catering commitment headcount below expected attendance; two overdue tasks; Jain and nut-allergy guests |
| **Anaya's 6th birthday** (Indore, tier 2) | Birthday, 35 guests (22 children), ₹45,000; home terrace; in 21 days | Compressed schedule; "no benchmark for this city tier" state; nut allergy flagged in the catering brief; budget tight |
| **TechNova college fest** (Nagpur) | Community / college fest, 3 days, footfall estimates, ₹6,50,000, sponsored; in 40 days; Day-1 run-of-show with fixed-time items | One sponsor above 50 % of confirmed funds; permissions tasks open within 30 days (critical risk); funding gap; outdoor stage |

## Appendix B — Rubric traceability

| Criterion (impact) | Where the evidence lives |
| --- | --- |
| Code quality (high) | Layer rules and fitness tests (`ARCHITECTURE.md` §5, §17), `AGENTS.md`, ADRs, golden kernel, file-size and lint rules, colocated tests |
| Problem-statement alignment (high) | Budgets (BUD), timelines (TSK), vendor checklists and quotes (VND), personalised ideas (AST-06), event-specific packs (`TEMPLATE-PACKS.md`), India-first behaviours (§5) |
| Security (medium) | Server-side Gemini only, Zod at boundaries, rate limits, CSP, Firestore rules, PII-minimised AI context, secret scan (`SECURITY-PRIVACY.md`) |
| Efficiency (medium) | Bundle budgets, lazy routes, bounded reads, cached AI responses, small dependency allow-list (`AGENTS.md`) |
| Testing (low) | Kernel (83 tests, property-based), engine, reducers, API, AI contract tests with a fake LLM, architecture and a11y tests (`TEST-STRATEGY.md`) |
| Accessibility (low) | `DESIGN-SYSTEM.md` §10, `jsx-a11y`, Radix, axe smoke tests, keyboard walkthrough in STATUS |

## Appendix C — Glossary

**Commitment** money you are bound to pay (an accepted quote or agreed price). **Payment** money actually moving (deposit, instalment, expense, refund). **Proposal** a set of commands suggested by the AI or by rules, previewed and approved by a human. **ChangeSet** the atomic set of record changes a command produces (also the unit of undo). **Readiness / Expected / Pace** absolute plan completeness, what it should be by now, and the difference. **Heuristic** an editable planning default with provenance, never a fact. **Time Travel** demo-only control that moves "today" forward.
