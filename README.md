# Clinical Encounter Assistant

Prototype for an AI-assisted encounter tool for prosthetists: set up the visit, get glanceable guidance while recording, and review a structured SOAP note afterwards.

## How this was built

To fit the timebox, the code was generated with an AI assistant (Claude). I set the direction and made the product decisions, worked through the build one step at a time, and reviewed each step before moving on. Every step was typechecked, run end to end in an automated browser, scanned for accessibility, and checked with the API smoke test below. The git history shows the steps in order.

## Run it

```bash
npm install
npm run dev        # API on :8787, app on :5173
```

Open http://localhost:5173.

### Demo switches (add to the URL)

| Switch | Effect |
| --- | --- |
| `?speed=20` | Plays the visit faster (default 5x; `?speed=1` is real time) |
| `?fail=once` | Each API call fails the first time, so **Try again** recovers |
| `?fail=1` | Every API call fails |

Switches carry over from Setup to Live to Review.

## Structure

```
shared/   Types, API shapes, encounter types and their items, checklist and coverage logic, mock transcript
server/   Express API behind a provider interface (mock now, real services later)
client/   React + TypeScript (Vite), plain CSS with design tokens
```

`shared` is used by both sides, so "what counts as covered" and the request shapes have one definition.

## API

| Endpoint | Body | Returns |
| --- | --- | --- |
| `POST /api/transcribe` | multipart: `encounterTypeId`, `durationSec?`, `audio?` | `Transcript`: speaker-labeled segments |
| `POST /api/generate-note` | JSON: `encounterTypeId`, `checklist`, `transcript` | `ClinicalNote`: SOAP statements citing transcript segments, plus missing required items |
| `GET /api/health` | | Which providers are active |

The note endpoint receives the visit's own checklist, so items the clinician added or hid at setup are respected. Bad input returns 400 with `retryable: false`; provider failures return 503 with `retryable: true`.

Check the API end to end against a running server:

```bash
npm run smoke -w server
```

Configuration lives in `server/.env.example` (provider, simulated latency, random failure rate).

## What's real and what's mocked

| Part | Status |
| --- | --- |
| Encounter types and required items | Real data, modeled on Medicare's lower limb prostheses policy (illustrative) |
| Setup screen | Built, including per-visit add and hide for checklist items |
| Live encounter screen | Built: simulated recording, suggested next, progress, wrap-up check |
| Processing | Built: calls both endpoints, retries resume at the failed step |
| Review screen | Built: each statement links to its transcript evidence; edit or remove statements; fill gaps by dictating (simulated) or typing; sign with a warning if items are missing |
| Signing and export | Signing is local; copy and download as text work; export to a record system is not built |
| Transcription | Mock provider returning the scripted conversation, trimmed to the recording length |
| SOAP note generation | Mock provider with canned clinical phrasing; real provider is a stub behind the same interface |
| Coverage detection | Keyword matching; production would use the LLM |
