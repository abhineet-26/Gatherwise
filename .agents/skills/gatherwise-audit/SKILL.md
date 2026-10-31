---
name: gatherwise-audit
description: "Independent senior-reviewer audit of the GatherWise repository against the Challenge 5 rubric (code quality, problem alignment, security, efficiency, testing, accessibility, submission rules). Use when the user says 'audit', 'review the repo', 'check against the rubric' or before a submission attempt. Reports evidence; fixes only confirmed defects."
---

# GatherWise independent audit

You are an independent senior engineering reviewer, not the author. Inspect the **actual repository** and run the available checks. Do not regenerate the app, do not redesign working features, do not create branches.

**Run:** `npm run check`, `bash scripts/verify-submission.sh`, and `npm audit --omit=dev` (record results; "not run" if impossible).

**Audit in this priority order** (rubric weight in brackets), quoting file paths and line numbers as evidence:
1. **Code quality [high]:** boundary violations, files over 400 lines, duplicated calculations outside `shared/domain`, `any`/`@ts-ignore`, dead code, unclear names, missing explicit types on exports, inconsistent patterns, components holding business rules.
2. **Problem alignment [high]:** do weddings, birthdays and community events each get relevant plans, budgets, timelines, vendor checklists and personalised ideas? Do recommendations visibly respond to constraints and explain why? Walk journeys J1-J7 and record results. Look for dead buttons, placeholder charts and fake data presented as real.
3. **Security [medium]:** Gemini only on the server; no key in bundle or history; Zod at every route; auth and ownership logic; rate limits; CSP; AI allow-list, new-money rule, number audit; PII excluded from AI context and logs; CSV/ICS guards; Firestore rules (tested or "not tested").
4. **Efficiency [medium]:** bundle sizes vs budgets, lazy loading, bounded reads, duplicate requests, unnecessary dependencies vs the allow-list.
5. **Testing [low]:** run the suite; check kernel, reducers (inverse), engine, API, AI guard and architecture tests exist and mean something; list gaps.
6. **Accessibility [low]:** keyboard path, labels, focus, contrast tokens, status not colour-only, chart alternatives, reduced motion, 320 px.
7. **Submission rules:** single `main` branch, repo < 10 MB, public-ready, README sections (vertical, approach, how it works, assumptions) present and truthful, no placeholders, no claims beyond `STATUS.md`.

**Then:** reproduce and fix confirmed defects with small targeted commits (a failing test first when possible), re-run the checks, and update `docs/STATUS.md`.

**Final report (exact sections):** Confirmed strengths · Defects found and fixed · Unresolved risks · Checks actually passed (with counts) · Checks not run (with reason) · Manual setup still required · Submission readiness verdict (ready / not ready, and why). Never mark a check passed unless it ran. Never fabricate a URL, push, deployment or test result.
