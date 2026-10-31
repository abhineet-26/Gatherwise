# GatherWise — Template Packs (planning content as data)

> **Purpose:** the *content* the planning engine runs on. Packs are data in `shared/planning/packs/{wedding,birthday,community}.ts`, not `if` statements. Adding an event type means adding a pack, not editing the engine.
> **Honesty rule:** lead times, weights and thresholds below are **planning heuristics** drawn from typical practice and the research brief (`BENCHMARKS.md`). They are editable, labelled as such in the UI, and never presented as verified facts, prices or legal requirements. Items marked ⚑ are "verify locally" prompts, not legal advice.

## 1. Pack structure

```ts
interface TemplatePack {
  id: 'wedding' | 'birthday' | 'community';
  segmentLabel: 'Function' | 'Session' | 'Day';        // UI word for SubEvent
  presets: SubEventPreset[];                           // §2
  budgetProfiles: Record<'standard' | 'lean', Record<CategoryId, number>>; // weights sum to 100, after contingency
  categories: CategoryDef[];                           // label, scalesWithHeadcount, vendorCategory?
  essentials: Array<{ category: CategoryId; bookByDays: number; weight: 1 | 2 }>;
  tasks: TaskTemplate[];                               // §3 (+ appliesWhen)
  vendorChecklists: Record<VendorCategory, string[]>;  // §4
  riskRules: RiskRule[];                               // §5
  ideaLibrary: Idea[];                                 // §6
  outlinePrompts: string[];                            // questions the AI/UI asks to personalise
}
```

`appliesWhen` is a small typed predicate over the event (`setting === 'outdoor'`, `guests > 150`, `priorities.includes('photography')`, `fundingMode === 'sponsored'`…). Tasks that do not apply are not generated; the user can add or remove any task.

## 2. Function / session presets (names are suggestions: rename freely)

| Preset | Starting functions |
| --- | --- |
| Multi-function (North/West Indian style) | Roka / engagement · Mehendi · Haldi · Sangeet · Wedding ceremony · Reception |
| Nikah style | Mehendi · Nikah · Walima |
| Church wedding | Engagement · Wedding ceremony · Reception |
| Sikh wedding | Anand Karaj · Reception |
| Bengali style | Aiburobhat · Gaye holud · Wedding · Bou bhaat |
| Simple | Ceremony · Reception |
| Custom | Blank — the wizard offers *"Describe your tradition"*; the AI proposes function names for the organiser to edit (culture notes are untrusted text) |
| Birthday | Single party (optional: *Return-gift & cake cutting* run-of-show) |
| Community — one-day | Programme |
| Community — fest | Day 1 · Day 2 · Day 3 (+ named tracks as sessions) |

Regional presets beyond these are intentionally left to *Custom* + AI suggestions, so no tradition is mis-described by the app. Names should be reviewed by a native speaker before any public launch.

## 3. Task templates

Columns: `id` · title · priority (C critical, H high, M medium, L low) · `lead` days before the event · `min` shortest realistic lead · `after` (prerequisites). Effort defaults to M. Dates are generated with the compression algorithm in `DOMAIN-MODEL.md` §5.7. A **negative** `lead` means *after* the event (e.g. −7 = a week after); for those tasks a negative `min` is the latest allowed date after the event (−30 = within 30 days). After-event tasks are only generated once the event date has passed or when reconciliation mode is on.

### 3.1 Wedding pack (≈ 38 tasks)

