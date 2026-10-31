# ADR-0006: Planning content as data (template packs)

**Status:** Accepted · **Date:** 2026-10-24

## Context
Weddings, birthdays and community events need different tasks, budgets, risks and checklists, and new event types must be cheap to add.

## Decision
The planning engine is generic; content lives in typed packs (`shared/planning/packs/*`) with lead times, dependencies, budget profiles, vendor checklists, risk rules and idea seeds. Rules are objects with `evaluate()` and an explanation template.

## Consequences
Deterministic, reviewable, testable plans; contributors edit data, not control flow. Cost: packs need curation and honest labelling as heuristics.

## Alternatives considered
Hard-coded planners per event type (duplication); AI-generated plans only (non-deterministic and unexplainable).
