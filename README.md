# Relay — the CRM that fills itself

A GenAI-native CRM for MathCo's GTM team. Built to replace the Monday.com motion where
30+ people are supposed to hand-fill fields after every call — and don't.

## The thesis

CRM hygiene is a **data-entry** problem, not a UI problem. Relay never asks a human to
type a record. It watches the work — call transcripts, email, LinkedIn — extracts every
field with a **source quote**, and asks the human to *confirm, not enter*.

## What's built (phase 1 — seller persona, live backend)

- **Today** — a prioritised action feed (not a table to maintain), ranked by deal risk.
- **Capture** — the killer flow: transcripts/emails land pre-structured; one-click accept
  each AI-extracted field, each with the exact quote it came from. Zero form-filling.
- **Log a call** — for 1-1s with no notetaker: paste raw notes, Relay extracts the fields
  (via a Supabase Edge Function) and drops them into the accept queue.
- **Pipeline** — grouped **by industry** (seller is a secondary filter), with auto-computed
  propensity (stage baseline ± 1–2 criteria) — the single clean column Cortex ingests.
- **Deal detail** — provenance on every field, propensity explainer, auto-captured
  timeline, ownership map (sales / solutioning / JD+Sahana), and a **latent-pool gate**
  (can't drop a deal without a reason).
- **Warm paths**, **Accounts** (intent-signalled), **Ask Relay** (⌘K over the live pipeline).

## Architecture

- **Frontend**: Vite + React 18 + TypeScript + Tailwind. Same Stripe/Linear design tokens
  as the sales dashboard. Deployed to GitHub Pages.
- **Backend**: Supabase — an isolated `relay` schema in the same project as the dashboard.
  All tables are **authenticated-only** (RLS blocks `anon` entirely), so this repo is public
  while every byte of pipeline data stays behind login. The anon key in the client bundle
  can read nothing until a user signs in.
- **Extraction**: a `relay-extract` Edge Function (Claude → OpenAI → heuristic fallback)
  turns raw notes into structured, quote-backed suggestions.

## How it maps to the Jul 10 CRM-ops decisions

| Decision from the call | In Relay |
|---|---|
| Auto-extract CRM fields from transcripts | Capture inbox + Log a call + provenance |
| Every call must produce a next step | Next-step draft on every deal/capture |
| Latent needs reason + sign-off | Latent-pool gate |
| Propensity = stage baseline ± 1–2 criteria | Auto-propensity explainer |
| Field ownership (sales / solutioning / JD+Sahana) | Owner tags on every field |
| Keep Cortex columns hygiene-high | One propensity column, structured fields |

## Run

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL + anon key
npm run dev                  # http://localhost:5180
npm run build && npm run preview
```
