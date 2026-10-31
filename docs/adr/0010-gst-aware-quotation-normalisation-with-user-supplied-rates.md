# ADR-0010: GST-aware quotation normalisation with user-supplied rates

**Status:** Accepted · **Date:** 2026-10-24

## Context
Vendor quotes arrive as "+GST", "all-inclusive" or silent on tax, so headline prices mislead. Tax rules and rates change and must not be asserted by the app.

## Decision
Normalise every quote to a tax-inclusive payable at the planned headcount using the tax mode and rates the user enters; unknown treatment is budgeted cautiously and flagged; missing rates fall back to an editable planning default. Comparison scoring is transparent and weights are editable.

## Consequences
Fair comparisons and fewer surprises without making legal claims. Cost: users must enter or confirm tax terms, which the UI prompts for.

## Alternatives considered
Hard-code GST slabs (can be wrong or stale); ignore tax (misleading); trust the model to read tax from images without verification (see Quote Scanner checks).
