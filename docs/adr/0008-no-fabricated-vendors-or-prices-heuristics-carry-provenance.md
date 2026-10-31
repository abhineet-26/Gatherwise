# ADR-0008: No fabricated vendors or prices; heuristics carry provenance

**Status:** Accepted · **Date:** 2026-10-24

## Context
Invented vendor listings, ratings or prices would mislead users and undermine trust; published statistics are uneven in quality.

## Decision
Vendors are entered by the user; there are no verified or recommended labels; benchmarks live in `benchmarks.ts` with source note, reliability grade and `verified: false`, are shown as indicative, and are never used as prices. The AI may not introduce new rupee amounts.

## Consequences
Honest by construction and easy to defend. Cost: no discovery feature in v1; the roadmap lists a possible partner-data integration with explicit attribution.

## Alternatives considered
Scrape or generate vendor directories (accuracy, legal and trust risks); AI-estimated prices (unverifiable).
