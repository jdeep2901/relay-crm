import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Mic, Mail, Check, Sparkles, ArrowRight, CircleAlert, Clock, CheckCheck, Loader2,
  Pencil, X, RotateCcw, ShieldCheck, Search as SearchIcon, Link2, Unlink,
  User, Building2, HelpCircle,
} from 'lucide-react'
import { useCaptures, useAcceptCapture, useReviewSuggestion, useReassignCapture, useDeals } from '../lib/queries'
import { shortDate } from '../lib/format'
import { Card, Pill, Loading, ErrorState } from '../components/ui'
import type { CaptureItem, Owner, Vertical } from '../data/types'

const VERTS: (Vertical | 'All' | 'Won')[] = ['All', 'Pharma', 'CPG', 'Retail', 'Tech', 'Won']
const STAGES = ['All stages', 'Intro', 'Qualification', 'Capability', 'Problem Scoping', 'Proposal', 'Contracting', 'Won', 'Latent Pool'] as const

const OWNER_TONE: Record<Owner, 'accent' | 'green' | 'amber'> = { sales: 'accent', solutioning: 'green', 'jd-sahana': 'amber' }
const OWNER_LABEL: Record<Owner, string> = { sales: 'sales', solutioning: 'solutioning', 'jd-sahana': 'JD + Sahana' }
const HI = 0.75
type OwnerFilter = 'all' | Owner

export function Capture() {
  const { data: captures, isLoading, error } = useCaptures()
  const location = useLocation()
  const focusId = (location.state as { focus?: string } | null)?.focus
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [vert, setVert] = useState<Vertical | 'All' | 'Won'>('All')
  const [stage, setStage] = useState<string>('All stages')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!captures?.length) return
    setSelectedId((cur) => {
      if (focusId && captures.some((c) => c.id === focusId)) return focusId
      if (cur && captures.some((c) => c.id === cur)) return cur
      return captures.find((c) => !c.reviewed)?.id ?? captures[0].id
    })
  }, [captures, focusId])

  if (isLoading) return <Loading />
  if (error) return <ErrorState error={error} />
  if (!captures?.length) return <div className="text-secondary text-[13px]">No captures yet. Use “Log a call” to add one.</div>

  const matches = (c: CaptureItem, v: Vertical | 'All' | 'Won') =>
    v === 'All' ? true : v === 'Won' ? c.dealStage === 'Won' : c.vertical === v && c.dealStage !== 'Won'
  const stageMatch = (c: CaptureItem) => stage === 'All stages' || c.dealStage === stage
  const q = query.trim().toLowerCase()
  const queryMatch = (c: CaptureItem) =>
    !q ||
    [c.title, c.account, c.dealAccount, c.dealContact, c.who, c.summary]
      .some((s) => s && s.toLowerCase().includes(q))
  const filtered = captures.filter((c) => matches(c, vert) && stageMatch(c) && queryMatch(c))
  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0]
  const countFor = (v: Vertical | 'All' | 'Won') => captures.filter((c) => matches(c, v)).length

  return (
    <div>
      <h1 className="text-[20px] mb-1">Capture</h1>
      <p className="text-[13px] text-secondary mb-4">
        Every call lands here already tagged. Review each field — accept, edit, or dismiss. High-confidence tags are pre-accepted; the rest need a human.
      </p>

      {/* Industry + stage filters */}
      <div className="flex items-center gap-1 mb-3 hairline-b pb-2">
        {VERTS.map((v) => (
          <button
            key={v}
            onClick={() => setVert(v)}
            className={`px-2.5 py-1 text-[12px] rounded-md transition-colors inline-flex items-center gap-1.5 ${vert === v ? 'text-primary font-medium' : 'text-secondary hover:bg-hover'}`}
            style={vert === v ? { borderBottom: '1.5px solid var(--text-primary)', borderRadius: 0 } : {}}
          >
            {v}
            <span className="num text-[10px] text-tertiary">{countFor(v)}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 hairline rounded-md px-2 py-1 bg-card">
          <SearchIcon size={12} className="text-tertiary shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search threads…"
            className="w-40 bg-transparent text-[12px] outline-none placeholder:text-tertiary"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-tertiary hover:text-secondary text-[11px]">✕</button>
          )}
        </div>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="hairline rounded-md bg-card text-[12px] px-2 py-1 text-secondary outline-none"
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>{s === 'All stages' ? 'All stages' : `Stage: ${s}`}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-[300px_1fr] gap-4">
        <div className="flex flex-col gap-2 max-h-[74vh] overflow-y-auto no-scrollbar pr-1">
          {filtered.map((c) => (
            <InboxRow key={c.id} item={c} active={c.id === selected?.id} onClick={() => setSelectedId(c.id)} />
          ))}
          {filtered.length === 0 && <div className="text-[12px] text-tertiary py-3">No calls in this industry.</div>}
        </div>
        {selected ? <ReviewPanel key={selected.id} item={selected} /> : <div />}
      </div>
    </div>
  )
}

