# ADR-0001: TypeScript end-to-end with a shared pure core

**Status:** Accepted · **Date:** 2026-10-24

## Context
The client needs deterministic logic (budgets, schedules, scores) and so does the server: the AI tools must run exactly the calculations the UI shows. A Node server is required anyway to keep the Gemini key off the browser.

## Decision
Use TypeScript for client, server and domain. Put pure logic, schemas, commands and planning content in `shared/`, imported by both sides; forbid I/O and framework imports there (enforced by lint and an architecture test).

## Consequences
One language and one source of truth for rules; the assistant's numbers always match the UI; easy to unit test. Cost: a dual build (Vite for the client, `tsc` for the server) and discipline about boundaries.

## Alternatives considered
A Python/FastAPI backend (would duplicate rules or push every calculation through the network, hurting offline use); Next.js (SSR is unnecessary and heavier); Firebase Functions only (harder local development, cold starts).
