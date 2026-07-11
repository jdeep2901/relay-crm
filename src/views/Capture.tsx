import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mic, Mail, Check, Sparkles, ArrowRight, CircleAlert, Clock, CheckCheck, Loader2 } from 'lucide-react'
import { useCaptures, useAcceptCapture } from '../lib/queries'
import { shortDate } from '../lib/format'
import { Card, Pill, Loading, ErrorState } from '../components/ui'
import type { CaptureItem, Owner } from '../data/types'

const OWNER_TONE: Record<Owner, 'accent' | 'green' | 'amber'> = { sales: 'accent', solutioning: 'green', 'jd-sahana': 'amber' }
const OWNER_LABEL: Record<Owner, string> = { sales: 'sales', solutioning: 'solutioning', 'jd-sahana': 'JD + Sahana' }

export function Capture() {
  const { data: captures, isLoading, error } = useCaptures()
  const location = useLocation()
  const focusId = (location.state as { focus?: string } | null)?.focus
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)

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

  const selected = captures.find((c) => c.id === selectedId) ?? captures[0]

  return (
    <div>
      <h1 className="text-[20px] mb-1">Capture</h1>
      <p className="text-[13px] text-secondary mb-5">
        Every Granola call, synced email, and logged 1-1 lands here already structured. You review and accept — Relay did the typing.
      </p>

      <div className="grid grid-cols-[300px_1fr] gap-4">
        <div className="flex flex-col gap-2">
          {captures.map((c) => (
            <InboxRow key={c.id} item={c} active={c.id === selected.id} onClick={() => setSelectedId(c.id)} />
          ))}
        </div>
        <ReviewPanel key={selected.id} item={selected} />
      </div>
    </div>
  )
}

function InboxRow({ item, active, onClick }: { item: CaptureItem; active: boolean; onClick: () => void }) {
  const Icon = item.source === 'Manual' ? Mic : item.kind === 'transcript' ? Mic : Mail
  return (
    <button onClick={onClick} className={`text-left rounded-lg p-3 hairline transition-colors ${active ? 'bg-surface' : 'bg-card hover:bg-hover'}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={13} className="text-accent shrink-0" />
        <span className="text-[11px] text-secondary">{item.source}</span>
        <span className="text-[11px] text-tertiary ml-auto">{shortDate(item.date)}</span>
      </div>
      <div className="text-[13px] font-medium leading-snug">{item.title}</div>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="num text-[11px] text-tertiary">{item.extracted.length} fields</span>
        {item.durationMin ? <span className="text-[11px] text-tertiary">· {item.durationMin}m</span> : null}
        {item.reviewed ? <Pill tone="green" icon={<Check size={10} />}>synced</Pill> : <Pill tone="accent">new</Pill>}
      </div>
    </button>
  )
}

function ReviewPanel({ item }: { item: CaptureItem }) {
  const navigate = useNavigate()
  const acceptCapture = useAcceptCapture()
  const [accepted, setAccepted] = useState<Record<number, boolean>>({})

  const synced = item.reviewed
  const acceptedCount = synced ? item.extracted.length : Object.values(accepted).filter(Boolean).length

  function acceptAll() {
    const all: Record<number, boolean> = {}
    item.extracted.forEach((_, i) => (all[i] = true))
    setAccepted(all)
    acceptCapture.mutate(item)
  }

  return (
    <Card className="p-5 self-start fade-up">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[15px] font-medium">{item.title}</div>
          <div className="text-[12px] text-tertiary mt-0.5">
            {item.who} · {shortDate(item.date)} {item.durationMin ? `· ${item.durationMin} min` : ''} · {item.account}
          </div>
        </div>
        {synced ? (
          <Pill tone="green" icon={<CheckCheck size={12} />}>synced to CRM</Pill>
        ) : (
          <button
            onClick={acceptAll}
            disabled={acceptCapture.isPending}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent text-white px-3 py-1.5 text-[12px] hover:brightness-110 disabled:opacity-60"
          >
            {acceptCapture.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Accept all
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

      <div className="text-[11px] text-secondary mb-2">Extracted fields — accept to write to CRM</div>
      <div className="flex flex-col gap-2 mb-4">
        {item.extracted.map((f, i) => {
          const isAccepted = synced || accepted[i]
          return (
            <div key={i} className={`rounded-md hairline p-3 transition-colors ${isAccepted ? 'bg-[var(--bg-hover)]' : 'bg-card'}`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-secondary">{f.field}</span>
                  <Pill tone={OWNER_TONE[f.owner]}>{OWNER_LABEL[f.owner]}</Pill>
                </div>
                {isAccepted ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-green-text"><Check size={12} /> accepted</span>
                ) : (
                  <button
                    onClick={() => setAccepted((a) => ({ ...a, [i]: true }))}
                    className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-soft)] text-accent px-2 py-0.5 text-[11px] hover:brightness-95"
                  >
                    <Check size={11} /> Accept
                  </button>
                )}
              </div>
              <div className="text-[13px] text-primary">{f.value}</div>
              {f.quote && <div className="mt-1 text-[12px] text-secondary italic">“{f.quote.replace(/^“|”$/g, '')}”</div>}
            </div>
          )
        })}
      </div>

      {item.proposedNextStep && (
        <div className={`rounded-md hairline p-3 mb-2 ${synced ? 'bg-[var(--bg-hover)]' : 'bg-card'}`}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 text-[11px] text-secondary"><ArrowRight size={12} className="text-accent" /> Proposed next step</div>
            {synced && <span className="inline-flex items-center gap-1 text-[11px] text-green-text"><Check size={12} /> set</span>}
          </div>
          <div className="text-[13px] text-primary">{item.proposedNextStep}</div>
        </div>
      )}

      {item.proposedStageMove && (
        <div className={`rounded-md hairline p-3 flex items-center justify-between ${synced ? 'bg-[var(--bg-hover)]' : 'bg-card'}`}>
          <div className="flex items-center gap-2 text-[13px]">
            <Clock size={13} className="text-accent" /> Advance stage
            <span className="text-secondary">{item.proposedStageMove.from}</span>
            <ArrowRight size={12} className="text-tertiary" />
            <span className="font-medium">{item.proposedStageMove.to}</span>
          </div>
          {synced && <span className="inline-flex items-center gap-1 text-[11px] text-green-text"><Check size={12} /> moved</span>}
        </div>
      )}

      {acceptCapture.isError && (
        <div className="mt-3 text-[12px] text-red-text bg-red-bg rounded-md px-3 py-2">{(acceptCapture.error as Error).message}</div>
      )}

      {synced ? (
        <div className="mt-4 flex items-center justify-between rounded-md bg-green-bg px-3 py-2.5 fade-up">
          <div className="flex items-center gap-2 text-[12px] text-green-text">
            <CheckCheck size={14} /> Record synced. Cortex columns are hygiene-high — no manual entry.
          </div>
          {item.dealId && (
            <button onClick={() => navigate(`/deal/${item.dealId}`)} className="text-[12px] text-green-text underline">Open deal</button>
          )}
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-tertiary">
          <CircleAlert size={12} /> Nothing is written until you accept. Relay never silently edits the record.
          {acceptedCount > 0 && ` · ${acceptedCount}/${item.extracted.length} staged`}
        </div>
      )}
    </Card>
  )
}
