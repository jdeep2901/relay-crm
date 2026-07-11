import { useEffect, useRef, useState } from 'react'
import { Sparkles, CornerDownLeft, X, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDeals, useWarmPaths } from '../lib/queries'
import { formatCurrency, pct } from '../lib/format'
import { isClosed } from '../lib/constants'
import type { Deal, WarmPath } from '../data/types'

type Answer = { body: string; chips?: { label: string; to?: string }[] }

const SUGGESTIONS = [
  "what's stalled?",
  'which deals have no next step?',
  'highest-propensity deals',
  'show me the warm paths',
  'explain a propensity score',
]

// Relay answers over the live pipeline (react-query cache). No account specifics
// are hardcoded — everything is computed from the current data.
function answer(query: string, deals: Deal[], warmPaths: WarmPath[]): Answer {
  const q = query.toLowerCase()
  const open = deals.filter((d) => !isClosed(d.stage))

  // Named-account lookup
  const named = deals.find((d) => q.includes(d.account.toLowerCase()))
  if (named && (q.includes('propensity') || q.includes('%') || q.includes('why'))) {
    const lines = [
      `${named.account} · ${named.name} — propensity ${pct(named.propensity)}.`,
      ``,
      `${named.stage} baseline (2yr history): ${pct(named.propensityBase)}`,
      ...named.propensityCriteria.map((c) => `${c.delta >= 0 ? '+' : ''}${Math.round(c.delta * 100)}% ${c.label}${c.met ? '' : ' (not met)'}`),
      ``,
      `Same formula Cortex ingests as one column — no per-deal subjectivity.`,
    ]
    return { body: lines.join('\n'), chips: [{ label: `Open ${named.account}`, to: `/deal/${named.id}` }] }
  }
  if (named) {
    const list = deals.filter((d) => d.account === named.account)
    return {
      body: `${named.account} — ${list.length} thread${list.length > 1 ? 's' : ''}, ${formatCurrency(list.reduce((s, d) => s + d.tcv, 0))} open.\n\n` +
        list.map((d) => `• ${d.name} (${d.stage}, ${pct(d.propensity)})${d.nextStep.status === 'empty' ? ' — no next step' : ''}`).join('\n'),
      chips: [{ label: `Open ${named.account}`, to: `/deal/${named.id}` }],
    }
  }

  if (q.includes('stall') || q.includes('risk') || q.includes('attention')) {
    const flagged = deals.flatMap((d) => d.flags.filter((f) => f.severity === 'high').map((f) => ({ d, f })))
    return {
      body: `${flagged.length} threads are high-risk right now:\n\n` +
        flagged.map(({ d, f }) => `• ${d.account} · ${d.name} — ${f.label}`).join('\n'),
      chips: [{ label: 'Go to Today', to: '/' }],
    }
  }

  if (q.includes('next step')) {
    const none = open.filter((d) => d.nextStep.status === 'empty')
    return {
      body: `${none.length} open threads have no next action — the #1 leak (“calls feel good but produce no next step”):\n\n` +
        none.map((d) => `• ${d.account} · ${d.name} (${d.stage})`).join('\n') +
        `\n\nLog a call or accept a Relay draft to fix these.`,
      chips: [{ label: 'Go to Today', to: '/' }],
    }
  }

  if (q.includes('propensity') || q.includes('highest') || q.includes('best') || q.includes('top')) {
    const top = [...open].sort((a, b) => b.propensity - a.propensity).slice(0, 5)
    return {
      body: `Highest-propensity open deals:\n\n` +
        top.map((d) => `• ${pct(d.propensity)} — ${d.account} · ${d.name} (${formatCurrency(d.tcv)})`).join('\n'),
      chips: top[0] ? [{ label: `Open ${top[0].account}`, to: `/deal/${top[0].id}` }] : undefined,
    }
  }

  if (q.includes('warm') || q.includes('intro') || q.includes('referral') || q.includes('path')) {
    return {
      body: `${warmPaths.length} warm paths mapped (referral is the only channel closing here):\n\n` +
        warmPaths.map((w) => `• ${w.target} — via ${w.via} (${w.strength})`).join('\n'),
      chips: [{ label: 'Open warm paths', to: '/relationships' }],
    }
  }

  return {
    body:
      `I answer over your live pipeline — ${open.length} open threads, ${formatCurrency(open.reduce((s, d) => s + d.tcv, 0))} open value.\n\n` +
      `Try: what's stalled, which deals have no next step, an account name, or a propensity question.`,
  }
}

export function AskRelay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [result, setResult] = useState<Answer | null>(null)
  const [thinking, setThinking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { data: deals } = useDeals()
  const { data: warmPaths } = useWarmPaths()

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 40)
      setQ('')
      setResult(null)
    }
  }, [open])

  function ask(query: string) {
    setQ(query)
    setThinking(true)
    setResult(null)
    setTimeout(() => {
      setThinking(false)
      setResult(answer(query, deals ?? [], warmPaths ?? []))
    }, 450)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-black/20" onClick={onClose}>
      <div className="w-full max-w-2xl bg-card hairline rounded-xl overflow-hidden fade-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 px-4 py-3 hairline-b">
          <Sparkles size={16} className="text-accent" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && q.trim() && ask(q)}
            placeholder="Ask Relay anything about your pipeline…"
            className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-tertiary"
          />
          <kbd className="text-[10px] text-tertiary hairline rounded px-1.5 py-0.5">esc</kbd>
          <button onClick={onClose} className="text-tertiary hover:text-secondary"><X size={15} /></button>
        </div>

        <div className="max-h-[52vh] overflow-y-auto no-scrollbar">
          {!result && !thinking && (
            <div className="p-3">
              <div className="text-[11px] text-tertiary px-1 pb-1.5">Suggested</div>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => ask(s)} className="w-full text-left px-3 py-2 rounded-md hover:bg-hover text-[13px] flex items-center gap-2">
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

          {result && (
            <div className="p-4 fade-up">
              <div className="text-[13px] leading-relaxed text-primary whitespace-pre-line">{result.body}</div>
              {result.chips && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.chips.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => { if (c.to) { navigate(c.to); onClose() } }}
                      className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-soft)] text-accent px-2.5 py-1 text-[12px] hover:brightness-95"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => { setResult(null); setQ('') }} className="mt-3 text-[11px] text-tertiary hover:text-secondary">Ask another</button>
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
