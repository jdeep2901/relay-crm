// Relay data model. Mirrors the fields Cortex ingests + the ambient-capture layer.
// Everything a human would normally hand-type is instead AI-extracted with provenance.

export type Stage =
  | 'Intro'
  | 'Qualification'
  | 'Capability'
  | 'Problem Scoping'
  | 'Proposal'
  | 'Contracting'
  | 'Won'
  | 'Lost'
  | 'Latent Pool'
  | 'Disqualified'

export type Vertical = 'Pharma' | 'CPG' | 'Retail' | 'Tech'
export type Channel = 'Referral' | 'Email' | 'LinkedIn' | 'Apollo' | 'Event' | 'Cold'
export type Owner = 'sales' | 'solutioning' | 'jd-sahana'

// A field Relay extracted from a source. The provenance chip renders `source` + `quote`.
export interface ExtractedField<T = string> {
  value: T | null
  confidence: number // 0..1
  source: string | null // e.g. "Granola · Chad intro call · Jul 9"
  quote: string | null // the exact line the value came from
  owner: Owner // who is accountable for this field group
  status: 'confirmed' | 'suggested' | 'empty'
}

export type TouchType = 'call' | 'email' | 'linkedin' | 'note' | 'stage' | 'relay'

export interface Touch {
  id: string
  type: TouchType
  title: string
  detail?: string
  who: string // person on the client side or teammate
  date: string // ISO
  channel?: Channel
  captured: 'auto' | 'manual' // auto = ambient (Granola/email sync)
}

export interface Contact {
  name: string
  title: ExtractedField
  seniority: ExtractedField // C / VP / Director / Manager
  businessGroup: ExtractedField
  metInPerson: boolean
  warmPath?: string // teammate/relationship that can intro
}

export interface Deal {
  id: string
  name: string // deal / thread name
  account: string
  vertical: Vertical
  stage: Stage
  seller: string // deal owner
  sdr?: string
  solutioner?: string
  tcv: number // total contract value, USD
  channel: Channel
  introDate: string
  lastTouch: string // ISO of most recent touch
  nextStep: ExtractedField // AI-drafted next action
  nextStepDue?: string
  nextStepOwner?: string
  problemStatement: ExtractedField // solutioning-owned
  intent: ExtractedField // buying intent signal
  budget: ExtractedField // budget identified?
  contacts: Contact[]
  propensity: number // 0..1 auto-computed
  propensityBase: number // stage baseline from 2yr history
  propensityCriteria: { label: string; met: boolean; delta: number }[]
  touches: Touch[]
  flags: Flag[]
  latentReason?: string
  partnerSource?: string
  nextMeetingDate?: string // ISO — the anchor for pre-call planning
  serviceLine?: string
  problemSpace?: string
  mondayItemId?: string // link back to the Monday deal for write-back
}

// Pre-call planning brief: company + prospect research → smart discovery questions.
export interface PrecallBrief {
  dealId: string
  meetingDate?: string
  companySummary?: string
  companySignals: { label: string; detail: string; source?: string }[]
  prospectSummary?: string
  angle?: string
  smartQuestions: { q: string; why?: string }[]
  watchouts: string[]
  sources: { title: string; url: string }[]
  generatedAt?: string
}

export type FlagKind =
  | 'no-next-step'
  | 'stalled'
  | 'latent-thin' // moved (or about to move) to latent with thin follow-up
  | 'warm-path' // a warm intro exists but isn't used
  | 'expansion' // land-and-expand opening
  | 'ghosted'
  | 'hygiene' // Cortex column empty

export interface Flag {
  kind: FlagKind
  label: string
  severity: 'high' | 'med' | 'low'
}

// An inbound transcript/email waiting in the Capture inbox. Relay has pre-drafted
// the extraction; the human reviews and one-click accepts.
export interface CaptureItem {
  id: string
  kind: 'transcript' | 'email'
  source: string // "Granola" | "Outlook"
  title: string
  account: string
  dealId?: string
  who: string
  date: string
  durationMin?: number
  summary: string
  extracted: {
    id: string
    field: string
    value: string
    quote: string
    owner: Owner
    status: 'pending' | 'accepted' | 'rejected'
    confidence: number
  }[]
  proposedNextStep: string
  proposedStageMove?: { from: Stage; to: Stage }
  reviewed: boolean
}

// A warm-intro path in the relationship graph.
export interface WarmPath {
  target: string // buyer to reach
  targetTitle: string
  account: string
  via: string // MathCo person or contact
  relationship: string
  strength: 'strong' | 'medium' | 'thin'
  dealId?: string
}
