import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Flame, DollarSign, Target, Handshake, UserCheck, Activity, TriangleAlert, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { shortDate, pct } from '../lib/format'
import { Card, Pill, Avatar, StageDot, PropensityMeter, Loading, ErrorState } from '../components/ui'
import type { Vertical, Stage } from '../data/types'

type Reason = { t: 'money' | 'need' | 'commit' | 'sponsor' | 'mom' | 'risk'; d: string }
type Row = {
  deal_id: string; account: string; contact: string; stage: Stage; vertical: Vertical
  propensity: number; seller: string | null; next_meeting_date: string | null
  calls: number; last_call: string | null; days_quiet: number | null
  score: number; money_pts: number; need_pts: number; commit_pts: number
  sponsor_pts: number; momentum_pts: number; penalty: number
  money_evidence: string | null; reasons: Reason[]
}

const VERTS: (Vertical | 'All')[] = ['All', 'Pharma', 'CPG', 'Retail', 'Tech']
const STAGES = ['All stages', 'Intro', 'Qualification', 'Capability', 'Problem Scoping', 'Proposal', 'Contracting'] as const
const ICON: Record<Reason['t'], typeof Flame> = {
  money: DollarSign, need: Target, commit: Handshake, sponsor: UserCheck, mom: Activity, risk: TriangleAlert,
}

