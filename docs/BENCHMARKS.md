# GatherWise — Benchmarks & Data Grounding

> **Rule:** every number the app uses to *suggest* something (budget bands, attendance rates, category weights) is an **editable planning heuristic with provenance**, not a fact. This file lists each one, where it came from, how much to trust it, and exactly how the app may use it.
> **Provenance:** all figures below are taken from the research brief supplied with the challenge (`GatherWise: Data-Grounded Design…`, 8 pp.), which cites commercial guides, calculators and press reports. They have **not** been independently verified. Do not add new "facts" to this file without a source and a reliability grade.

## 1. Reading the research safely

1. **Averages mislead.** Reported averages (₹39.5 L, ₹29.6 L, ₹58 L destination) mix modest and luxury weddings and come from vendor-driven samples. Prefer *per-guest bands and category shares* over national averages.
2. **Sources disagree.** The brief reports ₹39.5 L (organised, vendor-driven weddings, 2025–26), ₹29.6 L (a 2024 India survey), and a ₹20–30 L "middle-class" band (2023). That spread is the finding: do not present a single "average Indian wedding cost".
3. **Source quality varies.** Most sources are calculators, directories and blog guides with commercial interests. One aggregator quotes 1,000-guest South Indian weddings, which conflicts with every survey in the brief; **do not use it**.
4. **Western RSVP data.** The attendance figures come largely from US datasets (e.g. a 20,000-wedding analysis, national wedding surveys). Indian weddings often have loose RSVP habits and last-minute additions, so these rates may not transfer. Defaults are therefore starting points that the **calibration loop** (`DOMAIN-MODEL.md` §5.6) corrects with the organiser's own actuals.
5. **Out-of-scope cities.** The brief has no benchmarks for tier-2/3 cities, birthdays per guest, or fests per head. For those the app shows *the organiser's own figure only* and says no benchmark is available. It never extrapolates.

## 2. Heuristics table

Reliability: **M** = several sources agree · **L** = single source, calculator, press quote, or non-Indian data.

| ID | Heuristic | Value (as reported) | Source type | Rel. | How the app may use it |
| --- | --- | --- | --- | :-: | --- |
| `wed.perGuest.tier1.mid` | All-in cost per guest, mid-range metro wedding | ₹10,000–₹18,000 | Planning guide (100-guest example) | L | Informational band in the budget view when `type=wedding`, `cityTier=tier1` |
| `wed.perGuest.tier1.wide` | Wider band across formats | ₹8,000–₹25,000 (₹8–25 L for 100 guests; ₹15–50 L for 200; ₹25–80 L for 300; ₹50 L–₹2 Cr+ for 500) | Guest-count cost guide | L | Outer band; "unusually low/high" nudge only |
| `wed.metro300` | 300-guest metro wedding, typical total | ₹20–40 L | Calculator + guide | L | Sanity message in wizard when guests ≈ 250–350 |
| `wed.platePrice.metro` | Catering plate rate, 300-guest metro wedding | ₹1,200–₹1,800 | Calculator | L | Placeholder hint in a *per-plate* field; never auto-filled as a price |
| `wed.share.venueCatering` | Venue + catering share of total | 55–65 % | Several industry overviews | M | Default weights (venue 22 + catering 35 = 57 %) |
| `wed.share.decor` | Décor share | 10–15 % | Industry overview | M | Default 11 % |
| `wed.share.photo` | Photography/videography share | 8–12 % | Derived in brief | L | Default 8 % |
| `wed.share.entertainment` | Entertainment share | 5–10 % | Derived in brief | L | Default 6 % |
| `wed.guests.avg` | Average guests (India, 2024 survey) | ≈ 330 (local weddings ≈ 420 and destination ≈ 280 in another report) | Surveys | L | Never used for planning; context only |
| `wed.destination.premium` | Destination vs all weddings | ₹58 L vs ₹39.5 L average | Press guide | L | Not used in calculations |
| `att.local.pending` | Share of invited guests who attend, local wedding | 70–85 % (often "use 85 %") | Planning guides (mostly US) | L | `pPending` default 0.8 for `audience=local` |
| `att.destination` | Attendance, destination wedding | 50–65 % | RSVP guide | L | `pPending` default 0.55 for `audience=destination` |
| `att.houseParty` | Attendance, adult house party | 60–80 % | RSVP guide | L | `pPending` default 0.7 for `audience=house_party` |
| `att.conversion` | RSVP-yes → actually attends | ≈ 76 % median (US, 20k+ weddings) | Dataset analysis | L | Reason to keep a catering buffer; not a default multiplier |
| `att.buffer` | Catering buffer over expected headcount | 5 % (typical caterer practice; confirm with caterer) | Practice, not in brief | L | `bufferPct` default 0.05 |
| `bday.size` | Children's birthday size | 20–30 kids, often with parents | Press interview | L | Wizard hint for `type=birthday` |
| `bday.cost` | Typical birthday cost | "under ₹1 lakh" typical; some families spend several lakh | Press report | L | Wizard hint only; no per-guest band |
| `fest.tiers` | College fest budget tiers | Dept ₹50 k–₹2 L; mid-size ₹3–15 L; flagship ₹1 Cr+ | Fest guide | L | Wizard hint for `subtype=college_fest` (labels *Department / College-wide / Flagship*) |
| `fest.du2024` | Delhi University fests, 2024 | ₹75 L (₹50 L cash + ₹25 L in kind), ₹35 L, ₹30 L, ₹24 L, ₹13 L | Press report | L | Context in docs only |
| `fest.sponsorShare` | Share of fest budgets from sponsorship | ≈ 70 % at several DU fests | Press report | L | Why sponsored events get the Funding tracker; default stage weights are separate heuristics |
| `ctg.reserve` | Contingency reserve | 5–10 % rule of thumb | Practice, not in brief | L | `contingencyPct` default 7 (editable) |

## 3. Data shape

```ts
interface Benchmark {
  id: string;                                   // e.g. 'wed.perGuest.tier1.mid'
  label: string;
  appliesTo: { type?: EventType; cityTier?: CityTier; subtype?: string };
  value: { low?: number; high?: number; point?: number; unit: 'INR_per_guest' | 'percent' | 'INR_total' | 'ratio' };
  sourceNote: string;                           // human-readable provenance, as in §2
  reliability: 'M' | 'L';
  asOf: string;                                 // '2026'
  verified: false;                              // always false until someone checks it
}
```

Stored in `shared/planning/benchmarks.ts`. A test asserts that every benchmark has a `sourceNote`, a reliability grade, and `verified: false`.

## 4. Display rules

- Always label as **"Indicative — from published guides, not verified"**, with an info popover showing `sourceNote`. Never write "average Indian wedding costs ₹X" in the UI, README or AI output.
- Show bands as ranges with the organiser's own figure marked on the same scale; use words, not alarm colours ("below / within / above the range reported in published guides").
- If `cityTier` is `unspecified`, `other`, `tier2` or `tier3`, or the type has no band, show: *"We don't have a reliable benchmark for this. Your figure: ₹X per guest."*
- The AI may *quote* a benchmark only via the `get_benchmarks` tool and must repeat its label and reliability.
- When the organiser overrides a heuristic, the override wins everywhere and is shown as theirs.

## 5. Keeping it honest

- Adding or changing a heuristic requires: source note, reliability grade, a test update, and a line in `docs/STATUS.md` (decisions log).
- The README must describe these as heuristics and link here.
- Do not scrape or embed live vendor prices, ratings or market statistics. If a future version integrates a data provider, it must be a separate, clearly attributed feature.
