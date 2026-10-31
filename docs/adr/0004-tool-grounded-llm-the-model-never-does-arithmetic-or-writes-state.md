# ADR-0004: Tool-grounded LLM: the model never does arithmetic or writes state

**Status:** Accepted · **Date:** 2026-10-24

## Context
LLMs mis-add, invent figures and can be steered by injected text. The product's promise is numbers you can trust and zero silent changes.

## Decision
The model reads through read-only tools backed by the shared domain functions, copies numbers from tool results, and returns *proposals*. The server validates schemas and the command allow-list, enforces a new-money rule, audits numbers in the final text, dry-runs proposals, and a human approves.

## Consequences
Answers are traceable (evidence chips) and the blast radius of a bad or hijacked model is zero. Cost: more server code and a fake LLM for tests.

## Alternatives considered
Put the whole workspace in the prompt and let the model compute (unreliable, leaks data); let the model write directly (unsafe); retrieval over documents (unnecessary, data is structured).