| id | Task | Pri | Lead | Min | After | Applies when |
| --- | --- | :-: | ---: | ---: | --- | --- |
| w-budget | Agree total budget and who contributes | C | 300 | 45 | | |
| w-guests-draft | Draft guest list by side and function | C | 280 | 45 | w-budget | |
| w-venue | Shortlist, visit and book venue(s) | C | 270 | 60 | w-budget, w-guests-draft | venueStatus ≠ home |
| w-dates | Confirm dates with family; check clashes with exams and travel | H | 285 | 45 | | |
| w-planner | Decide: plan in-house or hire a planner; assign family leads | H | 270 | 45 | w-budget | |
| w-caterer | Taste, compare quotes and book caterer | C | 180 | 45 | w-venue, w-guests-draft | |
| w-photo | Compare portfolios and book photographer/videographer | H | 150 | 30 | w-venue | |
| w-decor | Decide theme; book decorator and florist | H | 120 | 30 | w-venue | |
| w-music | Book DJ / band / artists for sangeet and reception | M | 120 | 30 | w-venue | |
| w-attire | Order outfits; schedule fittings and alterations | H | 120 | 40 | w-budget | |
| w-makeup | Book makeup and hair artist; trial | M | 90 | 21 | w-attire | |
| w-priest | Confirm priest / officiant / qazi and ritual requirements | C | 120 | 30 | w-dates | |
| w-permits | Check venue rules: noise, music, parking, firecracker and fire norms ⚑ | M | 60 | 14 | w-venue | |
| w-accom | Block rooms for outstation guests; plan transfers | M | 90 | 30 | w-guests-draft, w-venue | guests > 60 |
| w-transport | Arrange baraat/guest transport and parking plan | M | 45 | 14 | w-venue | |
| w-invite-design | Finalise invitation design and wording (all languages) | H | 90 | 21 | w-dates | |
| w-save-date | Send save-the-date message (WhatsApp) | M | 100 | 30 | w-dates | audience = destination OR guests > 100 |
| w-invites-send | Send invitations; start RSVP tracking | C | 60 | 21 | w-invite-design, w-guests-draft | |
| w-rsvp-chase | Follow up non-responders (personal calls) | H | 30 | 10 | w-invites-send | |
| w-menu | Finalise menu per function incl. Jain / vegan / allergen needs | H | 45 | 14 | w-caterer | |
| w-rain-plan | Prepare rain / heat contingency for outdoor areas | H | 45 | 10 | w-venue | setting ≠ indoor |
| w-access | Plan access: ramps, seating for elders, restrooms, parking drop-off | M | 40 | 10 | w-venue | accessibilityNeeds not empty OR guests > 100 |
| w-run-of-show | Draft run-of-show for each function with owners | H | 30 | 7 | w-venue, w-music, w-photo | |
| w-vendor-brief | Send each vendor their brief: timings, headcount, contacts | H | 21 | 5 | w-run-of-show | |
| w-payments | Build payment calendar; confirm deposits and final dues | H | 45 | 10 | w-caterer, w-decor | |
| w-gifts | Plan return gifts / favours and gifting logistics | L | 45 | 10 | | |
| w-rooms-arrange | Allot rooms and prepare welcome kits | L | 14 | 3 | w-accom | |
| w-seating | Plan seating / tables for key functions | L | 14 | 4 | w-rsvp-chase | guests > 150 |
| w-final-count | Give final headcount to caterer and venue | C | 7 | 3 | w-rsvp-chase, w-caterer | |
| w-rehearsal | Walk-through / rehearsal with key family and vendors | M | 5 | 1 | w-run-of-show | |
| w-emergency | Print emergency contacts, first-aid and vendor phone sheet | M | 5 | 1 | w-vendor-brief | |
| w-cash | Arrange cash envelopes / tips for staff and vendors on the day | M | 4 | 1 | w-payments | |
| w-day-owners | Assign a named owner for every function and vendor on the day | H | 4 | 1 | w-run-of-show | |
| w-final-pay | Settle final vendor payments per agreed terms | H | 1 | 0 | w-payments | |
| w-thanks | Send thank-you messages; collect vendor feedback | L | −7 | −30 | | after event |
| w-reconcile | Reconcile planned vs actual spend | L | −14 | −60 | | after event |
| w-media | Collect photos/videos from vendors and guests | L | −14 | −60 | w-photo | after event |

Essentials (`bookByDays`, weight): venue 120 (2) · catering 90 (2) · photography 90 (1) · decor 60 (1) · music 60 (1) · attire 60 (1) · makeup 30 (1).

