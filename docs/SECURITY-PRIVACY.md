# GatherWise — Security & Privacy

> **Status:** v1.0, 24 Oct 2026. Security is a *medium-impact* rubric item and a hard requirement for anything touching guest data and an AI key. Controls below are mandatory unless marked optional. This is design guidance, **not legal advice**.

## 1. Posture in one paragraph

Secrets live only on the server. Every boundary parses input with Zod. The browser renders only escaped text. The AI can read a minimised snapshot through read-only tools and can only *propose* allow-listed commands that a human approves. Guest data stays on the organiser's device in demo mode and under owner-only rules in cloud mode. Nothing is sent, published or shared by the app on the organiser's behalf.

## 2. Assets and threats

| Asset | Threat | Control |
| --- | --- | --- |
| Gemini API key | Leak via bundle, logs, repo, error messages | Server-only env; never `VITE_`-prefixed; `.env` git-ignored; build scan for `AIza`/`GEMINI_API_KEY`; errors never echo config |
| AI budget (key quota) | Anonymous abuse of `/api/ai/*` | Per-IP and per-user rate limits, global daily cap, body caps, timeouts, response cache; auth required when Firebase is configured |
| Guest PII (names, phones, access needs) | Over-collection, leakage to model or logs, public URLs | Optional fields, owner-only rules, no public guest URLs, excluded from AI context and logs, export warnings |
| Financial records (payments, quotes) | Tampering through AI or injected text | Command allow-list, human approval, `ai_assisted` flag, activity log + undo, new-money rule |
| User data in the browser | XSS, malicious import | React escaping, no raw HTML, strict CSP, CSV/ICS escaping, validated imports |
| Other users' events (cloud) | Broken access control | Verified ID token, uid from token only, denormalised `ownerId` + rules, no client-supplied identity |
| Supply chain | Malicious or vulnerable dependency | Small allow-list (`AGENTS.md`), lockfile, exact pins for the AI SDK, `npm audit`, no unreviewed postinstall scripts |
| Availability | Oversized bodies, slow upstreams | Size limits, timeouts, circuit-breaker style fallback, graceful degradation |

## 3. Controls

### 3.1 Secrets and configuration
`server/config/env.ts` parses `process.env` with Zod once; the server refuses to start on malformed values. `.env.example` lists names with placeholders only. Firebase **web** config (`VITE_FIREBASE_*`) is public by design but still comes from env. Service-account credentials are referenced by path via `GOOGLE_APPLICATION_CREDENTIALS` (outside the repo) or the platform's default credentials. `scripts/verify-submission.sh` and CI scan tracked files and git history for key patterns.

### 3.2 Authentication and authorisation
- **Cloud mode:** Firebase Auth (Google sign-in). AI routes require `Authorization: Bearer <ID token>` verified with `firebase-admin`; the uid is taken from the verified token, never from body, query or headers other than the token.
- **Demo/no-Firebase mode:** AI routes accept anonymous calls with stricter per-IP limits and a global daily cap; `GET /api/health` reports `cloud: false`.
- Firestore rules enforce owner-only access on every collection (§6). Roles and collaborators are out of scope for v1 (documented in the roadmap); the `ownerId` field and rule structure leave room for them.

### 3.3 Validation and encoding
- Zod at every boundary: forms, HTTP bodies and queries, storage reads (cloud), AI output, imports. Strict objects (unknown keys rejected) for API bodies.
- Length caps on every free-text field (`DOMAIN-MODEL.md`); numeric ranges; enum membership; date and time formats.
- Links built by the app use an allow-list of schemes (`https:`, `tel:`, `mailto:`); phone numbers are normalised to digits before building `wa.me` links; user-entered URLs are not rendered as links unless they pass the allow-list.
- **CSV export:** RFC 4180 quoting, UTF-8 BOM (so Indic scripts open correctly in Excel), and a **formula-injection guard** (prefix `'` to cells beginning with `=`, `+`, `-`, `@`, tab or carriage return). **CSV import:** size limit (≤ 2 MB / 5,000 rows), strict parsing, per-row validation, preview before commit.
- **ICS export:** escape `\`, `;`, `,` and newlines per RFC 5545; fold lines at 75 octets; CRLF endings; stable `UID`s.
- File uploads (quote scanner): mime allow-list **and** magic-byte check, ≤ 4.5 MB decoded, processed in memory, never written to disk or logged.

### 3.4 HTTP hardening
`helmet` with an explicit CSP, built from env so cloud mode can add its extras:

```text
default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline';
img-src 'self' data: blob:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';
frame-ancestors 'none';
connect-src 'self'
```

Cloud mode adds only what the Firebase SDK needs (`https://firestore.googleapis.com`, `https://identitytoolkit.googleapis.com`, `https://securetoken.googleapis.com`, and the sign-in popup/redirect hosts such as `https://apis.google.com`, `https://accounts.google.com`, `https://<project>.firebaseapp.com`). **Verify in a real browser**; do not claim cloud mode works from reading docs. Apply the strict CSP to production builds only; relax for the Vite dev server. If an IDE or studio preview iframes the app, set `ALLOW_EMBEDDING=true` in *that* environment only (changes `frame-ancestors`). Also send `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera, microphone and geolocation, and HSTS when served over TLS. No cookies are set. CORS is same-origin by default; extra origins come from `ALLOWED_ORIGINS`.

