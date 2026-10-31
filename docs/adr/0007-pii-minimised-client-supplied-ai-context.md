# ADR-0007: PII-minimised, client-supplied AI context

**Status:** Accepted · **Date:** 2026-10-24

## Context
The assistant needs event facts but not guests' names, contacts or access needs, and the app must work in demo mode where the server has no database.

## Decision
The browser builds an `AiContext` (aggregates only, vendor names/statuses, no contacts or free-text notes) and the server re-validates it strictly. Tools run on that snapshot. Sensitive tags are excluded.

## Consequences
Smaller privacy surface, works in both storage modes, no server-side data store for AI. Cost: the client is the source of context, so the server treats it as untrusted data (it cannot grant any privilege).

## Alternatives considered
Server loads full data from Firestore (couples AI to cloud mode and widens exposure); send the whole workspace (privacy and token cost).