**Budget profile "standard"** (weights of the spendable budget after contingency): Venue 22 · Catering 35 · Decor & flowers 11 · Photo & video 8 · Music & entertainment 6 · Attire & beauty 6 · Invitations 2 · Transport 3 · Accommodation 3 · Rituals & misc 2 · Gifts & favours 2 = **100**. Venue + catering = 57 %, inside the 55–65 % range reported by industry guides (`BENCHMARKS.md`). Jewellery and similar family purchases are excluded by default (a toggle adds a "Jewellery & gifts" line). **Profile "lean"** moves 6 points from decor and music to catering and a larger reserve. `scalesWithHeadcount`: catering, invitations, transport, accommodation, gifts.

### 3.2 Birthday pack (≈ 22 tasks)

| id | Task | Pri | Lead | Min | After | Applies when |
| --- | --- | :-: | ---: | ---: | --- | --- |
| b-budget | Set budget and headcount (kids and adults separately) | C | 45 | 7 | | |
| b-date | Fix date and time around school, exams and nap times | C | 45 | 7 | | |
| b-venue | Book venue or plan home / terrace setup | C | 40 | 7 | b-budget, b-date | venueStatus ≠ home |
| b-theme | Pick theme with the birthday child; list must-have activities | H | 35 | 7 | b-budget | |
| b-invite | Design and send invitations (WhatsApp) | H | 25 | 7 | b-theme, b-date | |
| b-rsvp | Track RSVPs; ask dietary and allergy needs | H | 14 | 4 | b-invite | |
| b-cake | Order cake (flavour, egg-free / vegan options, size for headcount) | C | 14 | 3 | b-rsvp | |
| b-food | Plan food and snacks; kids' menu and adult menu | H | 14 | 3 | b-budget | |
| b-decor | Order or DIY decor: balloons, backdrop, table setup | M | 14 | 3 | b-theme | |
| b-activities | Book entertainer / plan games, prizes and craft table | H | 21 | 5 | b-theme | honoreeAge < 13 |
| b-photo | Arrange photographer or assign a family member | M | 14 | 3 | | priorities has photography |
| b-favours | Prepare return gifts | M | 10 | 3 | b-rsvp | |
| b-safety | Child-safety check: allergens, supervision ratio, exits, first-aid | H | 7 | 2 | b-venue | honoreeAge < 13 |
| b-weather | Rain / heat plan for outdoor or terrace | M | 7 | 2 | b-venue | setting ≠ indoor |
| b-access | Plan seating, ramps and a quiet corner | L | 7 | 2 | b-venue | accessibilityNeeds not empty |
| b-run | Draft a 3-hour run-of-show (arrival, games, cake, food, goodbye) | M | 5 | 1 | b-activities, b-food | |
| b-helpers | Assign helpers: reception, food, photos, cleanup | M | 4 | 1 | b-run | |
| b-final-count | Confirm final headcount for food and cake | H | 3 | 1 | b-rsvp | |
| b-pay | Pay balances and keep receipts | M | 2 | 0 | | |
| b-cleanup | Plan cleanup and leftover food donation | L | 1 | 0 | | |
| b-thanks | Send thank-you notes; share photos | L | −3 | −21 | | after event |
| b-reconcile | Reconcile planned vs actual spend | L | −7 | −30 | | after event |

Essentials: venue 21 (2) · cake 10 (2) · food 10 (2) · entertainer 21 (1).
**Budget profile "standard"**: Venue / home setup 20 · Food & cake 35 · Decor & theme 15 · Entertainment & activities 15 · Return gifts 8 · Photography 4 · Invitations 1 · Misc 2 = **100**. These percentages are heuristics (low confidence); the research brief reports that typical Indian birthday parties can be organised for under ₹1 lakh while some families spend several lakh.

### 3.3 Community pack — community events and college fests (≈ 34 tasks)

