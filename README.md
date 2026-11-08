# Clinical Encounter Assistant

Prototype for an AI-assisted encounter tool for prosthetists: set up the visit, get glanceable guidance while recording, and review a structured SOAP note afterwards.

## Run it

```bash
npm install
npm run dev        # API on :8787, app on :5173
```

Open http://localhost:5173. Add `?fail=1` to the URL to make API calls fail and see the error states.

## Structure

```
shared/   Types, encounter types and their required items, coverage detection, mock transcript
server/   Express API: /api/transcribe and /api/generate-note behind a provider interface
client/   React + TypeScript (Vite), plain CSS with design tokens
```

`shared` is used by both sides, so "what counts as covered" has one definition.

## What's real and what's mocked

| Part | Status |
| --- | --- |
| Encounter types and required items | Real data, modeled on Medicare's lower limb prostheses policy (illustrative) |
| Setup screen | Built, including per-visit add and hide for checklist items |
| Live encounter screen | Built: simulated recording at 5x speed (`?speed=1` for real time), suggested next, progress, wrap-up check |
| Review screen | Placeholder |
| Transcription | Mock provider returning a scripted conversation, with simulated latency |
| SOAP note generation | Mock provider; real provider is a stub behind the same interface |
| Coverage detection | Keyword matching; production would use the LLM |

Configuration for the API lives in `server/.env.example`.