export function Priority() {
  const navigate = useNavigate()
  const { data, isLoading, error } = useQuery<Row[]>({
    queryKey: ['deal-priority'],
    queryFn: async () => {
      const { data, error } = await supabase.from('deal_priority').select('*').order('score', { ascending: false })
      if (error) throw error
      return data as Row[]
    },
  })
  const [vert, setVert] = useState<Vertical | 'All'>('All')
  const [stage, setStage] = useState<string>('All stages')

  const rows = useMemo(() => (data ?? []).filter(
    (r) => (vert === 'All' || r.vertical === vert) && (stage === 'All stages' || r.stage === stage),
  ), [data, vert, stage])

  if (isLoading) return <Loading />
  if (error) return <ErrorState error={error} />

  const countFor = (v: Vertical | 'All') =>
    (data ?? []).filter((r) => (v === 'All' || r.vertical === v) && (stage === 'All stages' || r.stage === stage)).length

  return (
    <div>
      <div className="flex items-end justify-between mb-1">
        <h1 className="text-[20px]">Priority</h1>
        <div className="text-[12px] text-tertiary">{rows.length} active deals with call activity</div>
      </div>
      <p className="text-[13px] text-secondary mb-4">
        Ranked on what clients actually said — money, need, commitment, sponsor access and momentum.
        Stage is deliberately excluded, so a well-qualified early deal can outrank a quiet late one.
      </p>

      {/* filters */}
      <div className="flex items-center gap-1 mb-3 hairline-b pb-2">
        {VERTS.map((v) => (
          <button key={v} onClick={() => setVert(v)}
            className={`px-2.5 py-1 text-[12px] rounded-md transition-colors inline-flex items-center gap-1.5 ${vert === v ? 'text-primary font-medium' : 'text-secondary hover:bg-hover'}`}
            style={vert === v ? { borderBottom: '1.5px solid var(--text-primary)', borderRadius: 0 } : {}}>
            {v}<span className="num text-[10px] text-tertiary">{countFor(v)}</span>
          </button>
        ))}
        <select value={stage} onChange={(e) => setStage(e.target.value)}
          className="ml-auto hairline rounded-md bg-card text-[12px] px-2 py-1 text-secondary outline-none">
          {STAGES.map((s) => <option key={s} value={s}>{s === 'All stages' ? 'All stages' : `Stage: ${s}`}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <Card key={r.deal_id} className="p-4" onClick={() => navigate(`/deal/${r.deal_id}`)}>
            <div className="flex items-start gap-4">
              {/* rank + score */}
              <div className="shrink-0 text-center" style={{ width: 46 }}>
                <div className="text-[10px] text-tertiary">#{i + 1}</div>
                <div className="num text-[26px] font-medium leading-none mt-0.5"
                  style={{ color: r.score >= 65 ? 'var(--status-green)' : r.score >= 45 ? 'var(--status-amber)' : 'var(--text-tertiary)' }}>
                  {r.score}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-medium">{r.account}</span>
                  <span className="text-[12px] text-tertiary truncate">{r.contact}</span>
                  <Pill tone="neutral">{r.vertical}</Pill>
                  <span className="inline-flex items-center gap-1 text-[11px] text-secondary">
                    <StageDot stage={r.stage} />{r.stage}
                  </span>
                </div>

                {/* reasons */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {r.reasons.map((x, j) => {
                    const I = ICON[x.t] ?? Target
                    const risk = x.t === 'risk'
                    return (
                      <span key={j}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
                        style={{
                          background: risk ? 'var(--status-red-bg)' : 'var(--bg-surface)',
                          color: risk ? 'var(--status-red-text)' : 'var(--text-secondary)',
                        }}>
                        <I size={10} />{x.d}
                      </span>
                    )
                  })}
                </div>

                {r.money_evidence && (
                  <div className="text-[11.5px] text-tertiary italic mt-1.5 truncate">“{r.money_evidence}”</div>
                )}

                {/* component bar */}
                <div className="flex items-center gap-3 mt-2 text-[10px] text-tertiary">
                  <Comp label="money" v={r.money_pts} max={30} />
                  <Comp label="need" v={r.need_pts} max={25} />
                  <Comp label="commit" v={r.commit_pts} max={20} />
                  <Comp label="sponsor" v={r.sponsor_pts} max={15} />
                  <Comp label="momentum" v={r.momentum_pts} max={10} />
                  {r.penalty < 0 && <span className="text-red-text">penalty {r.penalty}</span>}
                </div>
              </div>

              {/* right rail */}
              <div className="shrink-0 text-right flex flex-col items-end gap-1.5" style={{ width: 130 }}>
                <div className="flex items-center gap-1.5">
                  <span className="num text-[13px] font-medium">{pct(r.propensity)}</span>
                  <PropensityMeter value={r.propensity} width={40} />
                </div>
                <div className="text-[10px] text-tertiary">propensity</div>
                <div className="text-[11px] text-secondary">
                  {r.calls} call{r.calls === 1 ? '' : 's'}
                  {r.days_quiet != null && ` · ${r.days_quiet}d quiet`}
                </div>
                {r.next_meeting_date && (
                  <div className="text-[10.5px] text-accent">next {shortDate(r.next_meeting_date)}</div>
                )}
                {r.seller && (
                  <div className="flex items-center gap-1 text-[10.5px] text-tertiary">
                    <Avatar name={r.seller} size={15} />{r.seller.split(' ')[0]}
                  </div>
                )}
              </div>
              <ArrowRight size={15} className="text-tertiary shrink-0 self-center" />
            </div>
          </Card>
        ))}
        {rows.length === 0 && <div className="text-[13px] text-secondary py-4">No deals match these filters.</div>}
      </div>

      <div className="text-[10.5px] text-tertiary mt-4 leading-snug">
        Scored from client-attributed call signals only: money evidence (30) · need clarity (25) ·
        commitment depth (20) · sponsor proximity (15) · momentum (10), minus penalties for
        stated no-budget and open objections. Deal value is not yet weighted — TCV is missing on most deals.
      </div>
    </div>
  )
}

function Comp({ label, v, max }: { label: string; v: number; max: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span>{label}</span>
      <span className="inline-block rounded-full" style={{ width: 26, height: 3, background: 'var(--border-hairline)' }}>
        <span className="block h-full rounded-full"
          style={{ width: `${Math.round((v / max) * 100)}%`, background: v ? 'var(--accent)' : 'transparent' }} />
      </span>
    </span>
  )
}
