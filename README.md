# Relay — the CRM that fills itself

A GenAI-native CRM prototype for MathCo's GTM team. Built to replace the Monday.com
motion where 30+ people are supposed to hand-fill fields after every call — and don't.

## The thesis

CRM hygiene is a **data-entry** problem, not a UI problem. Relay never asks a human to
type a record. It watches the work — Granola transcripts, email, LinkedIn — extracts every
field with a **source quote**, and asks the human to *confirm, not enter*.

## What's built (phase 1 — UI + features, mock data)

- **Today** — a prioritised action feed (not a table to maintain), ranked by deal risk.
- **Capture** — the killer flow: transcripts/emails land pre-structured; one-click accept
  each AI-extracted field, each with the exact quote it came from. Zero form-filling.
- **Pipeline** — auto-computed propensity (stage baseline ± 1–2 criteria) — the single
  clean column Cortex ingests, not 6 subjective ones.
- **Deal detail** — provenance on every field, propensity explainer, auto-captured
  timeline, ownership map (sales / solutioning / JD+Sahana), rich follow-up composer,
  and a **latent-pool gate** (can't drop a deal without a reason + follow-up check).
- **Warm paths** — the referral graph (referral is the only channel that closes here).
- **Accounts** — prioritised by intent signals, not just name/revenue.
- **Ask Relay** (⌘K) — conversational command bar over the pipeline.

Seeded with the real pipeline: L'Oréal, Diageo, Niagara, PepsiCo, Regeneron, Otsuka…

## How it maps to the Jul 10 CRM-ops decisions

| Decision from the call | In Relay |
|---|---|
| Auto-extract CRM fields from transcripts | Capture inbox + provenance |
| Every call must produce a next step | Next-step draft on every deal/capture |
| Latent needs reason + sign-off | Latent-pool gate |
| Propensity = stage baseline ± 1–2 criteria | Auto-propensity explainer |
| Field ownership (sales / solutioning / JD+Sahana) | Owner tags on every field |
| Keep Cortex columns hygiene-high | One propensity column, structured fields |

## Stack

Vite + React 18 + TypeScript + Tailwind. Same Stripe/Linear design tokens as the
sales dashboard. Phase 2: wire to Supabase via MCP (deal graph + `chat-analyst`-style
Edge Function for Ask Relay + a transcript→field extraction function).

## Run

```bash
npm install
npm run dev      # http://localhost:5180
npm run build && npm run preview
```
