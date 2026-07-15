import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import type {
  Deal, CaptureItem, WarmPath, ExtractedField, Owner, Stage, Vertical,
  Channel, Touch, TouchType, Contact, Flag, PrecallBrief,
} from '../data/types'

// ── Row shapes (relay schema) ────────────────────────────────────────────────
interface DealRow {
  id: string; name: string; vertical: Vertical; stage: Stage
  seller: string | null; sdr: string | null; solutioner: string | null
  tcv: number; channel: Channel | null; intro_date: string | null
  last_touch: string | null; next_step_due: string | null; next_step_owner: string | null
  propensity_base: number; propensity: number
  propensity_criteria: { label: string; met: boolean; delta: number }[]
  flags: Flag[]; latent_reason: string | null; partner_source: string | null
  next_meeting_date: string | null; service_line: string | null
  problem_space: string | null; monday_item_id: string | null
  relay_accounts: { name: string } | null
}
interface FieldRow {
  deal_id: string; key: string; value: string | null; quote: string | null
  source: string | null; owner: Owner; status: 'confirmed' | 'suggested' | 'empty'; confidence: number
}
interface ContactRow {
  id: string; deal_id: string; name: string; title: string | null; seniority: string | null
  business_group: string | null; met_in_person: boolean; warm_path: string | null
  provenance: Record<string, { source?: string; quote?: string; status?: string }>; position: number
}
interface TouchRow {
  id: string; deal_id: string; type: TouchType; title: string; detail: string | null
  who: string | null; occurred_on: string; channel: Channel | null; captured: 'auto' | 'manual'
}

const d = (s: string | null | undefined): string => (s ? s.slice(0, 10) : '')

function toField(r: FieldRow | undefined, owner: Owner): ExtractedField {
  if (!r) return { value: null, confidence: 0, source: null, quote: null, owner, status: 'empty' }
  return {
    value: r.value, confidence: Number(r.confidence), source: r.source,
    quote: r.quote, owner: r.owner, status: r.status,
  }
}

function contactField(c: ContactRow, key: 'title' | 'seniority' | 'business_group', value: string | null): ExtractedField {
  const p = c.provenance?.[key] ?? {}
  const status = (p.status as ExtractedField['status']) ?? (value ? 'confirmed' : 'empty')
  return { value, confidence: 0.7, source: p.source ?? null, quote: p.quote ?? null, owner: 'sales', status }
}

// ── Deals (assembled from 4 tables, joined client-side) ──────────────────────
async function fetchDeals(): Promise<Deal[]> {
  const [deals, fields, contacts, touches] = await Promise.all([
    supabase.from('deals').select('*, relay_accounts:accounts(name)'),
    supabase.from('deal_fields').select('*'),
    supabase.from('contacts').select('*').order('position'),
    supabase.from('touches').select('*').order('occurred_on', { ascending: false }),
  ])
  if (deals.error) throw deals.error
  if (fields.error) throw fields.error
  if (contacts.error) throw contacts.error
  if (touches.error) throw touches.error

  const fieldsByDeal = new Map<string, Record<string, FieldRow>>()
  for (const f of fields.data as FieldRow[]) {
    const m = fieldsByDeal.get(f.deal_id) ?? {}
    m[f.key] = f
    fieldsByDeal.set(f.deal_id, m)
  }
  const contactsByDeal = new Map<string, ContactRow[]>()
  for (const c of contacts.data as ContactRow[]) {
    const a = contactsByDeal.get(c.deal_id) ?? []
    a.push(c)
    contactsByDeal.set(c.deal_id, a)
  }
  const touchesByDeal = new Map<string, TouchRow[]>()
  for (const t of touches.data as TouchRow[]) {
    const a = touchesByDeal.get(t.deal_id) ?? []
    a.push(t)
    touchesByDeal.set(t.deal_id, a)
  }

  return (deals.data as DealRow[]).map((row): Deal => {
    const f = fieldsByDeal.get(row.id) ?? {}
    const contactList: Contact[] = (contactsByDeal.get(row.id) ?? []).map((c) => ({
      name: c.name,
      title: contactField(c, 'title', c.title),
      seniority: contactField(c, 'seniority', c.seniority),
      businessGroup: contactField(c, 'business_group', c.business_group),
      metInPerson: c.met_in_person,
      warmPath: c.warm_path ?? undefined,
    }))
    const touchList: Touch[] = (touchesByDeal.get(row.id) ?? []).map((t) => ({
      id: t.id, type: t.type, title: t.title, detail: t.detail ?? undefined,
      who: t.who ?? '', date: d(t.occurred_on), channel: t.channel ?? undefined, captured: t.captured,
    }))
    return {
      id: row.id, name: row.name, account: row.relay_accounts?.name ?? '—',
      vertical: row.vertical, stage: row.stage, seller: row.seller ?? '—',
      sdr: row.sdr ?? undefined, solutioner: row.solutioner ?? undefined,
      tcv: Number(row.tcv), channel: row.channel ?? 'Referral',
      introDate: d(row.intro_date), lastTouch: d(row.last_touch),
      nextStep: toField(f['next_step'], 'sales'),
      nextStepDue: row.next_step_due ? d(row.next_step_due) : undefined,
      nextStepOwner: row.next_step_owner ?? undefined,
      problemStatement: toField(f['problem_statement'], 'solutioning'),
      intent: toField(f['intent'], 'solutioning'),
      budget: toField(f['budget'], 'jd-sahana'),
      contacts: contactList,
      propensity: Number(row.propensity), propensityBase: Number(row.propensity_base),
      propensityCriteria: row.propensity_criteria ?? [],
      touches: touchList, flags: row.flags ?? [],
      latentReason: row.latent_reason ?? undefined, partnerSource: row.partner_source ?? undefined,
      nextMeetingDate: row.next_meeting_date ? d(row.next_meeting_date) : undefined,
      serviceLine: row.service_line ?? undefined, problemSpace: row.problem_space ?? undefined,
      mondayItemId: row.monday_item_id ?? undefined,
    }
  })
}

