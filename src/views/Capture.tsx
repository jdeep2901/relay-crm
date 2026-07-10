import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, Mail, Check, Sparkles, ArrowRight, CircleAlert, Clock, CheckCheck } from 'lucide-react'
import { CAPTURE } from '../data/mock'
import { shortDate } from '../lib/format'
import { Card, Pill } from '../components/ui'
import type { CaptureItem, Owner } from '../data/types'

const OWNER_TONE: Record<Owner, 'accent' | 'green' | 'amber'> = {
  sales: 'accent',
  solutioning: 'green',
  'jd-sahana': 'amber',
}
const OWNER_LABEL: Record<Owner, string> = { sales: 'sales', solutioning: 'solutioning', 'jd-sahana': 'JD + Sahana' }

export function Capture() {
  const [selectedId, setSelectedId] = useState(CAPTURE[0]?.id)
  const selected = CAPTURE.find((c) => c.id === selectedId)!

  return (
    <div>
      <h1 className="text-[20px] mb-1">Capture</h1>
      <p className="text-[13px] text-secondary mb-5">
        Every Granola call and synced email lands here already structured. You review and accept — Relay did the typing.
      </p>

      <div className="grid grid-cols-[300px_1fr] gap-4">
        {/* Inbox list */}
        <div className="flex flex-col gap-2">
          {CAPTURE.map((c) => (
            <InboxRow key={c.id} item={c} active={c.id === selectedId} onClick={() => setSelectedId(c.id)} />
          ))}
        </div>

        {/* Detail / review panel */}
        {selected && <ReviewPanel key={selected.id} item={selected} />}
      </div>
    </div>
  )
}

function InboxRow({ item, active, onClick }: { item: CaptureItem; active: boolean; onClick: () => void }) {
  const Icon = item.kind === 'transcript' ? Mic : Mail
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-lg p-3 hairline transition-colors ${active ? 'bg-surface' : 'bg-card hover:bg-hover'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={13} className="text-accent shrink-0" />
        <span className="text-[11px] text-secondary">{item.source}</span>
        <span className="text-[11px] text-tertiary ml-auto">{shortDate(item.date)}</span>
      </div>
      <div className="text-[13px] font-medium leading-snug">{item.title}</div>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="num text-[11px] text-tertiary">{item.extracted.length} fields</span>
        {item.durationMin && <span className="text-[11px] text-tertiary">· {item.durationMin}m</span>}
        {!item.reviewed && <Pill tone="accent">new</Pill>}
      </div>
    </button>
  )
}

function ReviewPanel({ item }: { item: CaptureItem }) {
  const navigate = useNavigate()
  const [accepted, setAccepted] = useState<Record<number, boolean>>({})
  const [nextStepDone, setNextStepDone] = useState(false)
  const [stageDone, setStageDone] = useState(false)

  const acceptedCount = Object.values(accepted).filter(Boolean).length
  const allDone = acceptedCount === item.extracted.length && nextStepDone && (!item.proposedStageMove || stageDone)

  function acceptAll() {
    const all: Record<number, boolean> = {}
    item.extracted.forEach((_, i) => (all[i] = true))
    setAccepted(all)
    setNextStepDone(true)
    setStageDone(true)
  }

  return (
    <Card className="p-5 self-start fade-up">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[15px] font-medium">{item.title}</div>
          <div className="text-[12px] text-tertiary mt-0.5">
            {item.who} · {shortDate(item.date)} {item.durationMin ? `· ${item.durationMin} min` : ''}
          </div>
        </div>
        {allDone ? (
          <Pill tone="green" icon={<CheckCheck size={12} />}>synced to CRM</Pill>
        ) : (
          <button
            onClick={acceptAll}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent text-white px-3 py-1.5 text-[12px] hover:brightness-110"
          >
            <Check size={13} /> Accept all
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-md bg-surface p-3 mb-4">
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles size={12} className="text-accent" />
          <span className="text-[11px] text-secondary">Relay summary</span>
        </div>
        <p className="text-[13px] leading-relaxed text-primary">{item.summary}</p>
      </div>

      {/* Extracted fields */}
      <div className="text-[11px] text-secondary mb-2">Extracted fields — accept to write to CRM</div>
      <div className="flex flex-col gap-2 mb-4">
        {item.extracted.map((f, i) => (
          <div key={i} className={`rounded-md hairline p-3 transition-colors ${accepted[i] ? 'bg-[var(--bg-hover)]' : 'bg-card'}`}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-secondary">{f.field}</span>
                <Pill tone={OWNER_TONE[f.owner]}>{OWNER_LABEL[f.owner]}</Pill>
              </div>
              {accepted[i] ? (
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
        ))}
      </div>

      {/* Proposed next step */}
      <div className={`rounded-md hairline p-3 mb-2 ${nextStepDone ? 'bg-[var(--bg-hover)]' : 'bg-card'}`}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 text-[11px] text-secondary">
            <ArrowRight size={12} className="text-accent" /> Proposed next step
          </div>
          {nextStepDone ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-green-text"><Check size={12} /> set</span>
          ) : (
            <button onClick={() => setNextStepDone(true)} className="rounded-md bg-[var(--accent-soft)] text-accent px-2 py-0.5 text-[11px] hover:brightness-95">
              Set next step
            </button>
          )}
        </div>
        <div className="text-[13px] text-primary">{item.proposedNextStep}</div>
      </div>

      {/* Proposed stage move */}
      {item.proposedStageMove && (
        <div className={`rounded-md hairline p-3 flex items-center justify-between ${stageDone ? 'bg-[var(--bg-hover)]' : 'bg-card'}`}>
          <div className="flex items-center gap-2 text-[13px]">
            <Clock size={13} className="text-accent" />
            Advance stage
            <span className="text-secondary">{item.proposedStageMove.from}</span>
            <ArrowRight size={12} className="text-tertiary" />
            <span className="font-medium">{item.proposedStageMove.to}</span>
          </div>
          {stageDone ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-green-text"><Check size={12} /> moved</span>
          ) : (
            <button onClick={() => setStageDone(true)} className="rounded-md bg-[var(--accent-soft)] text-accent px-2 py-0.5 text-[11px] hover:brightness-95">
              Confirm
            </button>
          )}
        </div>
      )}

      {allDone && (
        <div className="mt-4 flex items-center justify-between rounded-md bg-green-bg px-3 py-2.5 fade-up">
          <div className="flex items-center gap-2 text-[12px] text-green-text">
            <CheckCheck size={14} /> Record synced. Cortex columns are hygiene-high — no manual entry.
          </div>
          {item.dealId && (
            <button onClick={() => navigate(`/deal/${item.dealId}`)} className="text-[12px] text-green-text underline">
              Open deal
            </button>
          )}
        </div>
      )}

      {!allDone && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-tertiary">
          <CircleAlert size={12} /> Nothing is written until you accept. Relay never silently edits the record.
        </div>
      )}
    </Card>
  )
}
