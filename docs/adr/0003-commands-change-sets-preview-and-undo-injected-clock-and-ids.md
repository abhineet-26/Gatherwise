# ADR-0003: Commands, change sets, preview and undo; injected clock and ids

**Status:** Accepted · **Date:** 2026-10-24

## Context
AI proposals must be previewable and reversible, the UI needs undo, and statuses depend on "today", which must be testable and demonstrable (Time Travel).

## Decision
All mutations are Zod-validated commands applied by pure reducers returning `{state, changeSet, inverse, summary}`. `previewImpact` dry-runs commands. Repositories persist change sets atomically and the activity log stores inverses. `today` and ids are injected.

## Consequences
One path for data changes, trivial undo, safe AI proposals, deterministic tests. Cost: boilerplate per command, which is why commands are catalogued in `DOMAIN-MODEL.md` §6.

## Alternatives considered
Direct store mutation (no audit, no undo); Redux Toolkit (similar ideas, heavier); full event sourcing (overkill for this scale).
