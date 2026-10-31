# ADR-0009: Multi-function events via SubEvent

**Status:** Accepted · **Date:** 2026-10-24

## Context
A wedding is several functions with different dates, venues, guest subsets and per-plate catering. Treating them as one event breaks headcounts and schedules; treating them as separate events splits the budget and guest list.

## Decision
One Event owns many SubEvents (function, day or session). Guests carry per-SubEvent invitations and RSVPs; tasks and run-of-show items can attach to a SubEvent; headcounts and catering briefs are computed per SubEvent.

## Consequences
Matches how Indian weddings and multi-day fests are actually planned; one shared budget and guest list. Cost: slightly richer guest and task models.

## Alternatives considered
Separate events per function (duplicates guests and budget); tags only (cannot compute per-function headcounts).
