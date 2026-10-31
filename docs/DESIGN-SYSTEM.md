# GatherWise — Design System

> **Status:** v1.0, 24 Oct 2026. Every colour pair listed as passing was **computed** (WCAG 2.x relative-luminance contrast), not eyeballed. Font features and file sizes were checked on the actual font files.

## 1. Design intent

GatherWise is a data-dense planning tool used under stress (deadlines, money, families), so the interface is **calm, legible and fast**, and the celebration lives in a few deliberate moments rather than in chrome.

- **Feel:** a well-kept planner's notebook: quiet paper-like surfaces, deep indigo ink, and one warm accent (marigold, the flower of Indian celebrations) used sparingly for *today*, *next action* and *done*.
- **One memorable thing:** the **Readiness Bloom**, a five-petal radial score (Tasks, Essentials, Money, Guests, Safety net) with an Expected marker. It is both functional (five dimensions at a glance) and thematic (a flower), and appears on the dashboard, the print plan and the Day-of header. Everything else stays disciplined.
- **Not generic:** no gradients, glass or glow; no purple-to-pink hero; no cream-and-terracotta "editorial" default; no emoji decoration; no stock photography. Motifs are a thin marigold-bead divider and the garland timeline, both drawn in CSS/SVG.
- **Considered and rejected:** the data-driven style search suggested "soft UI" with romantic pink, gold and script fonts. Rejected: the product covers birthdays and community events as much as weddings, and script faces damage legibility of numbers and Indic text. Its accessibility advice (visible focus, contrast, reduced motion) is adopted.

## 2. Colour

Tokens are CSS variables in `src/styles/tokens.css`; Tailwind reads them (Tailwind v4: `@theme inline`; v3: `theme.extend.colors` pointing at the variables). Components use **semantic** tokens only, never raw hex.

### 2.1 Palette (light)

| Token | Hex | Role |
| --- | --- | --- |
| `--gw-paper` | `#F7F7FB` | Page background (cool off-white, not cream) |
| `--gw-surface` | `#FFFFFF` | Cards, inputs, popovers |
| `--gw-sunken` | `#EEEFF6` | Wells, table headers, disabled fills |
| `--gw-ink-900` / `-700` / `-600` | `#1C1B3A` / `#44456A` / `#555779` | Text: primary / secondary / helper |
| `--gw-line` / `--gw-line-strong` | `#DDDFEB` / `#767A9B` | Decorative dividers / input and control borders |
| `--gw-indigo-700` / `-600` / `-100` / `-50` | `#3730A3` / `#4338CA` / `#E4E5FB` / `#F0F0FD` | Primary action, focus ring, selection tint, hover tint |
| `--gw-marigold-400` / `-100` / `-800` | `#FFB938` / `#FFF0CC` / `#7A4A00` | Highlight fill (with ink text), warning tint, warning text |
| `--gw-peacock-700` / `-600` / `-50` | `#0B6B64` / `#0F766E` / `#E4F4F2` | Success / on-track (text, fill, tint) |
| `--gw-vermilion-700` / `-600` / `-50` | `#A82A14` / `#B8321B` / `#FDECE8` | Danger / overdue (text, fill, tint) |

### 2.2 Semantic mapping

| Semantic token | Light | Dark |
| --- | --- | --- |
| `--bg` / `--surface` / `--raised` | paper / surface / surface | `#12112A` / `#1B1A3D` / `#252352` |
| `--text` / `--text-muted` / `--text-subtle` | ink-900 / ink-700 / ink-600 | `#ECECF8` / `#B9BAD9` / `#A0A2C8` |
| `--primary` / `--on-primary` | indigo-700 / white | `#B3B0FF` / `#15123A` |
| `--link` | indigo-700 | `#C3C0FF` |
| `--focus` | indigo-600 | `#B3B0FF` |
| `--border` / `--border-input` | line / line-strong | `#3B3A73` / `#8A8DB8` |
| `--selected` | indigo-100 | `#2E2C6B` |
| `--success`, `--danger`, `--warning`, `--highlight` | peacock-700, vermilion-700, marigold-800, marigold-400 | `#5FD3C6`, `#FF9C8A`, `#FFC95C`, `#FFC95C` |

**Event accents** change only `--primary` (and the chart primary), never status colours: wedding `indigo-700` (`#3730A3`), birthday `peacock-600` (`#0F766E`), community `#9A3412`. Each has white-on-accent contrast ≥ 5.4:1.

