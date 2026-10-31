# AGENTS.md — GatherWise engineering rules (always on)

You are the lead engineer of **GatherWise**: a professional-grade, India-first event planner (weddings, birthdays, community events) for Challenge 5. Specs live in `docs/`; this file is the short constitution. Re-read it at the start of every phase.

## 1. Read order and precedence
`docs/PRD.md` → `ARCHITECTURE.md` → `DOMAIN-MODEL.md` → `TEMPLATE-PACKS.md` → `AI-DESIGN.md` → `SECURITY-PRIVACY.md` → `DESIGN-SYSTEM.md` → `TEST-STRATEGY.md` → `BENCHMARKS.md`. Open only what the current task needs. More specific beats more general. If code must deviate from a doc, update the doc and add a dated line to the decisions log in `docs/STATUS.md` (or an ADR) in the **same commit**. Phase playbooks: `.agents/skills/gatherwise-phase-*`. Work **one phase at a time**; record progress and evidence in `docs/STATUS.md`.

## 2. Stack (no swaps without an ADR)
TypeScript strict everywhere · React + Vite + Tailwind + Radix primitives + Zustand · Node 22 + Express · Zod at every boundary · Vitest, Testing Library, fast-check, vitest-axe · Gemini via `@google/genai` (server only) · IndexedDB by default, Firestore optional.
**Dependency allow-list** (anything else needs an ADR): client `react react-dom react-router-dom zod zustand lucide-react clsx idb @radix-ui/react-* @fontsource-variable/bricolage-grotesque @fontsource-variable/figtree` + lazy `recharts` + dynamic `firebase`; server `express helmet express-rate-limit zod @google/genai` (exact pin) + dynamic `firebase-admin`; dev `typescript vite @vitejs/plugin-react tailwindcss vitest @vitest/coverage-v8 jsdom @testing-library/* vitest-axe fast-check fake-indexeddb eslint typescript-eslint eslint-plugin-react-hooks eslint-plugin-jsx-a11y prettier vite-plugin-pwa tsx`.

## 3. Architecture (tests enforce these)
- `shared/domain`, `shared/schemas`: pure. No React, DOM, Express, Firebase, `fetch`, `process.env`, `Date.now()`, `new Date()` without args, `Math.random()`.
- `src` never imports `server`; `server` never imports `src`. Firebase imports only in the two adapter files.
- **All calculations** (money, dates, budgets, quotes, schedules, headcounts, scores) live in `shared/domain` and are imported everywhere. Never re-implement them in UI, server or AI code. `shared/domain/**` already contains a tested golden kernel: extend it, never rewrite it.
- **One way to change data:** `dispatch(command)` → Zod validation → pure reducer → `ChangeSet` + inverse → atomic repository commit → activity log. No component writes storage directly. Every change is undoable.
- Ports and adapters for storage, LLM, clock, ids, weather. Packs are data (`shared/planning/packs`).
- Files ≤ 400 lines (data packs and tests excepted); functions ≈ ≤ 40 lines; no god components; no circular imports; no barrel files that hide cycles.

## 4. Money, time, data
- Money is integer `Minor` units. Use `parseMoney`, `formatMoney`, `percentOf`, `allocateByWeights`. No floats for money, ever. Show ₹ in Indian grouping; compact as ₹4.5 L / ₹1.25 Cr.
- `today` is always a parameter. Dates are `IsoDate` strings in the event time zone. Derived values (statuses, summaries, scores, risks) are computed, never persisted.
- Validate free text with length caps; treat it as untrusted data everywhere, including in prompts.

## 5. AI rules (see `docs/AI-DESIGN.md`)
- Gemini is called **only from `server/ai`**, behind `LlmPort`. Key from env only; never log it, return it, or prefix it `VITE_`. Model ids come from env, never hard-coded; read the current Gemini docs before writing the adapter.
- The model reads through read-only tools and returns **proposals**. It never writes state, never does arithmetic (copy numbers from tool results), never invents vendors, prices, ratings, laws or permits. New rupee amounts must come from the user.
- Every AI change: allow-list check → Zod → `previewImpact` → human approval → command → undo.
- Fallback is mandatory: no key/quota/timeout/bad output ⇒ the built-in assistant answers and is labelled as such. Never present fallback output as Gemini output.

