---
name: gatherwise-phase-4-ai-copilot
description: "Runs Phase 4 of the GatherWise build (ai copilot): server-side Gemini behind LlmPort, tool registry, PII-minimised context, proposals with preview and approval, rule-based fallback, Idea Studio, safety tests. Use when the user asks to run phase 4, build the AI assistant, or integrate Gemini, or when docs/STATUS.md shows Phase 4 is the next incomplete phase."
---

# Phase 4 — AI copilot

**Goal.** Server-side Gemini behind LlmPort, tool registry, PII-minimised context, proposals with preview and approval, rule-based fallback, Idea Studio, safety tests.

**Protocol (every phase).** Re-read `AGENTS.md`. Open `docs/STATUS.md` and confirm the previous phase is `done` with evidence (if not, finish it first). Write a short plan (files you will touch, in order) before coding. Work in small vertical slices, commit after each green unit (`npm run check`), and keep the app runnable at all times. Only open the docs this phase lists. Never claim a check passed unless you ran it. When the exit gate is met, update `docs/STATUS.md` (phase ledger, requirement ledger, journeys, decisions, not-run list) and give the report below. Then **stop and wait** for the next instruction unless the user asked for autonomous mode.

**Read first.** `docs/AI-DESIGN.md` (all); `docs/SECURITY-PRIVACY.md` §3, §4, §7; `docs/DOMAIN-MODEL.md` §6; `docs/PRD.md` §7 (J4) and §8.7. **Before writing the Gemini adapter, read Google's current docs** for function calling, structured output and models (links in `AI-DESIGN.md` §3) and pin the SDK version.

**Build.**
1. `server/ai/llm`: `LlmPort`, `gemini.ts` (stateless; model ids from env; map all errors to `AiError`; preserve model parts verbatim in tool loops; one repair attempt for invalid structured output; timeouts and one retry), and `fake.ts` (scripted).
2. `server/ai/tools`: the read-only tools in `AI-DESIGN.md` §5, each with a Zod schema and `display` strings, plus the `propose_*` tools; tool results capped at 16 KB.
3. Client `buildAiContext` (PII-minimised, tested with a seeded-PII snapshot test) and the strict server schema; sanitiser for control and zero-width characters and tags.
4. Orchestrator: bounded tool loop, proposal validation (schema, command allow-list, locked lines and dates, **new-money rule**), `previewImpact` on every proposal, **number audit** on the answer, 5-minute cache, rate limits and daily cap; routes `POST /api/ai/chat` and `POST /api/ai/ideas`.
5. Fallback assistant (`server/ai/fallback.ts`) mapping intents to the same tools; the client switches automatically and labels it **Built-in assistant (no AI)**.
6. UI: assistant panel (suggested prompts, messages, evidence chips, collapsible tool trace), ProposalCard with per-item approve/edit/reject -> commands -> Undo, AI consent screen, capability banners; Idea Studio (library offline + AI), pin to task or note.
7. Tests with the fake LLM: the golden prompts, a **malicious fake LLM** that follows injected instructions (must not delete, mark paid or invent figures), malformed output, timeout, missing key, number audit, allow-list and new-money rule.

**Do not.** Never call Gemini from the browser. Never let a tool write. No model id or key in code. Never present fallback output as Gemini output. Do not send guest names or contacts.

**Exit gate.** J4 passes using the fake LLM in tests and, **only if a key is available**, a recorded manual smoke with the real model (otherwise write "real Gemini smoke: not run"); boots and answers with no key via the fallback; bundle scan finds no key; `npm run check` green.

**Report format.**
```
PHASE 4 REPORT
Built: <what exists and works>
Evidence: <exact commands run -> results, with counts>
Journeys checked: <J ids and result>
Not run / gaps: <honest list>
Decisions logged: <ids or dates in STATUS.md>
Next: <first three tasks of the next phase>
```