function InboxRow({ item, active, onClick }: { item: CaptureItem; active: boolean; onClick: () => void }) {
  const Icon = item.source === 'Manual' ? Mic : item.source === 'GoodMeetings' ? Mic : item.kind === 'transcript' ? Mic : Mail
  const pending = item.extracted.filter((f) => f.status === 'pending').length
  return (
    <button onClick={onClick} className={`text-left rounded-lg p-3 hairline transition-colors ${active ? 'bg-surface' : 'bg-card hover:bg-hover'}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={13} className="text-accent shrink-0" />
        <span className="text-[11px] text-secondary truncate">{item.source}</span>
        {item.dealStage === 'Won'
          ? <Pill tone="green">Won</Pill>
          : item.vertical && <Pill tone="neutral">{item.vertical}</Pill>}
        {!item.dealId && <span className="text-[10px] text-tertiary">· no deal</span>}
        <span className="text-[11px] text-tertiary ml-auto shrink-0">{shortDate(item.date)}</span>
      </div>
      <div className="text-[13px] font-medium leading-snug truncate">{item.title}</div>
      {item.dealId ? (
        <div className="text-[11px] text-secondary truncate mt-0.5">
          → {item.dealAccount ?? item.account}{item.dealContact ? ` · ${item.dealContact}` : ''}
          {item.meetingTotal ? <span className="text-accent"> · call {item.meetingSeq}/{item.meetingTotal}</span> : null}
        </div>
      ) : (
        <div className="text-[11px] text-tertiary mt-0.5">not linked to a deal</div>
      )}
      <div className="flex items-center gap-2 mt-1.5">
        <span className="num text-[11px] text-tertiary">{item.extracted.length} fields</span>
        {pending > 0
          ? <Pill tone="amber">{pending} to review</Pill>
          : <Pill tone="green" icon={<Check size={10} />}>reviewed</Pill>}
      </div>
    </button>
  )
}

function ReviewPanel({ item }: { item: CaptureItem }) {
  const navigate = useNavigate()
  const acceptCapture = useAcceptCapture()
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all')
  const [onlyUnconfirmed, setOnlyUnconfirmed] = useState(false)

  const counts = useMemo(() => {
    const total = item.extracted.length
    const pending = item.extracted.filter((f) => f.status === 'pending').length
    return { total, pending, done: total - pending }
  }, [item.extracted])

  const needsConfirm = (f: CaptureItem['extracted'][number]) =>
    f.speakerSide === 'mathco' || f.speakerSide === 'unclear' || f.unconfirmed
  const shown = item.extracted
    .filter((f) => ownerFilter === 'all' || f.owner === ownerFilter)
    .filter((f) => !onlyUnconfirmed || needsConfirm(f))
  const unconfirmedCount = item.extracted.filter(needsConfirm).length
  const OWNERS: { k: OwnerFilter; label: string }[] = [
    { k: 'all', label: 'All' }, { k: 'solutioning', label: 'Solutioning' },
    { k: 'sales', label: 'Sales' }, { k: 'jd-sahana', label: 'JD + Sahana' },
  ]

  return (
    <Card className="p-5 self-start fade-up">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[15px] font-medium">{item.title}</div>
          <div className="text-[12px] text-tertiary mt-0.5">
            {item.who} · {shortDate(item.meetingDate ?? item.date)}
          </div>
          <DealLink item={item} />
        </div>
        {counts.pending === 0 ? (
          <Pill tone="green" icon={<CheckCheck size={12} />}>all reviewed</Pill>
        ) : (
          <button
            onClick={() => acceptCapture.mutate(item)}
            disabled={acceptCapture.isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent text-white px-3 py-1.5 text-[12px] hover:brightness-110 disabled:opacity-60"
          >
            {acceptCapture.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Accept all remaining
          </button>
        )}
      </div>

      {item.summary && (
        <div className="rounded-md bg-surface p-3 mb-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={12} className="text-accent" />
            <span className="text-[11px] text-secondary">Relay summary</span>
          </div>
          <p className="text-[13px] leading-relaxed text-primary">{item.summary}</p>
        </div>
      )}

      {/* Owner filter + progress */}
      <div className="flex items-center gap-3 mb-2 hairline-b pb-2">
        <div className="flex items-center gap-1">
          {OWNERS.map((o) => (
            <button
              key={o.k}
              onClick={() => setOwnerFilter(o.k)}
              className={`px-2 py-0.5 text-[11px] rounded-md transition-colors ${ownerFilter === o.k ? 'text-primary font-medium bg-surface' : 'text-secondary hover:bg-hover'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {unconfirmedCount > 0 && (
          <button
            onClick={() => setOnlyUnconfirmed((v) => !v)}
            className={`px-2 py-0.5 text-[11px] rounded-md inline-flex items-center gap-1 transition-colors ${
              onlyUnconfirmed ? 'bg-[var(--status-amber-bg)] text-amber-text font-medium' : 'text-secondary hover:bg-hover'
            }`}
            title="Fields we said, or where the speaker is unclear — confirm or dismiss"
          >
            <Building2 size={10} /> Needs confirming
            <span className="num">{unconfirmedCount}</span>
          </button>
        )}
        <span className="ml-auto text-[11px] text-tertiary num">{counts.done}/{counts.total} reviewed</span>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {shown.map((f) => (
          <SuggestionRow key={f.id} f={f} item={item} />
        ))}
        {shown.length === 0 && <div className="text-[12px] text-tertiary py-3">No fields for this owner.</div>}
      </div>

      {item.proposedNextStep && (
        <div className="rounded-md hairline p-3 mb-2 bg-card">
          <div className="flex items-center gap-1.5 text-[11px] text-secondary mb-1"><ArrowRight size={12} className="text-accent" /> Proposed next step</div>
          <div className="text-[13px] text-primary">{item.proposedNextStep}</div>
        </div>
      )}

      {item.proposedStageMove && (
        <div className="rounded-md hairline p-3 flex items-center gap-2 text-[13px] bg-card">
          <Clock size={13} className="text-accent" /> Advance stage
          <span className="text-secondary">{item.proposedStageMove.from}</span>
          <ArrowRight size={12} className="text-tertiary" />
          <span className="font-medium">{item.proposedStageMove.to}</span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-tertiary">
          <ShieldCheck size={12} /> Accept / edit persists to Relay. Nothing is written back to Monday.
        </div>
        {item.dealId && (
          <button onClick={() => navigate(`/deal/${item.dealId}`)} className="text-[12px] text-accent hover:underline">Open deal →</button>
        )}
      </div>
    </Card>
  )
}

// Which deal this single call belongs to — reassignable, so a multi-call thread
// can be split across the several deals an account really has.
function DealLink({ item }: { item: CaptureItem }) {
  const { data: deals } = useDeals()
  const reassign = useReassignCapture()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  const options = useMemo(() => {
    if (!deals) return []
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const acct = norm(item.dealAccount ?? item.account ?? '')
    const scored = deals.map((d) => ({
      d,
      sibling: acct.length > 3 && (norm(d.account).includes(acct) || acct.includes(norm(d.account))),
    }))
    const term = q.trim().toLowerCase()
    return scored
      .filter(({ d }) => !term || `${d.account} ${d.name} ${d.stage}`.toLowerCase().includes(term))
      .sort((a, b) => (a.sibling === b.sibling ? a.d.account.localeCompare(b.d.account) : a.sibling ? -1 : 1))
      .slice(0, 40)
  }, [deals, q, item.dealAccount, item.account])

  const move = async (dealId: string | null) => {
    await reassign.mutateAsync({ captureId: item.id, dealId })
    setOpen(false); setQ('')
  }

  return (
    <div className="mt-1 text-[12px]">
      <div className="flex items-center gap-1.5 flex-wrap">
        {item.dealId ? (
          <>
            <Link2 size={11} className="text-tertiary" />
            <span className="text-secondary">{item.dealAccount ?? item.account}</span>
            {item.dealContact && <span className="text-tertiary">— {item.dealContact}</span>}
            {item.meetingTotal ? <span className="text-accent">· call {item.meetingSeq} of {item.meetingTotal}</span> : null}
          </>
        ) : (
          <span className="text-amber-text">Not linked to a deal</span>
        )}
        <button onClick={() => setOpen((o) => !o)} className="text-accent hover:underline ml-1">
          {item.dealId ? 'Change deal' : 'Link to deal'}
        </button>
        {item.dealId && (
          <button onClick={() => move(null)} className="text-tertiary hover:text-secondary inline-flex items-center gap-0.5" title="Unlink from deal">
            <Unlink size={10} /> unlink
          </button>
        )}
      </div>

      {open && (
        <div className="mt-2 hairline rounded-md bg-card p-2 w-[420px]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <SearchIcon size={12} className="text-tertiary" />
            <input
              autoFocus value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search deals by account, contact, stage…"
              className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-tertiary"
            />
            <button onClick={() => setOpen(false)} className="text-tertiary hover:text-secondary"><X size={12} /></button>
          </div>
          <div className="max-h-56 overflow-y-auto no-scrollbar flex flex-col">
            {options.map(({ d, sibling }) => (
              <button
                key={d.id}
                onClick={() => move(d.id)}
                disabled={reassign.isPending}
                className={`text-left px-2 py-1.5 rounded hover:bg-hover flex items-center gap-2 ${d.id === item.dealId ? 'bg-surface' : ''}`}
              >
                <span className="text-[12px] font-medium truncate max-w-[150px]">{d.account}</span>
                <span className="text-[11px] text-tertiary truncate flex-1">{d.name}</span>
                {sibling && <Pill tone="accent">same account</Pill>}
                <span className="text-[10px] text-secondary shrink-0">{d.stage}</span>
              </button>
            ))}
            {options.length === 0 && <div className="text-[11px] text-tertiary px-2 py-2">No matching deals.</div>}
          </div>
        </div>
      )}
    </div>
  )
}

function SuggestionRow({ f, item }: { f: CaptureItem['extracted'][number]; item: CaptureItem }) {
  const review = useReviewSuggestion()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(f.value)

  const high = f.confidence >= HI
  const base = {
    id: f.id, field: f.field, owner: f.owner, quote: f.quote,
    dealId: item.dealId, source: `${item.source} · ${item.account} · ${item.date}`,
  }
  const accept = (value: string) => review.mutate({ ...base, status: 'accepted', value })
  const reject = () => review.mutate({ ...base, status: 'rejected', value: f.value })

  const bg = f.status === 'accepted' ? 'bg-[var(--bg-hover)]' : f.status === 'rejected' ? 'bg-surface opacity-60' : 'bg-card'

  return (
    <div className={`rounded-md hairline p-3 transition-colors ${bg}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] text-secondary shrink-0">{f.field}</span>
          <Pill tone={OWNER_TONE[f.owner]}>{OWNER_LABEL[f.owner]}</Pill>
          {/* who said it — the attribution that decides whether this is client fact */}
          {f.speakerSide === 'client' ? (
            <Pill tone="green" icon={<User size={9} />}>
              client{f.speaker ? ` · ${f.speaker.split(',')[0].split(' ').slice(0, 2).join(' ')}` : ''}
            </Pill>
          ) : f.speakerSide === 'mathco' ? (
            <Pill tone="amber" icon={<Building2 size={9} />}>
              MathCo said this{f.speaker ? ` · ${f.speaker.split(' ')[0]}` : ''}
            </Pill>
          ) : f.speakerSide === 'unclear' ? (
            <Pill tone="neutral" icon={<HelpCircle size={9} />}>unclear speaker</Pill>
          ) : null}
          {f.unconfirmed && <Pill tone="red">unconfirmed</Pill>}
          {/* confidence indicator */}
          {high
            ? <Pill tone="green"><span className="num">{Math.round(f.confidence * 100)}%</span></Pill>
            : <Pill tone="amber"><span className="num">{Math.round(f.confidence * 100)}%</span></Pill>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {review.isPending ? (
            <Loader2 size={13} className="animate-spin text-tertiary" />
          ) : f.status === 'accepted' ? (
            <>
              <span className="inline-flex items-center gap-1 text-[11px] text-green-text"><Check size={12} /> accepted</span>
              <button onClick={() => { setDraft(f.value); setEditing(true) }} className="rounded-md hairline px-1.5 py-1 text-secondary hover:bg-hover" title="Edit"><Pencil size={11} /></button>
            </>
          ) : f.status === 'rejected' ? (
            <button onClick={() => accept(f.value)} className="inline-flex items-center gap-1 text-[11px] text-secondary hover:text-primary"><RotateCcw size={11} /> restore</button>
          ) : (
            <>
              <button onClick={() => accept(f.value)} className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-soft)] text-accent px-2 py-0.5 text-[11px] hover:brightness-95"><Check size={11} /> Accept</button>
              <button onClick={() => { setDraft(f.value); setEditing(true) }} className="rounded-md hairline px-1.5 py-1 text-secondary hover:bg-hover" title="Edit"><Pencil size={11} /></button>
              <button onClick={reject} className="rounded-md hairline px-1.5 py-1 text-secondary hover:bg-hover" title="Dismiss"><X size={11} /></button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="mt-1">
          <textarea
            value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} autoFocus
            className="w-full hairline rounded-md p-2 text-[13px] bg-card outline-none resize-none"
          />
          <div className="flex items-center gap-2 mt-1.5">
            <button onClick={() => { accept(draft); setEditing(false) }} className="inline-flex items-center gap-1 rounded-md bg-accent text-white px-2.5 py-1 text-[11px] hover:brightness-110"><Check size={11} /> Save &amp; accept</button>
            <button onClick={() => setEditing(false)} className="text-[11px] text-secondary hover:text-primary">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className={`text-[13px] ${f.status === 'rejected' ? 'line-through text-tertiary' : 'text-primary'}`}>{f.value}</div>
          {f.quote && <div className="mt-1 text-[12px] text-secondary italic">“{f.quote.replace(/^“|”$/g, '')}”</div>}
        </>
      )}
    </div>
  )
}