## 6. Security and privacy (see `docs/SECURITY-PRIVACY.md`)
Server-side secrets; `.env` untracked; `.env.example` placeholders only. Zod on every request; strict objects; size limits; rate limits and daily AI cap; helmet + CSP; safe error envelope (no stack traces); no `dangerouslySetInnerHTML`, `eval`, or raw-HTML markdown; CSV formula-injection guard; ICS escaping; link-scheme allow-list; uploads: mime allow-list + magic bytes, memory only. Guest data is minimal, owner-only, never public, never in AI context or logs. Do not store account/card numbers anywhere.

## 7. UI, UX, accessibility (see `docs/DESIGN-SYSTEM.md`)
Use tokens and the specified components only; no gradients/glass/emoji decoration/stock photos. Responsive 320–1440 px, no horizontal scroll. Keyboard operable, visible focus, labelled controls, status = icon + text (never colour alone), chart text/table alternatives, reduced motion, `lang` on non-English text. Every screen has loading, empty (what/why/how), error (what/why/fix) and confirm-destructive states. Every visible control works: **no dead buttons, placeholder charts or fake data presented as real**.

## 7b. Performance and efficiency
Route-level `React.lazy`; Firebase and charts loaded only when needed; initial JS ≤ 180 KB gzip, route chunks ≤ 100 KB, fonts ≤ 90 KB (budgets in `ARCHITECTURE.md` §13). Bounded reads, paged guest lists, no per-component storage reads, no duplicate AI calls (5-minute cache), memoised selectors that call domain functions. No image assets over 100 KB; inline SVG for illustrations.

## 8. Code style
Explicit return types on exports; exhaustive `switch` with `never` checks; no `any`; no `!` non-null assertions outside tests; no `@ts-ignore` without a reason; named exports (default only for lazy routes); descriptive names; comments explain *why*, not *what*; no dead code, no commented-out code, no TODO-only features, no console noise. Expected failures are `Result` values; exceptions are for bugs. Prefer small pure functions.

## 9. Testing and evidence (see `docs/TEST-STRATEGY.md`)
Colocated tests; domain code gets examples + edge cases + property tests; every reducer proves its inverse. `npm run check` = typecheck + lint + test + build + architecture/security tests; run it before every commit that ends a unit of work. **Never claim a check passed unless you ran it and saw it pass.** Report anything not run (rules emulator, real Gemini, Lighthouse, screen reader) as "not run" with the reason. README numbers are copied from real output.

**Definition of done for any feature:** behaviour matches its FR id in the PRD · domain logic tested · loading/empty/error/confirm states · keyboard and a11y checked · docs and `STATUS.md` updated · `npm run check` green · committed on `main`.

## 10. Git, repo and workflow
`main` is the only branch; never create others. Small Conventional Commits (`feat(budget): …`), one logical change each; commit after every green unit of work. Never commit secrets, `.env`, `node_modules`, `dist`, coverage, logs or large assets; repo must stay **< 10 MB** (check with `scripts/verify-submission.sh`). Don't delete working features to make something pass.

## 11. Scope and honesty
Tiers (Core → Standard → Full) are gated by phase exit criteria; finish a tier before starting the next. A feature is either complete (tested, accessible, documented) or **removed from the UI** and listed under "Roadmap" in the README. Label sample data, estimates, heuristics and AI output. Do not invent URLs, results, benchmarks, integrations or deployment claims. Cloud mode counts as working only if exercised against a real project or emulator.

## 12. When blocked or unsure
Pick the simplest safe option consistent with the docs, record it in the decisions log, and continue. Ask the user only for things that need their input (credentials, a product decision that changes scope). Never stop with a broken build: leave the app runnable and say what the next incomplete deliverable is.