### 3.5 Rate limiting, quotas and cost
`express-rate-limit`: global 120 req/min/IP; AI 12 req/min per user-or-IP; weather 30 req/min/IP; quote-scan 4 req/min. A global daily AI request cap (`AI_DAILY_REQUEST_CAP`) trips a circuit breaker that returns `AI_UNAVAILABLE` until midnight IST. Responses to identical (message + context version) requests are cached for 5 minutes.

### 3.6 Logging
JSON logs with request id, route, status, duration, and for AI: model, tool-call count, token counts, outcome. **Never** log bodies, prompts, event content, guest data, uploaded files, tokens or keys. Errors returned to clients use the safe envelope.

### 3.7 Client storage
Demo data lives in IndexedDB (`gatherwise-demo`) and nowhere else; no tokens or secrets are stored by app code. Settings → *Download my data* (JSON) and *Delete all data* are always available. Auto-clear is optional, never silent.

### 3.8 Dependencies
Follow the allow-list in `AGENTS.md`. Commit the lockfile; pin `@google/genai` to an exact version; run `npm audit --omit=dev` and record the result (do not claim "no vulnerabilities" unless it ran); avoid packages with install scripts unless reviewed; prefer widely used libraries (React, Zod, Express, Vitest, Radix).

## 4. Privacy by design

| Data | Purpose | Stored | Leaves the device? | Retention / control |
| --- | --- | --- | --- | --- |
| Event details, budget, tasks, vendors, quotes | Planning | IndexedDB (demo) or the user's Firestore documents | Cloud mode: to Firebase. AI features: minimised snapshot via the app server to Gemini | Delete event / delete all; export JSON |
| Guest names, contacts, dietary, access notes | RSVP, catering, access planning | Same | **Not** sent to AI; not in logs; exported only on request with a warning | Delete guest / event / all |
| Uploaded quote file | One-off extraction | Memory only | To Gemini for extraction (server-side) | Discarded after the response |
| Chat messages | Assistant | Session memory (not persisted) | To Gemini | Cleared on reload unless the user pins results |
| City / date for weather | Forecast | Not stored by the server (3 h cache of results) | To Open-Meteo | – |

Privacy notice (one screen, plain language, linked from the footer and the first AI use): what is stored where, what the assistant sees, that the organiser should collect only what they need from guests and tell guests how it is used, how to export and erase. First AI use shows a short consent: *"To answer, GatherWise sends a summary of this event (no guest names or contacts) to Google's Gemini."* with *Use AI* / *Not now*. Declining leaves the built-in assistant on.

