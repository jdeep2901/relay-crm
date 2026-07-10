import { useState } from 'react'
import { Check, Sparkles, Pencil, CircleAlert } from 'lucide-react'
import type { ExtractedField, Owner } from '../data/types'

const OWNER_LABEL: Record<Owner, string> = {
  sales: 'sales',
  solutioning: 'solutioning',
  'jd-sahana': 'JD + Sahana',
}

// The heart of Relay's trust model: a field Relay filled from a source.
// Human confirms (one click) or edits — never types from scratch.
export function ProvenanceField({ label, field }: { label: string; field: ExtractedField }) {
  const [status, setStatus] = useState(field.status)
  const [open, setOpen] = useState(false)

  const empty = status === 'empty' || field.value == null
  const suggested = status === 'suggested'

  return (
    <div className="py-2.5 hairline-b last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[11px] text-secondary">{label}</span>
            <span className="text-[10px] text-tertiary">· {OWNER_LABEL[field.owner]}</span>
          </div>
          {empty ? (
            <div className="flex items-center gap-1.5 text-tertiary text-[13px]">
              <CircleAlert size={13} className="text-amber" />
              <span>Not captured yet — Relay will fill from the next call/email</span>
            </div>
          ) : (
            <div className="text-[13px] text-primary leading-snug">{field.value}</div>
          )}

          {!empty && field.source && (
            <button
              onClick={() => setOpen((o) => !o)}
              className="mt-1 inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
            >
              <Sparkles size={11} />
              {field.source}
              <span className="text-tertiary">· {Math.round(field.confidence * 100)}%</span>
            </button>
          )}
          {open && field.quote && (
            <div className="mt-1.5 rounded-md bg-surface px-2.5 py-1.5 text-[12px] text-secondary italic leading-snug fade-up">
              {field.quote}
            </div>
          )}
        </div>

        {!empty && (
          <div className="flex items-center gap-1 shrink-0">
            {status === 'confirmed' ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-green-text">
                <Check size={12} /> confirmed
              </span>
            ) : suggested ? (
              <>
                <button
                  onClick={() => setStatus('confirmed')}
                  className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-soft)] text-accent px-2 py-1 text-[11px] hover:brightness-95"
                >
                  <Check size={12} /> Accept
                </button>
                <button className="rounded-md hairline px-1.5 py-1 text-secondary hover:bg-hover">
                  <Pencil size={12} />
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
