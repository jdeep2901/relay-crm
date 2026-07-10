import { useNavigate } from 'react-router-dom'
import { Building2, ArrowRight, Sparkles } from 'lucide-react'
import { DEALS } from '../data/mock'
import { formatCurrency, relDate } from '../lib/format'
import { Card, Pill, PropensityMeter, StageDot } from '../components/ui'

// Account-level intent proxies — the "target on intel, not name/revenue" ask.
const INTEL: Record<string, string[]> = {
  "L'Oréal": ['MSA extended to Dec', 'New RTM buying centre (James)', 'Skin-care AI selling push'],
  Diageo: ['Investing in commercial-AI capability', 'New CDO ex-Wonderless', 'Agency-held media data blocker'],
  'Niagara Bottling': ['Full RFP suite issued', 'Research-led intro (self-qualified)'],
  Regeneron: ['Cold ~2yr, now warmed', 'Semantic-layer / KG modernization'],
  Otsuka: ['Active MMX RFP', 'Commercial NBA interest'],
  PepsiCo: ['Preferred-vendor wall', 'Cold motion not converting'],
  AstraZeneca: ['Early — current-state analysis', 'Low intel captured'],
  Grubhub: ['Rare cold logo this year', 'Apollo campaign traction'],
}

export function Accounts() {
  const navigate = useNavigate()

  const accounts = Array.from(new Set(DEALS.map((d) => d.account))).map((name) => {
    const deals = DEALS.filter((d) => d.account === name)
    return {
      name,
      vertical: deals[0].vertical,
      tcv: deals.reduce((s, d) => s + d.tcv, 0),
      deals,
      bestProp: Math.max(...deals.map((d) => d.propensity)),
      lastTouch: deals.map((d) => d.lastTouch).sort().reverse()[0],
    }
  }).sort((a, b) => b.tcv - a.tcv)

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

            {INTEL[a.name] && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {INTEL[a.name].map((sig) => (
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