| id | Task | Pri | Lead | Min | After | Applies when |
| --- | --- | :-: | ---: | ---: | --- | --- |
| c-brief | Define purpose, audience, format and success measures | C | 120 | 21 | | |
| c-team | Form core team; assign leads (programme, sponsorship, logistics, publicity, safety) | C | 120 | 21 | c-brief | |
| c-budget | Draft budget and funding plan | C | 110 | 21 | c-brief | |
| c-approval | Get institution / society / RWA approval and date block | C | 110 | 21 | c-brief | |
| c-venue | Book venue and fix the layout | C | 100 | 21 | c-approval, c-budget | venueStatus ≠ home |
| c-sponsor-deck | Build sponsor pitch and tiers with deliverables | H | 105 | 21 | c-budget | fundingMode = sponsored |
| c-sponsor-outreach | Start sponsor outreach; track pipeline | C | 90 | 21 | c-sponsor-deck | fundingMode = sponsored |
| c-sponsor-confirm | Confirm sponsors in writing; agree deliverables and payment dates | H | 45 | 14 | c-sponsor-outreach | fundingMode = sponsored |
| c-artists | Shortlist and book performers / guests / judges | H | 75 | 21 | c-budget, c-venue | |
| c-competitions | Define events, rules, prizes and judging criteria | M | 60 | 14 | c-brief | subtype = college_fest |
| c-permissions | List permissions needed for the venue, loudspeakers, food and public gathering ⚑ | C | 60 | 21 | c-venue | |
| c-fire-safety | Check fire safety, electrical load, exits and capacity ⚑ | H | 45 | 14 | c-venue | |
| c-food | Arrange food stalls / catering; check hygiene and licences ⚑ | M | 45 | 14 | c-venue | |
| c-music-licence | Check music / performance licensing requirements ⚑ | M | 45 | 14 | c-artists | |
| c-stage-av | Book stage, sound, lights and generator backup | H | 45 | 14 | c-venue, c-artists | |
| c-publicity-plan | Plan publicity: posters, social, college groups, press | H | 60 | 14 | c-brief | |
| c-registration | Open registrations / ticketing; set up check-in | H | 40 | 10 | c-competitions | attendanceModel = open_footfall |
| c-publicity-run | Run publicity and countdown content | H | 30 | 7 | c-publicity-plan | |
| c-volunteers | Recruit volunteers; define roles, briefing and shifts | H | 30 | 10 | c-team | |
| c-security | Plan crowd flow, entry/exit, security and first-aid | H | 30 | 10 | c-venue | |
| c-access | Plan accessibility: ramps, seating, signage, quiet area | M | 30 | 10 | c-venue | |
| c-waste | Plan waste: bins, segregation, reusable serveware, surplus-food donation | M | 21 | 7 | c-food | |
| c-weather | Rain / heat contingency and alternate indoor space | H | 21 | 7 | c-venue | setting ≠ indoor |
| c-merch | Order merchandise, banners, ID cards and signage | M | 21 | 10 | c-sponsor-confirm | |
| c-schedule | Publish final schedule; build run-of-show with owners | H | 14 | 5 | c-artists, c-competitions | |
| c-vendor-brief | Brief all vendors and send them the run-of-show | H | 10 | 3 | c-schedule | |
| c-rehearsal | Technical rehearsal and sound-check | H | 3 | 1 | c-stage-av | |
| c-volunteer-brief | Volunteer briefing with printed roles and emergency plan | H | 2 | 0 | c-volunteers | |
| c-cash | Cash, change and float for stalls and desks | L | 2 | 0 | | |
| c-sponsor-deliver | Deliver sponsor commitments (logos, stalls, mentions); collect proof | M | 1 | 0 | c-sponsor-confirm | fundingMode = sponsored |
| c-closing | Plan winding-up, wrap-up and vote of thanks | L | 1 | 0 | | |
| c-thanks | Thank sponsors, volunteers and vendors | L | −5 | −30 | | after event |
| c-report | Sponsor / institution report with photos and numbers | M | −14 | −45 | | fundingMode = sponsored |
| c-reconcile | Reconcile planned vs actual spend and funding | M | −14 | −45 | | after event |

