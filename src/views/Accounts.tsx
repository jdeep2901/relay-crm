import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ArrowRight, Sparkles } from 'lucide-react'
import { useDeals } from '../lib/queries'
import { formatCurrency } from '../lib/format'
import { Card, PropensityMeter, StageDot, Loading, ErrorState } from '../components/ui'
import type { Deal } from '../data/types'

// Intent signals are derived from the live deal data — not a hardcoded map —
// so nothing account-specific is baked into the repo.
function signalsFor(deals: Deal[]): string[] {
  const out: string[] = []
  for (const d of deals) {
    for (const f of d.flags) if (f.severity !== 'low') out.push(f.label)
    if (d.intent.value) out.push(d.intent.value.split('—')[0].trim())
  }
  return Array.from(new Set(out)).slice(0, 3)
}

export function Accounts() {
  const navigate = useNavigate()
  const { data: deals, isLoading, error } = useDeals()

  const accounts = useMemo(() => {
    if (!deals) return []
    const names = Array.from(new Set(deals.map((d) => d.account)))
    return names
      .map((name) => {
        const list = deals.filter((d) => d.account === name)
        return {
          name,
          vertical: list[0].vertical,
          tcv: list.reduce((s, d) => s + d.tcv, 0),
          deals: list,
          bestProp: Math.max(...list.map((d) => d.propensity)),
          signals: signalsFor(list),
        }
      })
      .sort((a, b) => b.tcv - a.tcv)
  }, [deals])

  if (isLoading) return <Loading />
  if (error) return <ErrorState error={error} />

  return (
    <div>
      <h1 className="text-[20px] mb-1">Accounts</h1>
      <p className="text-[13px] text-secondary mb-5">
        Prioritised by intel and open value — not just name and revenue. Relay surfaces the intent signals behind each logo.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {accounts.map((a) => (
          <Card key={a.name} className="p-4">
            <div className="flex items-start justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="rounded-md flex items-center justify-center bg-surface" style={{ width: 34, height: 34 }}>
                  <Building2 size={16} className="text-secondary" />
                </div>
                <div>
                  <div className="text-[14px] font-medium">{a.name}</div>
                  <div className="text-[11px] text-tertiary">{a.vertical} · {a.deals.length} thread{a.deals.length > 1 ? 's' : ''}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="num text-[15px] font-medium">{formatCurrency(a.tcv)}</div>
                <div className="mt-1"><PropensityMeter value={a.bestProp} /></div>
              </div>
            </div>

            {a.signals.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {a.signals.map((sig) => (
                  <span key={sig} className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-soft)] text-accent px-2 py-0.5 text-[11px]">
                    <Sparkles size={9} /> {sig}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-1 hairline-t pt-2">
              {a.deals.map((d) => (
                <button
                  key={d.id}
                  onClick={() => navigate(`/deal/${d.id}`)}
                  className="flex items-center gap-2 text-left py-1 px-1 rounded-md hover:bg-hover"
                >
                  <StageDot stage={d.stage} />
                  <span className="text-[12px] truncate flex-1">{d.name}</span>
                  <span className="text-[11px] text-tertiary">{d.stage}</span>
                  <ArrowRight size={13} className="text-tertiary" />
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