export function useDeals() {
  return useQuery({ queryKey: ['deals'], queryFn: fetchDeals })
}

export function useDeal(id: string | undefined) {
  const q = useDeals()
  return { ...q, deal: q.data?.find((x) => x.id === id) }
}

// ── Captures ─────────────────────────────────────────────────────────────────
interface CaptureRow {
  id: string; kind: 'transcript' | 'email' | 'manual'; source: string; title: string
  account_name: string | null; deal_id: string | null; who: string | null
  occurred_on: string; duration_min: number | null; summary: string | null
  proposed_next_step: string | null; proposed_stage_from: Stage | null
  proposed_stage_to: Stage | null; reviewed: boolean
  deal: { vertical: Vertical } | null; account: { vertical: Vertical } | null
}
interface SuggRow {
  id: string; capture_id: string; field: string; value: string | null; quote: string | null
  owner: Owner; status: 'pending' | 'accepted' | 'rejected'; position: number; confidence: number | null
}

async function fetchCaptures(): Promise<CaptureItem[]> {
  const [caps, suggs] = await Promise.all([
    supabase.from('captures').select('*, deal:deals(vertical), account:accounts(vertical)').order('occurred_on', { ascending: false }),
    supabase.from('capture_suggestions').select('*').order('position'),
  ])
  if (caps.error) throw caps.error
  if (suggs.error) throw suggs.error
  const byCap = new Map<string, SuggRow[]>()
  for (const s of suggs.data as SuggRow[]) {
    const a = byCap.get(s.capture_id) ?? []
    a.push(s)
    byCap.set(s.capture_id, a)
  }
  return (caps.data as CaptureRow[]).map((c): CaptureItem => ({
    id: c.id,
    kind: c.kind === 'manual' ? 'transcript' : c.kind,
    source: c.source,
    title: c.title,
    account: c.account_name ?? '—',
    dealId: c.deal_id ?? undefined,
    who: c.who ?? '',
    date: d(c.occurred_on),
    durationMin: c.duration_min ?? undefined,
    summary: c.summary ?? '',
    extracted: (byCap.get(c.id) ?? []).map((s) => ({
      id: s.id, field: s.field, value: s.value ?? '', quote: s.quote ?? '',
      owner: s.owner, status: s.status, confidence: Number(s.confidence ?? 0.9),
    })),
    proposedNextStep: c.proposed_next_step ?? '',
    proposedStageMove:
      c.proposed_stage_to && c.proposed_stage_from
        ? { from: c.proposed_stage_from, to: c.proposed_stage_to }
        : undefined,
    reviewed: c.reviewed,
    vertical: c.deal?.vertical ?? c.account?.vertical ?? undefined,
  }))
}

