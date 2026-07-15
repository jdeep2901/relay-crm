import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Mic, Mail, Check, Sparkles, ArrowRight, CircleAlert, Clock, CheckCheck, Loader2,
  Pencil, X, RotateCcw, ShieldCheck,
} from 'lucide-react'
import { useCaptures, useAcceptCapture, useReviewSuggestion } from '../lib/queries'
import { shortDate } from '../lib/format'
import { Card, Pill, Loading, ErrorState } from '../components/ui'
import type { CaptureItem, Owner, Vertical } from '../data/types'

const VERTS: (Vertical | 'All')[] = ['All', 'Pharma', 'CPG', 'Retail', 'Tech']

const OWNER_TONE: Record<Owner, 'accent' | 'green' | 'amber'> = { sales: 'accent', solutioning: 'green', 'jd-sahana': 'amber' }
const OWNER_LABEL: Record<Owner, string> = { sales: 'sales', solutioning: 'solutioning', 'jd-sahana': 'JD + Sahana' }
const HI = 0.75
type OwnerFilter = 'all' | Owner

export function Capture() {
  const { data: captures, isLoading, error } = useCaptures()
  const location = useLocation()
  const focusId = (location.state as { focus?: string } | null)?.focus
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [vert, setVert] = useState<Vertical | 'All'>('All')

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

  const filtered = vert === 'All' ? captures : captures.filter((c) => c.vertical === vert)
  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0]
  const countFor = (v: Vertical | 'All') => (v === 'All' ? captures.length : captures.filter((c) => c.vertical === v).length)

  return (
    <div>
      <h1 className="text-[20px] mb-1">Capture</h1>
      <p className="text-[13px] text-secondary mb-4">
        Every call lands here already tagged. Review each field — accept, edit, or dismiss. High-confidence tags are pre-accepted; the rest need a human.
      </p>

      {/* Industry filter */}
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
        {item.vertical && <Pill tone="neutral">{item.vertical}</Pill>}
        {!item.dealId && <span className="text-[10px] text-tertiary">· no deal</span>}
        <span className="text-[11px] text-tertiary ml-auto shrink-0">{shortDate(item.date)}</span>
      </div>
      <div className="text-[13px] font-medium leading-snug truncate">{item.title}</div>
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

  const counts = useMemo(() => {
    const total = item.extracted.length
    const pending = item.extracted.filter((f) => f.status === 'pending').length
    return { total, pending, done: total - pending }
  }, [item.extracted])

  const shown = item.extracted.filter((f) => ownerFilter === 'all' || f.owner === ownerFilter)
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
            {item.who} · {shortDate(item.date)} · {item.account}
            {!item.dealId && <span className="text-amber-text"> · not linked to a deal</span>}
          </div>
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
          {/* confidence indicator */}
          {high
            ? <Pill tone="green"><span className="num">{Math.round(f.confidence * 100)}%</span> high</Pill>
            : <Pill tone="amber"><span className="num">{Math.round(f.confidence * 100)}%</span> review</Pill>}
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
