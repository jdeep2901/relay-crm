import type { Stage, Vertical } from '../data/types'

// Stage model — mirrors HANDOVER_CONTEXT canonical order.
export const OPEN_STAGES: Stage[] = ['Intro', 'Qualification', 'Capability', 'Problem Scoping', 'Proposal', 'Contracting']
export const GONE_STAGES: Stage[] = ['Latent Pool', 'Disqualified', 'Lost']
export const CLOSED_STAGES: Stage[] = ['Won', 'Lost', 'Latent Pool', 'Disqualified']

// Industry-first grouping — the primary lens (seller is a secondary filter).
export const VERTICALS: (Vertical | 'All')[] = ['All', 'Pharma', 'CPG', 'Retail', 'Tech']

// Seller ↔ industry ownership (from the Jul 10 CRM-ops ownership reset).
export const VERTICAL_OWNER: Record<Vertical, string> = {
  Pharma: 'Akshay Shridhar',
  CPG: 'Somya Shringi',
  Retail: 'Suvom Mitro',
  Tech: 'Suvom Mitro',
}

export const isGone = (stage: Stage) => GONE_STAGES.includes(stage)
export const isClosed = (stage: Stage) => CLOSED_STAGES.includes(stage)
