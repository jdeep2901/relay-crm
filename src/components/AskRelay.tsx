import { useEffect, useRef, useState } from 'react'
import { Sparkles, CornerDownLeft, X, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

type Answer = { body: string; chips?: { label: string; to?: string }[] }

// Scripted responses grounded in the real pipeline. In phase 2 this becomes a
// Supabase Edge Function over the deal graph (same pattern as chat-analyst).
const SCRIPTED: { q: string; a: Answer }[] = [
  {
    q: "what's stalled in diageo?",
    a: {
      body:
        "Diageo has 3 threads losing momentum:\n\n• Chad — MMM (good Jul 9 call, but no next step logged). Relay drafted one.\n• Michael Ditter — replied only to decline; no leadership warm-path.\n• Finance/commercial-performance thread — cold after a strong 2nd call.\n\nThe pattern is a warm-path gap, not a content gap. Route to the new CDO (ex-Wonderless) via Ryan.",
      chips: [
        { label: 'Open Chad thread', to: '/deal/diageo-chad-mmm' },
        { label: 'See warm paths', to: '/relationships' },
      ],
    },
  },
  {
    q: 'draft the l’oréal follow-up',
    a: {
      body:
        "Drafted from the Jun 30 momentum call + Atishay's email:\n\n“James — great to connect via Atishay. To make the NY session concrete, I'll bring a Sales Rep GPT walkthrough tuned to skin-care selling (the pharma/derm referral model you liked) and a short art-of-the-possible for your boss's team. Tue or Wed afternoon — which works?”\n\nRicher than a one-line nudge: it carries the use case + the workshop hook.",
      chips: [{ label: 'Open L’Oréal deal', to: '/deal/loreal-salesrep-gpt' }],
    },
  },
  {
    q: 'which deals have no next step?',
    a: {
      body:
        "4 open threads have no next action — the #1 leak from your review (“calls feel good but produce no next step”):\n\n• Diageo · Chad (Qualification) — Relay drafted one, awaiting accept\n• AstraZeneca · current-state (Qualification, 22d stale)\n• PepsiCo (Latent — needs sign-off, not silent drop)\n\nRelay can draft all 3 from their transcripts now.",
      chips: [{ label: 'Go to Today', to: '/' }],
    },
  },
  {
    q: 'who can warm-intro michael ditter?',
    a: {
      body:
        "No direct MathCo-leadership path to Ditter today. Best route:\n\n1. New Diageo CDO (ex-Wonderless) → via Ryan (routing in progress)\n2. Shreya / Piyush have a thin connect — reinforce, don't lead with it\n\nCold outreach to Ditter has a ~0% base rate here (he only replied to decline). Prioritise the CDO relay.",
      chips: [{ label: 'Open relationships', to: '/relationships' }],
    },
  },
  {
    q: 'why is niagara at 74%?',
    a: {
      body:
        "Niagara propensity = 74%.\n\nStage baseline (Proposal, 2yr history): 55%\n+12% budget identified (RFP-backed)\n+7% client self-qualified (pitched themselves to MathCo)\n\nNo per-deal subjectivity — same formula Cortex ingests as one column.",
      chips: [{ label: 'Open Niagara deal', to: '/deal/niagara-rfp' }],
    },
  },
]

const SUGGESTIONS = SCRIPTED.map((s) => s.q)

export function AskRelay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [thinking, setThinking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 40)
      setQ('')
      setAnswer(null)
    }
  }, [open])

  function ask(query: string) {
    setQ(query)
    setThinking(true)
    setAnswer(null)
    const hit =
      SCRIPTED.find((s) => s.q.toLowerCase() === query.toLowerCase().trim()) ||
      SCRIPTED.find((s) => query.toLowerCase().split(' ').some((w) => w.length > 3 && s.q.toLowerCase().includes(w)))
    setTimeout(() => {
      setThinking(false)
      setAnswer(
        hit?.a ?? {
          body:
            "In this prototype I answer over the seeded pipeline. Try one of the suggested questions — in phase 2 this runs as a Supabase Edge Function over the live deal graph (same pattern as your dashboard's chat-analyst).",
        },
      )
    }, 650)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-black/20" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-card hairline rounded-xl overflow-hidden fade-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 hairline-b">
          <Sparkles size={16} className="text-accent" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && q.trim() && ask(q)}
            placeholder="Ask Relay anything — or tell it to do something…"
            className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-tertiary"
          />
          <kbd className="text-[10px] text-tertiary hairline rounded px-1.5 py-0.5">esc</kbd>
          <button onClick={onClose} className="text-tertiary hover:text-secondary">
            <X size={15} />
          </button>
        </div>

        <div className="max-h-[52vh] overflow-y-auto no-scrollbar">
          {!answer && !thinking && (
            <div className="p-3">
              <div className="text-[11px] text-tertiary px-1 pb-1.5">Suggested</div>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-hover text-[13px] flex items-center gap-2"
                >
                  <Zap size={13} className="text-accent shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          )}

          {thinking && (
            <div className="p-5 flex items-center gap-2 text-secondary text-[13px]">
              <div className="shimmer rounded-full" style={{ width: 14, height: 14 }} />
              Relay is reading the pipeline…
            </div>
          )}

          {answer && (
            <div className="p-4 fade-up">
              <div className="text-[13px] leading-relaxed text-primary whitespace-pre-line">{answer.body}</div>
              {answer.chips && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {answer.chips.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => {
                        if (c.to) {
                          navigate(c.to)
                          onClose()
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-soft)] text-accent px-2.5 py-1 text-[12px] hover:brightness-95"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => { setAnswer(null); setQ('') }} className="mt-3 text-[11px] text-tertiary hover:text-secondary">
                Ask another
              </button>
            </div>
          )}
        </div>

        <div className="hairline-t px-4 py-2 flex items-center gap-2 text-[11px] text-tertiary">
          <CornerDownLeft size={12} /> to ask · Relay maintains the record — you confirm, you don't type
        </div>
      </div>
    </div>
  )
}