export function useCaptures() {
  return useQuery({ queryKey: ['captures'], queryFn: fetchCaptures })
}

// ── Warm paths ───────────────────────────────────────────────────────────────
async function fetchWarmPaths(): Promise<WarmPath[]> {
  const { data, error } = await supabase.from('warm_paths').select('*')
  if (error) throw error
  return (data as Array<Record<string, unknown>>).map((w) => ({
    target: w.target as string,
    targetTitle: (w.target_title as string) ?? '',
    account: (w.account_name as string) ?? 'Multiple',
    via: (w.via as string) ?? '',
    relationship: (w.relationship as string) ?? '',
    strength: (w.strength as WarmPath['strength']) ?? 'medium',
    dealId: (w.deal_id as string) ?? undefined,
  }))
}

export function useWarmPaths() {
  return useQuery({ queryKey: ['warm_paths'], queryFn: fetchWarmPaths })
}

// ── Pre-call briefs ──────────────────────────────────────────────────────────
async function fetchBriefs(): Promise<Record<string, PrecallBrief>> {
  const { data, error } = await supabase.from('precall_briefs').select('*')
  if (error) throw error
  const out: Record<string, PrecallBrief> = {}
  for (const r of data as Array<Record<string, unknown>>) {
    out[r.deal_id as string] = {
      dealId: r.deal_id as string,
      meetingDate: r.meeting_date ? String(r.meeting_date).slice(0, 10) : undefined,
      companySummary: (r.company_summary as string) ?? undefined,
      companySignals: (r.company_signals as PrecallBrief['companySignals']) ?? [],
      prospectSummary: (r.prospect_summary as string) ?? undefined,
      angle: (r.angle as string) ?? undefined,
      smartQuestions: (r.smart_questions as PrecallBrief['smartQuestions']) ?? [],
      watchouts: (r.watchouts as string[]) ?? [],
      sources: (r.sources as PrecallBrief['sources']) ?? [],
      generatedAt: (r.generated_at as string) ?? undefined,
    }
  }
  return out
}

export function usePrecallBriefs() {
  return useQuery({ queryKey: ['precall_briefs'], queryFn: fetchBriefs })
}

// ── Mutations ────────────────────────────────────────────────────────────────
function useInvalidate() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['deals'] })
    qc.invalidateQueries({ queryKey: ['captures'] })
    qc.invalidateQueries({ queryKey: ['warm_paths'] })
  }
}

// Confirm a Relay-drafted deal field (next_step / problem_statement / intent / budget)
export function useAcceptField() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async ({ dealId, key }: { dealId: string; key: string }) => {
      const { error } = await supabase
        .from('deal_fields')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('deal_id', dealId)
        .eq('key', key)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

// Review a single suggestion: accept / edit-and-accept / reject — persisted.
// When accepting a core field on a deal-linked capture, apply it to the deal too.
const CORE_LABEL: Record<string, string> = {
  'Problem statement': 'problem_statement',
  'Intent': 'intent',
  'Fund timeline / budget': 'budget',
  'Budget signal': 'budget',
}

export function useReviewSuggestion() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (input: {
      id: string
      status: 'accepted' | 'rejected'
      value: string
      field: string
      owner: Owner
      quote?: string
      dealId?: string
      source?: string
    }) => {
      const { error } = await supabase
        .from('capture_suggestions')
        .update({ status: input.status, value: input.value })
        .eq('id', input.id)
      if (error) throw error

      if (input.status === 'accepted' && input.dealId) {
        const key = CORE_LABEL[input.field]
        if (key) {
          await supabase.from('deal_fields').upsert(
            {
              deal_id: input.dealId, key, value: input.value, quote: input.quote ?? null,
              source: input.source ?? 'GoodMeetings', owner: input.owner,
              status: 'confirmed', confidence: 0.9, updated_at: new Date().toISOString(),
            },
            { onConflict: 'deal_id,key' },
          )
        }
      }
    },
    onSuccess: invalidate,
  })
}