### 4.1 India's DPDP Act — design alignment (verify with counsel before a public launch)
The Digital Personal Data Protection Act, 2023 and its Rules were notified in November 2025 with phased commencement; law-firm summaries report consent-manager provisions from November 2026 and the core duties (notice, consent, safeguards, rights, children's data) from 13 May 2027. Until then the IT Act's data-protection rules apply. GatherWise is designed so it can meet those duties: **notice** (privacy screen) and **consent** (AI and cloud sync are opt-in); **purpose limitation and minimisation** (optional fields, AI context minimisation); **accuracy** (everything editable); **storage limitation** (delete and export); **security safeguards** (this document); **rights** (access/export, correction, erasure from Settings; a grievance contact placeholder in the README for a real deployment); **children's data** (birthday guests record first names and age bands only; no profiling, tracking or targeted advertising anywhere). The organiser is responsible for the lawfulness of the guest data they enter; the product's job is to minimise, protect and make deletion easy.

## 5. Guest-facing features (roadmap, not v1)

If a guest RSVP page is added later: per-guest random 128-bit tokens stored only as SHA-256 hashes, scoped to one invitation and one function set, expiring after the event, revocable, rate-limited, exposing only the guest's own record and public event details, accepting only validated RSVP fields, served through server endpoints (never open Firestore rules).

## 6. Reference Firestore rules (cloud mode)

Create `firebase/firestore.rules` from this and keep it in sync with the collections in `DOMAIN-MODEL.md` §7. Clients must filter list queries with `where('ownerId', '==', uid)`. *Not emulator-tested in this pack*: test with `@firebase/rules-unit-testing` when the Firestore emulator is available, otherwise report "rules not tested".

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() { return request.auth != null; }
    function ownsDoc() { return signedIn() && resource.data.ownerId == request.auth.uid; }
    function creatingOwnDoc() { return signedIn() && request.resource.data.ownerId == request.auth.uid; }
    function ownerUnchanged() { return request.resource.data.ownerId == resource.data.ownerId; }
    function ownsEvent(eventId) {
      return signedIn() &&
        get(/databases/$(database)/documents/events/$(eventId)).data.ownerId == request.auth.uid;
    }
    function allowedCollection(name) {
      return name in ['subEvents', 'budgetLines', 'commitments', 'payments', 'vendors', 'quotations',
                      'tasks', 'guests', 'risks', 'scenarios', 'funding', 'runOfShow', 'ideas', 'activity'];
    }
    function reasonableSize() { return request.resource.data.keys().size() <= 60; }

    match /users/{uid} {
      allow read, write: if signedIn() && request.auth.uid == uid;
    }

    match /events/{eventId} {
      allow read:   if ownsDoc();
      allow create: if creatingOwnDoc() && reasonableSize();
      allow update: if ownsDoc() && ownerUnchanged() && reasonableSize();
      allow delete: if ownsDoc();

      match /{collection}/{docId} {
        allow read:   if allowedCollection(collection) && ownsDoc();
        allow create: if allowedCollection(collection) && creatingOwnDoc() && ownsEvent(eventId) && reasonableSize();
        allow update: if allowedCollection(collection) && ownsDoc() && ownerUnchanged() && reasonableSize();
        allow delete: if allowedCollection(collection) && ownsDoc();
      }
    }
    // Everything else is denied by default.
  }
}
```

## 7. Security test list (`tests/security/**` and colocated)

1. `env.ts` rejects malformed config and never prints secrets.
2. Error handler returns the safe envelope (no stack, no upstream body) for thrown errors.
3. `validate()` rejects unknown keys, oversize strings and wrong types on every AI route.
4. Auth middleware: missing/invalid token → 401; uid from body ignored; valid fake token → owner.
5. Rate limiter returns 429 with `retryAfterSeconds`; daily cap trips the breaker.
6. AI: injection corpus cannot produce disallowed commands; new-money rule; allow-list; number audit; malformed output → one repair, then `AI_INVALID_OUTPUT`; timeout → `AI_UNAVAILABLE`.
7. CSV guard, ICS escaping, URL scheme allow-list, magic-byte sniffing.
8. `buildAiContext` never includes names, contacts, notes or sensitive tags (snapshot test with seeded PII).
9. Architecture tests: no `dangerouslySetInnerHTML`, no `eval`, Firebase imports confined to adapters.
10. Build scan: `dist/client` has no `AIza` pattern or `GEMINI_API_KEY`.

## 8. Pre-submission security checklist

- [ ] `git grep -nE 'AIza[0-9A-Za-z_-]{35}'` returns nothing, and no `.env` is tracked (also check history: `git log -p | grep AIza`).
- [ ] `.env.example` contains placeholders only.
- [ ] `npm audit --omit=dev` run and its result recorded in `STATUS.md`.
- [ ] CSP and headers verified in the built app (browser devtools), including that the app still works.
- [ ] Without `GEMINI_API_KEY` the app boots and every AI surface shows its fallback.
- [ ] Privacy notice and AI consent are reachable; export and delete-all work.
- [ ] Firestore rules file present; marked "tested" only if the emulator ran.
