import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleAlert, Sparkles } from 'lucide-react'
import { DEALS, OPEN_STAGES } from '../data/mock'
import { formatCurrency, relDate } from '../lib/format'
import { Avatar, PropensityMeter, StageDot, Pill } from '../components/ui'
import type { Vertical } from '../data/types'

const VERTICALS: (Vertical | 'All')[] = ['All', 'Pharma', 'CPG', 'Retail', 'Tech']

export function Pipeline() {
  const navigate = useNavigate()
  const [vertical, setVertical] = useState<Vertical | 'All'>('All')
  const [showGone, setShowGone] = useState(false)

  const rows = useMemo(() => {
    return DEALS.filter((d) => (vertical === 'All' ? true : d.vertical === vertical))
      .filter((d) => (showGone ? true : !['Latent Pool', 'Disqualified', 'Lost'].includes(d.stage)))
      .sort((a, b) => b.propensity - a.propensity)
  }, [vertical, showGone])

  const totalTcv = rows.reduce((s, d) => s + d.tcv, 0)
  const weighted = rows.reduce((s, d) => s + d.tcv * d.propensity, 0)

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="text-[20px] mb-1">Pipeline</h1>
          <p className="text-[13px] text-secondary">
            {rows.length} threads · {formatCurrency(totalTcv)} TCV · {formatCurrency(weighted)} weighted (auto-propensity)
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-3 hairline-b pb-2">
        <div className="flex items-center gap-1">
          {VERTICALS.map((v) => (
            <button
              key={v}
              onClick={() => setVertical(v)}
              className={`px-2.5 py-1 text-[12px] rounded-md transition-colors ${
                vertical === v ? 'text-primary font-medium' : 'text-secondary hover:bg-hover'
              }`}
              style={vertical === v ? { borderBottom: '1.5px solid var(--text-primary)', borderRadius: 0 } : {}}
            >
              {v}
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-1.5 text-[12px] text-secondary cursor-pointer">
          <input type="checkbox" checked={showGone} onChange={(e) => setShowGone(e.target.checked)} />
          Show latent / gone
        </label>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[1.7fr_0.9fr_0.7fr_0.8fr_0.6fr_0.5fr] gap-3 px-3 py-2 text-[11px] text-tertiary">
        <div>Deal</div>
        <div>Stage</div>
        <div>Owner</div>
        <div>Next step</div>
        <div>Propensity</div>
        <div className="text-right">TCV</div>
      </div>

      <div className="flex flex-col">
        {rows.map((d) => {
          const highFlag = d.flags.find((f) => f.severity === 'high')
          return (
            <button
              key={d.id}
              onClick={() => navigate(`/deal/${d.id}`)}
              className="grid grid-cols-[1.7fr_0.9fr_0.7fr_0.8fr_0.6fr_0.5fr] gap-3 px-3 py-2.5 items-center text-left hairline-b hover:bg-hover transition-colors"
              style={highFlag ? { borderLeft: '2px solid var(--status-red)' } : { borderLeft: '2px solid transparent' }}
            >
              <div className="min-w-0">
                <div className="text-[13px] font-medium truncate">{d.account}</div>
                <div className="text-[11px] text-tertiary truncate">{d.name}</div>
              </div>
              <div className="flex items-center gap-1.5 text-[12px]">
                <StageDot stage={d.stage} /> {d.stage}
              </div>
              <div className="flex items-center gap-1.5">
                <Avatar name={d.seller} size={20} />
                <span className="text-[12px] text-secondary truncate">{d.seller.split(' ')[0]}</span>
              </div>
              <div className="min-w-0">
                {d.nextStep.status === 'empty' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-text">
                    <CircleAlert size={11} /> none
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-secondary">
                    {d.nextStep.status === 'suggested' && <Sparkles size={10} className="text-accent" />}
                    {relDate(d.nextStepDue || d.lastTouch)}
                  </span>
                )}
              </div>
              <div>
                <PropensityMeter value={d.propensity} />
              </div>
              <div className="text-right num text-[12px]">{formatCurrency(d.tcv)}</div>
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-tertiary">
        <Sparkles size={11} className="text-accent" /> Propensity is auto-computed (stage baseline ± budget/sponsor) — the single column Cortex ingests.
      </div>
    </div>
  )
}