Essentials: venue 60 (2) · stage/sound 30 (2) · permissions started 30 (2) · security plan 21 (1) · artists 45 (1) · sponsors confirmed 30 (1, sponsored only).
**Budget profile "standard"**: Performers & guests 25 · Stage, sound, lights & tech 20 · Venue & logistics 10 · Publicity & marketing 8 · Food & hospitality 8 · Prizes & competitions 8 · Security, safety & permits 6 · Decor & branding 6 · Merchandise & printing 4 · Volunteers & admin 3 · Misc 2 = **100** (heuristic, low confidence). College-fest research reports sponsorship covering around 70 % of budgets at several Delhi University fests (`BENCHMARKS.md`), which is why sponsored events get the Funding tracker.
Volunteer roles to seed: registration desk, stage manager, green-room host, hospitality, first-aid, crowd marshal, cleanliness lead, publicity/photography.

## 4. Vendor categories and enquiry checklists

Used as the "Questions to ask" and "Inclusions" checklist on every vendor and quotation. Each item is a short prompt; the quote form turns inclusion prompts into the `inclusions` checklist.

- **Venue:** capacity per function and seating style · rent basis (per day / per function) · what is included (rooms, power backup, parking, AC, stage, dressing rooms) · outside caterer or decorator allowed (and any fee) · music and closing-time restrictions · security deposit and refund terms · rain/heat plan for outdoor areas · accessibility (ramps, lifts, restrooms) · cancellation and date-change terms · GST and other charges.
- **Caterer:** price per plate by menu and by function · live counters and staff included · crockery, cutlery, tables and linen · tasting before booking · Jain / vegan / allergen handling and separation · minimum guarantee and headcount-change deadline · extra-plate rate and service charge · wastage and surplus-food policy · payment schedule · GST included or extra.
- **Photographer / videographer:** deliverables (edited photos, album, film, drone) · hours, team size and travel · raw-file policy and delivery timeline · backup equipment and second shooter · usage rights · overtime rate · payment schedule and cancellation.
- **Decorator / florist:** itemised scope per function · what is reused between functions · setup and teardown times · power and safety (lights, rigging) · flower sourcing and substitutions · damage and cleanup terms · weather plan for outdoor setups.
- **Music / DJ / band / artists:** set length and breaks · sound and light equipment included · power and generator needs · playlist control and do-not-play list · overtime · arrival and soundcheck time · licensing responsibility ⚑.
- **Makeup / mehendi / attire:** trials · timings per function · travel and assistant charges · products used (allergies) · alterations deadline · payment and cancellation.
- **Transport:** vehicles and capacity · driver and fuel inclusions · waiting charges · permits and tolls · decorated cars · breakdown backup.
- **Priest / officiant / qazi:** ritual duration and requirements list · samagri / arrangements responsibility · fixed timings (⇒ `fixedTime` in run-of-show).
- **Stage / sound / lights / generator (community):** rider and power load · sound-check slot · generator capacity and fuel · safety certificate where required ⚑ · set-up and strike times.
- **Entertainer / activities (birthday):** age suitability · supervision and safety · props and prizes included · duration and overtime · what they need from the host.

Contract-review reminders (shown before accepting a quote): deposit and instalment dates · cancellation and refund terms · what is *not* included · tax treatment · date and time commitments · named contact on the day · written confirmation of all verbal promises.

## 5. Risk rule catalogue

Severity is the default; rules may escalate it as the date nears. Each rule yields a finding with `title`, `detail` (with the numbers that triggered it), and a suggested `mitigation` (which can be turned into proposed tasks).