### 2.3 Verified contrast (WCAG 2.x; text needs ≥ 4.5, UI/graphics ≥ 3)

| Pair | Ratio |
| --- | ---: |
| Body text `ink-900` on paper / on card | 15.51 / 16.57 |
| Secondary `ink-700` on card | 9.11 |
| Helper `ink-600` on card / on sunken | 6.94 / 6.05 |
| White on primary button `indigo-700` | 9.93 |
| Link `indigo-700` on card | 9.93 · on selected tint 7.99 |
| `ink-900` on marigold highlight | 9.67 |
| Warning text `marigold-800` on its tint | 6.62 |
| Success text `peacock-700` on card / tint | 6.36 / 5.61 |
| Danger text `vermilion-700` on card / tint | 6.99 / 6.10 |
| White on danger button `vermilion-600` | 5.98 |
| Input border `line-strong` on card / paper (≥ 3) | 4.18 / 3.91 |
| Focus ring `indigo-600` on card / paper (≥ 3) | 7.90 / 7.40 |
| **Dark:** body on bg / card; secondary; helper | 15.73 / 14.20; 8.79; 6.73 |
| **Dark:** button label on primary; link; input border; focus | 8.96; 9.75; 5.22; 8.38 |

**Marigold rule:** `marigold-400` is only 1.71:1 on white, so it is **never** used as text, a thin line or a lone icon. It is a fill that carries `ink-900` text (9.67:1) or sits against `indigo-700` (5.79:1), or it has an ink outline. Chart fills below 3:1 (`indigo-300`, `marigold-400`) must be outlined or patterned, and every segment is directly labelled.

## 3. Typography

| Role | Family | Why |
| --- | --- | --- |
| Display, headings, big numerals | **Bricolage Grotesque** (variable, `wght`) | A characterful grotesque with warmth; has tabular figures; contains ₹ |
| UI and body | **Figtree** (variable, `wght`) | Friendly, highly legible at small sizes; tabular figures; contains ₹ |
| Fallbacks | `ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif` | |
| Indic scripts | `"Noto Sans Devanagari"`, `"Noto Sans Bengali"`, `"Noto Sans Oriya"`, `"Noto Sans Tamil"`, `"Noto Sans Telugu"`, `"Noto Sans Gujarati"`, `"Noto Sans Kannada"`, `"Noto Sans Malayalam"`, `"Noto Sans Gurmukhi"` | Loaded on demand only when content with that `lang` appears; line-height 1.6 for Indic text |

**Verified on the font files:** both families contain the `tnum` (tabular figures) feature; the ₹ sign (U+20B9) is in each family's **Latin-Extended subset, not the Latin subset** — if you self-host with Fontsource you **must import both `latin` and `latin-ext`** (or the full CSS with `unicode-range`) or ₹ silently falls back to a system font. Measured `wght`-only woff2 sizes: Bricolage 40 KB + 18 KB, Figtree 19 KB + 10 KB = **87 KB** (inside the 90 KB budget). A rejected candidate: Instrument Sans has no ₹ glyph at all.

Use `font-variant-numeric: tabular-nums` on every money, count, date and table-number cell. Add a unit test or visual check that ₹ renders from the brand font.

| Style | Size / line | Weight | Use |
| --- | --- | --- | --- |
| Display | 40 / 44 | Bricolage 700 | Landing hero, Readiness numeral at 56 / 56 |
| H1 / H2 / H3 | 28 / 34 · 22 / 28 · 18 / 24 | Bricolage 600 | Page, section, card titles |
| Body | 16 / 24 | Figtree 400 | Default |
| Body small | 14 / 20 | Figtree 400–500 | Tables, helper text |
| Label / Caption | 14 / 20 · 12 / 16 (min) | Figtree 600 / 500 | Form labels / chart annotations |

Measure ≤ 72 ch for prose. Sentence case everywhere; no all-caps eyebrows.

## 4. Spacing, shape, elevation, motion

- **Spacing:** 4-pt scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64). Cards pad 16 (mobile) / 24 (desktop). Page gutters 16 / 24 / 32.
- **Radius:** 6 (inputs, chips) · 10 (cards) · 16 (dialogs, sheets) · 999 (pills).
- **Elevation:** `e0` border only (default); `e1` `0 1px 2px rgb(28 27 58 / .06)` for raised cards; `e2` `0 8px 24px rgb(28 27 58 / .12)` for popovers and dialogs. Borders do most of the work.
- **Motion:** 120 ms (micro), 200 ms (UI), 320 ms (sheets), easing `cubic-bezier(.2, .8, .2, 1)`. Meaningful motion only (a bead fills, a petal grows, a card slides in). `prefers-reduced-motion: reduce` → no transforms, opacity cross-fade ≤ 100 ms.
- **Iconography:** `lucide-react`, 1.75 stroke, 20 px default, always paired with text for status.

