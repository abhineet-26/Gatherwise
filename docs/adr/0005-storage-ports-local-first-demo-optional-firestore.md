# ADR-0005: Storage ports: local-first demo, optional Firestore

**Status:** Accepted · **Date:** 2026-10-24

## Context
Reviewers must be able to run the app with no accounts or keys, while a real product needs sync and sign-in. Platforms differ in how much Firebase they auto-provision.

## Decision
Define a `WorkspaceRepository` port. The default adapter stores data in IndexedDB (clearly labelled demo storage). A Firestore adapter plus rules enables cloud mode behind `VITE_STORAGE_MODE`. Capability flags come from `/api/health` and the build config.

## Consequences
Zero-config boot; cloud is additive and never claimed unless exercised. Cost: two adapters to keep behaviourally equal (shared contract tests).

## Alternatives considered
Firebase-only (blocks anyone without a project); server database (no offline, more infrastructure); localStorage (small, synchronous, poor for guest lists).