// Accept a whole capture: confirm all suggestions, apply the drafted next step +
// stage move to the deal, log a touch, and mark the capture reviewed.
export function useAcceptCapture() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (cap: CaptureItem) => {
      await supabase
        .from('capture_suggestions')
        .update({ status: 'accepted' })
        .eq('capture_id', cap.id)

      if (cap.dealId) {
        if (cap.proposedNextStep) {
          await supabase.from('deal_fields').upsert(
            {
              deal_id: cap.dealId, key: 'next_step', value: cap.proposedNextStep,
              source: `${cap.source} · ${cap.title}`, owner: 'sales', status: 'confirmed',
              confidence: 0.9, updated_at: new Date().toISOString(),
            },
            { onConflict: 'deal_id,key' },
          )
        }
        const dealPatch: Record<string, unknown> = { last_touch: new Date().toISOString() }
        if (cap.proposedStageMove) dealPatch.stage = cap.proposedStageMove.to
        await supabase.from('deals').update(dealPatch).eq('id', cap.dealId)

        await supabase.from('touches').insert({
          deal_id: cap.dealId,
          type: cap.kind === 'email' ? 'email' : 'call',
          title: `Accepted from Capture · ${cap.title}`,
          who: cap.who, occurred_on: cap.date, captured: 'auto',
        })
      }

      const { error } = await supabase.from('captures').update({ reviewed: true }).eq('id', cap.id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

// Move a deal to the latent pool — requires a reason (the sign-off gate).
export function useMoveToLatent() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async ({ dealId, reason }: { dealId: string; reason: string }) => {
      if (!reason.trim()) throw new Error('A reason is required before a deal can go latent.')
      const { error } = await supabase
        .from('deals')
        .update({ stage: 'Latent Pool', latent_reason: reason.trim() })
        .eq('id', dealId)
      if (error) throw error
      await supabase.from('touches').insert({
        deal_id: dealId, type: 'stage', title: 'Moved to latent pool',
        detail: reason.trim(), who: 'You', occurred_on: new Date().toISOString().slice(0, 10),
        captured: 'manual',
      })
    },
    onSuccess: invalidate,
  })
}

// Revive a latent deal back into the funnel.
export function useReviveDeal() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async ({ dealId }: { dealId: string }) => {
      const { error } = await supabase
        .from('deals')
        .update({ stage: 'Qualification', latent_reason: null })
        .eq('id', dealId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

// Log a 1-1 call: send raw notes to relay-extract, then persist a capture +
// its suggestions so it lands in the accept queue like any ambient capture.
export interface LogCallInput {
  rawText: string
  title: string
  dealId?: string
  accountName?: string
}
export interface ExtractResult {
  summary: string
  proposed_next_step: string
  proposed_stage_to: string | null
  suggestions: { field: string; value: string; quote: string | null; owner: Owner }[]
}

export function useLogCall() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (input: LogCallInput): Promise<{ captureId: string; extracted: number }> => {
      const { data: fnData, error: fnError } = await supabase.functions.invoke<ExtractResult>(
        'relay-extract',
        { body: { raw_text: input.rawText, deal_context: input.title } },
      )
      if (fnError) throw new Error(fnError.message)
      if (!fnData) throw new Error('No response from extractor')

      const captureId = `cap-manual-${Date.now()}`
      const { error: capErr } = await supabase.from('captures').insert({
        id: captureId, kind: 'manual', source: 'Manual', title: input.title,
        deal_id: input.dealId ?? null, account_name: input.accountName ?? null,
        who: 'You', occurred_on: new Date().toISOString().slice(0, 10),
        summary: fnData.summary, raw_text: input.rawText,
        proposed_next_step: fnData.proposed_next_step,
        proposed_stage_to: fnData.proposed_stage_to as Stage | null,
        reviewed: false,
      })
      if (capErr) throw capErr

      if (fnData.suggestions.length) {
        const { error: sErr } = await supabase.from('capture_suggestions').insert(
          fnData.suggestions.map((s, i) => ({
            capture_id: captureId, field: s.field, value: s.value,
            quote: s.quote, owner: s.owner, status: 'pending', position: i,
          })),
        )
        if (sErr) throw sErr
      }
      return { captureId, extracted: fnData.suggestions.length }
    },
    onSuccess: invalidate,
  })
}