## 5. Layout and shell

Breakpoints 360 (minimum), 640, 768, 1024, 1280. Container 1200 px; two-column dashboard grid ≥ 1024.

**Information architecture** (five destinations, same on every screen size): **Overview** (dashboard, readiness, risks) · **Plan** (tasks, timeline, run-of-show, ideas) · **Money** (budget, payments, what-if, funding) · **People** (guests, RSVP, catering brief, vendors and quotes) · **Assistant** (copilot, idea and invite studios). Settings, export and privacy live in the account menu. A **Day-of** button appears in the top bar and becomes the default landing view within 48 hours of the event.

- **≥ 1024:** left rail (232 px, collapsible to 72 px icons) + top bar.
- **< 1024:** top bar + bottom tab bar (five items, 56 px + safe area). No hamburger for primary destinations.
- **Top bar:** event switcher, demo/Time Travel control (demo only), AI status chip (*Gemini* or *Built-in assistant*), account menu.
- **Templates:** dashboard grid; list-detail; wizard (single column, ≤ 640 px, "Step X of N"); document/print.

```text
Desktop dashboard (≥ 1024)
┌────────┬──────────────────────────────────────────────────────────────┐
│ Rail   │ Aarohi & Kabir's wedding · 100 days · Pune     [AI: Gemini] ⚙ │
│ ▸ Over │──────────────────────────────────────────────────────────────│
│   Plan │ ┌ Readiness ─────────┐ ┌ Next best actions ────────────────┐ │
│   Money│ │   (bloom) 62       │ │ 1 Book photographer      +4 pts   │ │
│   Peop │ │ Expected 58        │ │ 2 Add a rain plan        +3 pts   │ │
│   Asst │ │ ● On track         │ │ 3 Confirm caterer count  +3 pts   │ │
│        │ └────────────────────┘ └───────────────────────────────────┘ │
│        │ ┌ Money ───────────────────────────────────────────────────┐ │
│        │ │ Paid ██████│Agreed ▓▓▓▓▓│Estimated ░░░░│Left ·····       │ │
│        │ │ ₹3.2 L paid · ₹5.1 L still to pay · ₹18 L budget   [Table]│ │
│        │ └──────────────────────────────────────────────────────────┘ │
│        │ ┌ Next 7 days ────────────┐ ┌ Risks (3 open) ──────────────┐ │
│        │ │ ◉ 24 Oct Pay decorator  │ │ ▲ No rain plan (outdoor)     │ │
│        │ │ ○ 27 Oct Menu tasting   │ │ ▲ Quote expires in 5 days    │ │
│        │ └─────────────────────────┘ └──────────────────────────────┘ │
└────────┴──────────────────────────────────────────────────────────────┘
```

## 6. Components

Built on Radix primitives (Dialog, Popover, Tabs, Tooltip, Toast, Select, Checkbox, Switch, RadioGroup, DropdownMenu, Collapsible) styled with Tailwind. Each component ships with its states and an axe-clean example in tests.

| Component | Notes |
| --- | --- |
| Button / IconButton | Variants primary, secondary, quiet, danger. Min 40 px height (44 px on touch); icon-only needs `aria-label` + tooltip; loading keeps width and announces |
| Input, Textarea, Select, Combobox, DateInput | Visible label above; helper and error text linked with `aria-describedby`; native `type="date"` for reliability |
| **MoneyInput** | Accepts "5 lakh", "₹5,00,000", "2.5cr"; shows the parsed value beneath ("= ₹5,00,000"); `inputmode="decimal"`; announces parse result politely |
| Stepper (wizard) | "Step 3 of 8", names of steps, `aria-current="step"`, back/next, summary step |
| Card, Stat, KeyValue | Stat = label + tabular figure + delta with text |
| Badge / StatusPill | **Icon + text + colour** (e.g. ▲ Overdue, ✓ Done, ◔ Due soon, ● Upcoming); never colour alone |
| DataTable | Sticky header, sortable with `aria-sort`, collapses to cards < 640 px, row actions in a menu |
| EmptyState | What this is · why it is empty · the one action to start |
| Banner | Variants info/warn/demo/offline; dismissible only when safe; `role="status"` |
| Toast | `role="status"`, 6 s, never the only confirmation of a destructive action; includes **Undo** where reversible |
| ConfirmDialog | Specific title and verbs ("Delete 12 guests?" → *Delete 12 guests* / *Keep guests*); focus trap; Escape closes |
| **ProposalCard** | Title, rationale, evidence chips, per-item checkboxes, diff table (old → new), **Impact** strip (budget, readiness, dates), *Approve selected* / *Reject* |
| ChatMessage, EvidenceChip, ToolTrace | Chips read "Grounded on: Budget summary"; trace is a collapsible list |
| **BudgetBar** | See §7 |
| **ReadinessBloom** | See §7 |
| **GarlandTimeline** | Horizontal on desktop, vertical on mobile; beads are milestones (task, payment, function); filled marigold = done, ring = upcoming, vermilion diamond = overdue, each with an icon and a label |
| Calendar (month) | Roving tabindex, arrow keys, `aria-label` per day with counts |
| RunOfShowRow, DayOfCard | Large tap targets (≥ 48 px), current item highlighted with border + label "Now" |

