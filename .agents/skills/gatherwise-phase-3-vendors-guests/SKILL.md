---
name: gatherwise-phase-3-vendors-guests
description: "Runs Phase 3 of the GatherWise build (vendors, quotations and guests): vendor pipeline, GST-aware quote capture and comparison, accept-to-commitment with payment schedules, guests with RSVP per function, headcount planner, catering brief, invitations via WhatsApp links. Use when the user asks to run phase 3, build vendors and quotes, or build the guest list and catering brief, or when docs/STATUS.md shows Phase 3 is the next incomplete phase."
---

# Phase 3 — Vendors, quotations and guests

**Goal.** Vendor pipeline, GST-aware quote capture and comparison, accept-to-commitment with payment schedules, guests with RSVP per function, headcount planner, catering brief, invitations via WhatsApp links.

**Protocol (every phase).** Re-read `AGENTS.md`. Open `docs/STATUS.md` and confirm the previous phase is `done` with evidence (if not, finish it first). Write a short plan (files you will touch, in order) before coding. Work in small vertical slices, commit after each green unit (`npm run check`), and keep the app runnable at all times. Only open the docs this phase lists. Never claim a check passed unless you ran it. When the exit gate is met, update `docs/STATUS.md` (phase ledger, requirement ledger, journeys, decisions, not-run list) and give the report below. Then **stop and wait** for the next instruction unless the user asked for autonomous mode.

**Read first.** `docs/PRD.md` §7 (J3, J5) and §8.5-8.6; `docs/DOMAIN-MODEL.md` §5.4-5.6; `docs/TEMPLATE-PACKS.md` §4; `docs/SECURITY-PRIVACY.md` §3.3.

**Build.**
1. Vendors: manual CRUD, status pipeline, category enquiry checklists and contract-review reminders, one-tap `tel:` and `wa.me` links; no verified or recommended labels.
2. Quotations: capture form (pricing model, tax mode, GST %, service charge, inclusions, deposit %, validity, cancellation, payment schedule); display normalised **total with tax** at the planned headcount with assumptions and flags; headcount sensitivity; side-by-side comparison with editable weights using `compareQuotes`.
3. Accept quote -> `AcceptQuotation` creates the commitment (snapshotting `headcountAtAcceptance`) and a payment schedule split with `allocateByWeights`; payment calendar by month.
4. Guests: rows as invitation units (party size, children counts, side labels, group, dietary, accessibility with sensitivity notice), per-function invitations and RSVPs, search/filter, 100-per-page paging.
5. CSV import with column mapping, dedupe and preview; CSV export with privacy warning, formula-injection guard and UTF-8 BOM.
6. Headcount planner per function using `estimateAttendance` with editable assumptions and post-function calibration; **Catering Brief** (counts by dietary tag, plate equivalents, buffer, allergen flags) with print and CSV; vendor brief print page.
7. Invitation text builder with placeholders, copy button, per-guest *Open in WhatsApp* link; nothing is sent by the app.

**Do not.** No AI scanning yet. No fabricated vendor data. Never put guest names, contacts or notes into logs or analytics.

**Exit gate.** J3 (₹4,95,600 vs ₹4,65,000 at 300 guests) and J5 pass by hand; CSV import/export tests including injection and Indic-script round trip; quote and guest components pass axe smoke; `npm run check` green.

**Report format.**
```
PHASE 3 REPORT
Built: <what exists and works>
Evidence: <exact commands run -> results, with counts>
Journeys checked: <J ids and result>
Not run / gaps: <honest list>
Decisions logged: <ids or dates in STATUS.md>
Next: <first three tasks of the next phase>
```
