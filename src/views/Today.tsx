import { useNavigate } from 'react-router-dom'
import {
  Inbox, ArrowRight, Sparkles, CircleAlert, Clock, Waypoints, TrendingUp, ShieldQuestion, Check,
} from 'lucide-react'
import { DEALS, CAPTURE } from '../data/mock'
import { formatCurrency, relDate } from '../lib/format'
import { Card, Pill, Avatar } from '../components/ui'
import type { FlagKind } from '../data/types'

const ICON: Record<FlagKind, typeof Clock> = {
  'no-next-step': CircleAlert,
  stalled: Clock,
  'latent-thin': ShieldQuestion,
  'warm-path': Waypoints,
  expansion: TrendingUp,
  ghosted: CircleAlert,
  hygiene: CircleAlert,
}

const SEV_TONE: Record<'high' | 'med' | 'low', 'red' | 'amber' | 'neutral'> = {
  high: 'red',
  med: 'amber',
  low: 'neutral',
}

export function Today() {
  const navigate = useNavigate()
  const unreviewed = CAPTURE.filter((c) => !c.reviewed)

  // Derive the action feed from deal flags, ranked by severity.
  const actions = DEALS.flatMap((d) =>
    d.flags.map((f) => ({ deal: d, flag: f })),
  ).sort((a, b) => {
    const rank = { high: 0, med: 1, low: 2 }
    return rank[a.flag.severity] - rank[b.flag.severity]
  })

  const openTcv = DEALS.filter((d) => !['Won', 'Lost', 'Latent Pool', 'Disqualified'].includes(d.stage)).reduce((s, d) => s + d.tcv, 0)
  const needNext = DEALS.filter((d) => d.nextStep.status === 'empty' && !['Won', 'Lost', 'Disqualified'].includes(d.stage)).length

  return (
    <div>
      <div className="flex items-end justify-between mb-1">
        <h1 className="text-[20px]">Today</h1>
        <div className="text-[12px] text-tertiary">Friday, Jul 10 · 2026</div>
      </div>
      <p className="text-[13px] text-secondary mb-5">
        Relay maintained your pipeline overnight from {CAPTURE.length} captured conversations. Here's what needs a human.
      </p>

      {/* Snapshot strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <Stat label="Open pipeline" value={formatCurrency(openTcv)} sub={`${DEALS.length} active threads`} />
        <Stat label="Need a next step" value={String(needNext)} sub="calls with no action" tone="amber" />
        <Stat label="Waiting in Capture" value={String(unreviewed.length)} sub="ready to accept" tone="accent" />
        <Stat label="Warm paths open" value="5" sub="referral > cold" tone="green" />
      </div>

      {/* Capture nudge */}
      {unreviewed.length > 0 && (
        <Card className="mb-6 p-4 flex items-center gap-4" onClick={() => navigate('/capture')}>
          <div className="rounded-md flex items-center justify-center shrink-0" style={{ width: 38, height: 38, background: 'var(--accent-soft)' }}>
            <Inbox size={18} className="text-accent" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-medium">
              {unreviewed.length} conversations captured — Relay pre-filled {unreviewed.reduce((s, c) => s + c.extracted.length, 0)} fields
            </div>
            <div className="text-[12px] text-secondary mt-0.5">
              Review &amp; accept in one pass. No form-filling — every field has a source quote.
            </div>
          </div>
          <ArrowRight size={18} className="text-tertiary" />
        </Card>
      )}

      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-accent" />
        <h2 className="text-[14px]">Needs your attention</h2>
        <span className="text-[11px] text-tertiary">· ranked by risk</span>
      </div>

      <div className="flex flex-col gap-2">
        {actions.map(({ deal, flag }, i) => {
          const Icon = ICON[flag.kind]
          return (
            <Card key={deal.id + i} className="p-3.5 flex items-center gap-3.5" onClick={() => navigate(`/deal/${deal.id}`)}>
              <div
                className="rounded-md flex items-center justify-center shrink-0"
                style={{
                  width: 34, height: 34,
                  background: flag.severity === 'high' ? 'var(--status-red-bg)' : flag.severity === 'med' ? 'var(--status-amber-bg)' : 'var(--bg-surface)',
                  color: flag.severity === 'high' ? 'var(--status-red-text)' : flag.severity === 'med' ? 'var(--status-amber-text)' : 'var(--text-secondary)',
                }}
              >
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium truncate">{deal.account}</span>
                  <span className="text-[12px] text-tertiary truncate">· {deal.name}</span>
                </div>
                <div className="text-[12px] text-secondary mt-0.5">{flag.label}</div>
              </div>

              {/* If Relay has a drafted fix, show a one-click action */}
              {flag.kind === 'no-next-step' && deal.nextStep.status === 'suggested' && (
                <button
                  onClick={(e) => { e.stopPropagation() }}
                  className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-soft)] text-accent px-2.5 py-1.5 text-[12px] shrink-0 hover:brightness-95"
                >
                  <Check size={13} /> Accept next step
                </button>
              )}
              <Pill tone={SEV_TONE[flag.severity]}>{flag.severity}</Pill>
              <div className="flex items-center gap-2 shrink-0 w-28 justify-end">
                <span className="num text-[12px] text-secondary">{formatCurrency(deal.tcv)}</span>
                <Avatar name={deal.seller} size={22} />
              </div>
            </Card>
          )
        })}
      </div>

      <div className="mt-4 text-[12px] text-tertiary flex items-center gap-1.5">
        <Clock size={12} /> Last touch across pipeline: {relDate(DEALS.map((d) => d.lastTouch).sort().reverse()[0])}
      </div>
    </div>
  )
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: 'amber' | 'accent' | 'green' }) {
  const color = tone === 'amber' ? 'var(--status-amber-text)' : tone === 'accent' ? 'var(--accent)' : tone === 'green' ? 'var(--status-green-text)' : 'var(--text-primary)'
  return (
    <div className="bg-surface rounded-lg px-3.5 py-3">
      <div className="text-[11px] text-secondary">{label}</div>
      <div className="num text-[22px] font-medium mt-0.5" style={{ color }}>{value}</div>
      <div className="text-[11px] text-tertiary mt-0.5">{sub}</div>
    </div>
  )
}