## 7. Data visualisation rules

- **BudgetBar** (stacked, horizontal): *Paid* solid `indigo-700`; *Agreed, not yet paid* `indigo-500` with diagonal hatch; *Estimated* `indigo-100` with dashed `indigo-700` outline; *Left to budget* paper with a 1 px border; *Over* `vermilion-600` with a ▲ icon. Direct labels with amounts; legend swatches use the same patterns. A **View as table** toggle shows the same data as an accessible table; the chart has `role="img"` and an `aria-label` that states the totals.
- **ReadinessBloom:** 160 px SVG; five petals (Tasks, Essentials, Money, Guests, Safety net), each filled in proportion to its score; the centre shows the score (Bricolage 56) and the word "Readiness"; a small notch on each petal marks Expected; below: Pace pill (*On track / Slightly behind / Behind*, icon + text). Next to it, a visible list of the five dimensions with numbers. `aria-label` reads the whole story.
- **General:** ≤ 8 categories before grouping into "Other"; never encode a category by colour alone; label values directly; include a table alternative for every chart; start bars at zero; format money with the Indian grouping or compact lakh/crore; Recharts is loaded lazily and only where it adds value (simple bars can be plain SVG/CSS).

## 8. States and patterns

- **Loading:** skeletons with fixed dimensions (no layout shift); anything slower than ~400 ms gets a skeleton, slower than ~3 s a message.
- **Empty:** *"No quotes yet. Quotes you receive from vendors appear here so you can compare them fairly. Add your first quote."*
- **Errors:** what happened · why · how to fix, no blame, no "oops". *"Couldn't save the guest list. Your browser is out of storage. Free some space or export your data, then try again."*
- **Forms:** validate on blur and on submit; an error summary at the top (focus moves to it) links to each field; never clear a field on error.
- **Wizard:** draft autosaved; Back never loses data; final step is a review with assumptions; closing asks to keep or discard the draft.
- **Banners:** *Demo — stored only in this browser* (persistent); *AI offline — using the built-in assistant* (when capabilities say so); *Offline* (when the network is gone).
- **Destructive actions:** confirm with specific verbs, then offer Undo; bulk deletes show counts.

```text
Assistant with a proposal (mobile, 360 px)
┌──────────────────────────────────┐
│ Assistant     [AI: Gemini]       │
├──────────────────────────────────┤
│ You: Guests are now 340, not 300 │
│                                  │
│ Copilot                          │
│ KNOWN                            │
│ • Caterer A is quoted per plate: │
│   ₹4,95,600 at 300 guests.       │
│ • At 340 guests that becomes     │
│   ₹5,61,680.                     │
│ OPEN QUESTIONS                   │
│ • Does the venue allow 340?      │
│ Grounded on: Quote comparison ·  │
│ Headcount plan                   │
│ ┌ Proposal: update plan ───────┐ │
│ │ ☑ Reschedule final headcount │ │
│ │ ☑ Add task: ask venue cap.   │ │
│ │ Impact: +₹66,080 expected;   │ │
│ │ status Tight → Over.         │ │
│ │ [Approve selected] [Reject]  │ │
│ └──────────────────────────────┘ │
├──────────────────────────────────┤
│ Overview Plan Money People Asst  │
└──────────────────────────────────┘
```

