import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleAlert, Sparkles } from 'lucide-react'
import { useDeals } from '../lib/queries'
import { formatCurrency, relDate } from '../lib/format'
import { VERTICALS, VERTICAL_OWNER, isGone } from '../lib/constants'
import { Avatar, PropensityMeter, StageDot, Loading, ErrorState } from '../components/ui'
import type { Vertical, Deal } from '../data/types'

const GRID = 'grid grid-cols-[1.7fr_0.9fr_0.7fr_0.8fr_0.6fr_0.5fr] gap-3'

export function Pipeline() {
  const navigate = useNavigate()
  const { data: deals, isLoading, error } = useDeals()
  const [vertical, setVertical] = useState<Vertical | 'All'>('All')
  const [seller, setSeller] = useState<string>('All')
  const [showGone, setShowGone] = useState(false)

  const sellers = useMemo(() => {
    if (!deals) return []
    return Array.from(new Set(deals.map((d) => d.seller))).sort()
  }, [deals])

  const filtered = useMemo(() => {
    if (!deals) return []
    return deals
      .filter((d) => (vertical === 'All' ? true : d.vertical === vertical))
      .filter((d) => (seller === 'All' ? true : d.seller === seller))
      .filter((d) => (showGone ? true : !isGone(d.stage)))
      .sort((a, b) => b.propensity - a.propensity)
  }, [deals, vertical, seller, showGone])

  if (isLoading) return <Loading />
  if (error) return <ErrorState error={error} />

  const totalTcv = filtered.reduce((s, d) => s + d.tcv, 0)
  const weighted = filtered.reduce((s, d) => s + d.tcv * d.propensity, 0)

  // Industry-first: group by vertical, ordered by group value.
  const order: Vertical[] = ['Pharma', 'CPG', 'Retail', 'Tech']
  const groups = order
    .map((v) => ({ vertical: v, deals: filtered.filter((d) => d.vertical === v) }))
    .filter((g) => g.deals.length > 0)

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="text-[20px] mb-1">Pipeline</h1>
          <p className="text-[13px] text-secondary">
            {filtered.length} threads · {formatCurrency(totalTcv)} TCV · {formatCurrency(weighted)} weighted (auto-propensity)
          </p>
        </div>
      </div>

      {/* Filters — industry primary, seller secondary */}
      <div className="flex items-center gap-4 mb-3 hairline-b pb-2">
        <div className="flex items-center gap-1">
          {VERTICALS.map((v) => (
            <button
              key={v}
              onClick={() => setVertical(v)}
              className={`px-2.5 py-1 text-[12px] rounded-md transition-colors ${vertical === v ? 'text-primary font-medium' : 'text-secondary hover:bg-hover'}`}
              style={vertical === v ? { borderBottom: '1.5px solid var(--text-primary)', borderRadius: 0 } : {}}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-2">
          <span className="text-[11px] text-tertiary">Seller</span>
          <select
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            className="hairline rounded-md px-2 py-1 text-[12px] bg-card outline-none"
          >
            <option value="All">All sellers</option>
            {sellers.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <label className="ml-auto flex items-center gap-1.5 text-[12px] text-secondary cursor-pointer">
          <input type="checkbox" checked={showGone} onChange={(e) => setShowGone(e.target.checked)} />
          Show latent / gone
        </label>
      </div>

      {/* Column header */}
      <div className={`${GRID} px-3 py-2 text-[11px] text-tertiary`}>
        <div>Deal</div><div>Stage</div><div>Owner</div><div>Next step</div><div>Propensity</div><div className="text-right">TCV</div>
      </div>

      {groups.map((g) => {
        const gTcv = g.deals.reduce((s, d) => s + d.tcv, 0)
        return (
          <div key={g.vertical} className="mb-1">
            <div className="flex items-center gap-2 px-3 py-2 mt-2 bg-surface rounded-md">
              <span className="text-[12px] font-medium">{g.vertical}</span>
              <span className="text-[11px] text-tertiary">{VERTICAL_OWNER[g.vertical]}</span>
              <span className="ml-auto text-[11px] text-tertiary num">{g.deals.length} · {formatCurrency(gTcv)}</span>
            </div>
            {g.deals.map((d) => <Row key={d.id} d={d} onClick={() => navigate(`/deal/${d.id}`)} />)}
          </div>
        )
      })}

      <div className="mt-3 flex items-center gap-2 text-[11px] text-tertiary">
        <Sparkles size={11} className="text-accent" /> Propensity is auto-computed (stage baseline ± budget/sponsor) — the single column Cortex ingests.
      </div>
    </div>
  )
}

function Row({ d, onClick }: { d: Deal; onClick: () => void }) {
  const highFlag = d.flags.find((f) => f.severity === 'high')
  return (
    <button
      onClick={onClick}
      className={`${GRID} px-3 py-2.5 items-center text-left hairline-b hover:bg-hover transition-colors w-full`}
      style={highFlag ? { borderLeft: '2px solid var(--status-red)' } : { borderLeft: '2px solid transparent' }}
    >
      <div className="min-w-0">
        <div className="text-[13px] font-medium truncate">{d.account}</div>
        <div className="text-[11px] text-tertiary truncate">{d.name}</div>
      </div>
      <div className="flex items-center gap-1.5 text-[12px]"><StageDot stage={d.stage} /> {d.stage}</div>
      <div className="flex items-center gap-1.5">
        <Avatar name={d.seller} size={20} />
        <span className="text-[12px] text-secondary truncate">{d.seller.split(' ')[0]}</span>
      </div>
      <div className="min-w-0">
        {d.nextStep.status === 'empty' ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-text"><CircleAlert size={11} /> none</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-secondary">
            {d.nextStep.status === 'suggested' && <Sparkles size={10} className="text-accent" />}
            {relDate(d.nextStepDue || d.lastTouch)}
          </span>
        )}
      </div>
      <div><PropensityMeter value={d.propensity} /></div>
      <div className="text-right num text-[12px]">{formatCurrency(d.tcv)}</div>
    </button>
  )
}