| Rule id | Triggers when | Default severity | Suggested mitigation |
| --- | --- | :-: | --- |
| `outdoor.no-rain-plan` | setting ≠ indoor and no task/vendor covers a rain/heat plan | high | Add covered area or tent quote; alternate indoor space |
| `weather.rain-forecast` | forecast in range: rain risk (§5.13) | high | Activate the contingency plan; tell vendors |
| `weather.heat` | forecast `temperatureMax ≥ 38 °C`, outdoor | medium | Shade, water points, shift programme timings |
| `essential.unbooked` | an essential's `bookByDays` has passed with no commitment | critical → high with quote in hand | Book or shortlist; compare quotes |
| `schedule.infeasible` | a task is `infeasible` | high | Cut scope, reduce lead need, or move the date |
| `schedule.critical-overdue` | a critical task is overdue | critical | Reassign; set a date today |
| `schedule.dependency-conflict` | dependency ordering pushed a task past its latest date | medium | Re-plan the chain |
| `quote.expiring` | accepted-candidate quote expires within 7 days | medium | Decide or ask for an extension |
| `quote.tax-unknown` | quote with unknown tax treatment is the top-ranked | medium | Ask the vendor to state GST in writing |
| `commitment.drift` | per-head commitment differs from current headcount by > 5 % (§5.5) | medium | Re-confirm headcount with the vendor |
| `money.over-budget` | budget status `over` | critical | Open the What-if Lab |
| `money.tight` | status `tight` (reserve being used) | medium | Review optional lines |
| `money.payment-overdue` | a planned payment is past due | high | Pay or renegotiate; record the outcome |
| `money.cash-crunch` | payments due in the next 14 days exceed unspent funds *and the user has entered available funds* | high | Re-sequence payments |
| `money.estimates-only` | within 60 days and > 60 % of projected spend is still estimates | medium | Collect quotes for the largest lines |
| `guests.rsvp-low` | within 21 days and fewer than 50 % of invited have replied | medium | Personal follow-up round |
| `guests.catering-gap` | catering commitment headcount < expected attendance | high | Revise the count with the caterer |
| `guests.diet-unplanned` | guests with dietary or allergy tags but no menu task done | medium | Brief the caterer |
| `access.unplanned` | accessibility needs recorded but no access task done | medium | Complete the access checklist |
| `funding.single-source` | one source > 50 % of confirmed funds | medium | Diversify sponsors |
| `funding.gap` | confirmed funds < projected spend within 45 days (sponsored events) | high | Cut or find sponsors |
| `community.permissions-open` ⚑ | within 30 days and permissions tasks not done | critical | Escalate to the institution / authorities |
| `vendor.single-point` | one vendor covers > 2 essential categories and is the only option | low | Name a backup |
| `weather.season-note` | event month is in a high-rain or cyclone-prone season for outdoor events (coarse regional note) | low | Prepare a monsoon-proof plan; check IMD alerts |

## 6. Idea library (seeds, not scraped content)

Ideas are structured records (`kind`, `title`, `summary`, `whyItFits`, `budgetTier` 1–3, `effort` 1–3, `tags`). Tiers are *relative* (₹ / ₹₹ / ₹₹₹), never prices. The AI Idea Studio adds personalised ideas on top of these; both work offline from the library when AI is unavailable. Filters: event type, budget tier derived from per-guest budget, indoor/outdoor, age band, dietary tags, priorities, low-waste.

Starter set (12–15 per type is enough; each with a one-line `whyItFits` template):

- **Birthday themes:** space explorers · jungle safari · pastel garden · mini chefs workshop · science lab · superhero training camp · art-and-craft studio · outdoor sports day · storybook characters · retro arcade. Activities: treasure hunt, DIY craft table, tattoo-and-face-paint corner, group storytelling, relay games, magic show.
- **Wedding décor / mood directions:** marigold and mango-leaf traditional · pastel florals · minimalist white and greens · heritage textiles and brass · sustainable (reusable decor, loose flowers, local produce) · evening lanterns and fairy lights. Function ideas: hands-on mehendi corner with chai, family talent segment at sangeet, memory wall.
- **Menus (by dietary need):** regional vegetarian thali menu · live chaat and tawa counters · Jain-friendly sections · vegan dessert table · millet-based options · hydration station for outdoor summers.
- **Community / fest ideas:** open-mic and battle-of-bands · tech showcase and hack sprint · food-truck corner · cultural parade · green-campus theme with zero single-use plastic · charity run or blood-donation camp · inter-college quiz.
- **Low-waste practices:** steel or reusable serveware, drinking-water refill points, floral and food waste composting or donation partner (organiser enters local contacts), digital invitations, local sourcing.

## 7. Outline prompts (to personalise the plan)

Short, answerable questions used by the wizard summary and by the AI: *Which priorities matter most? Are there functions or rituals with fixed timings? Any elders or guests needing step-free access? Which dietary rules apply per function? How many guests travel from out of town? Is the venue's catering exclusive? What must not change if the budget tightens?* Answers are stored as event fields or tasks, not as free-floating chat history.