```text
Day-of Mode (mobile)
┌──────────────────────────────────┐
│ Reception · Sat 20 Mar  18:42    │
│ NOW   Guests arrive     18:30 ✓  │
│ NEXT  Cake cutting      19:30    │
│       owner: Neha  📞  💬        │
│ ──────────────────────────────── │
│ ⚠ Pheras fixed 20:10 · 12 min late│
│ [ Running late +10 min ]         │
│ 19:30 Cake cutting               │
│ 20:00 Dinner opens   (buffer 15) │
│ 20:10 Pheras 🔒 fixed            │
└──────────────────────────────────┘
```

## 9. Print and export styles

`src/styles/print.css`: A4, 14 mm margins, black on white, navigation and buttons hidden, tables never split a row, headings keep with next, links show as underlined text, the page header prints event name and date, the footer prints "Generated by GatherWise on {date}". Catering Brief, Vendor Brief and Event Plan each have a print layout; test by saving to PDF.

## 10. Accessibility specification (WCAG 2.2 AA)

- **Keyboard:** everything operable by keyboard; logical order; skip-to-content link; roving tabindex in menus, calendars and tab lists; Escape closes overlays and returns focus to the trigger.
- **Focus:** 2 px `--focus` ring with 2 px offset on all interactive elements (≥ 3:1), never removed; focus is not hidden by sticky headers or the bottom bar (`scroll-padding`).
- **Targets:** ≥ 24 × 24 CSS px everywhere (WCAG 2.2), 44 px for primary touch controls.
- **Structure:** one `h1` per screen, ordered headings, landmarks (`header`, `nav`, `main`, `aside`), `aria-current` on navigation, lists for lists, tables for tabular data.
- **Names and states:** every control has an accessible name; toggles expose `aria-pressed` or `aria-checked`; async results announced through `role="status"` or `aria-live="polite"`; errors through `role="alert"` only for blocking failures.
- **Colour and contrast:** §2.3; status never colour-only; works in forced-colours mode (use borders and system colours for focus and selection).
- **Reflow and zoom:** no horizontal scroll at 320 px; supports 200 % zoom and user text spacing; no fixed heights on text containers.
- **Motion:** respects reduced motion; no autoplay; no flashing.
- **Language:** `<html lang>` is set; Hindi or other Indic text carries its own `lang`; AI output in another language is wrapped with the right `lang`.
- **Forms:** labels, instructions and errors programmatically associated; no re-entry of data already given (draft recovery); no cognitive-test authentication.
- **Charts:** text and table alternatives (§7).
- **Testing:** `eslint-plugin-jsx-a11y`, `vitest-axe` on key screens, and the manual keyboard / 320 px / dark mode / screen-reader spot check in `TEST-STRATEGY.md`. Report what was *not* verified (e.g. no real screen reader run).

## 11. Content design

- **Voice:** warm, plain, specific, respectful of every tradition and budget. Short sentences. No jargon, no hype, no "magic" or "ninja".
- **Indian English conventions:** ₹ with lakh/crore grouping; dates "24 Oct 2026"; 12-hour times "6:30 pm"; "RSVP", "function", "venue"; avoid assuming religion, gender or who pays; neutral "Side A / Side B" labels renameable by the user.
- **Money words (domain → UI):** *commitment* → **Agreed**; *paid* → **Paid**; *outstanding* → **Still to pay**; *projected* → **Expected total**; *estimate* → **Estimate** (with the basis badge); *contingency* → **Safety reserve**; *quote true cost* → **Total with tax**.
- **Honesty copy:** "Estimate", "Indicative — from published guides, not verified", "AI-generated. Please check before using." Never "verified vendor", "recommended supplier" or "guaranteed ready".
- **Buttons:** verb + object ("Save changes", "Add quote", "Approve selected"); same verb for the same action across the product; destructive buttons name the loss.
- **Microcopy checklist:** one idea per message; say what the user can do next; do not blame; numbers formatted by the app, not hand-typed.

## 12. Implementation notes

`src/styles/tokens.css` (light + dark + accents + type/spacing/motion variables), `src/styles/base.css` (reset, focus, reduced motion, tabular numerals), `src/styles/print.css`. Theme: follow `prefers-color-scheme`, with a manual toggle stored in the UI store. Fonts: `@fontsource-variable/bricolage-grotesque` and `@fontsource-variable/figtree` (wght-only CSS, import `latin` and `latin-ext`), preloaded for the Latin subset, `font-display: swap`. Inline SVG illustrations ≤ 3 KB; no raster assets above 100 KB; no external CDNs.
