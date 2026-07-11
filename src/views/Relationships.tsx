import { useNavigate } from 'react-router-dom'
import { Waypoints, ArrowRight, Sparkles, Target } from 'lucide-react'
import { useWarmPaths } from '../lib/queries'
import { Card, Avatar, Pill, Loading, ErrorState } from '../components/ui'

const STRENGTH_TONE = { strong: 'green', medium: 'amber', thin: 'red' } as const

export function Relationships() {
  const navigate = useNavigate()
  const { data: warmPaths, isLoading, error } = useWarmPaths()

  if (isLoading) return <Loading />
  if (error) return <ErrorState error={error} />

  return (
    <div>
      <h1 className="text-[20px] mb-1">Warm paths</h1>
      <p className="text-[13px] text-secondary mb-5">
        Referral is the only channel that closes here — 0 cold-logo closures in 3 quarters. Relay maps who can open each door.
      </p>

      <div className="rounded-lg bg-surface p-4 mb-5 flex items-center gap-3">
        <Sparkles size={16} className="text-accent shrink-0" />
        <div className="text-[13px] text-secondary">
          Relay builds this from email graphs, LinkedIn, and prior MathCo contacts. When a buyer has no warm path, it says so — instead of sending you to cold-email them.
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {warmPaths?.map((w, i) => (
          <Card key={i} className="p-4" onClick={w.dealId ? () => navigate(`/deal/${w.dealId}`) : undefined}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 w-56 shrink-0">
                <div className="rounded-md flex items-center justify-center bg-[var(--accent-soft)]" style={{ width: 32, height: 32 }}>
                  <Target size={15} className="text-accent" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium truncate">{w.target}</div>
                  <div className="text-[11px] text-tertiary truncate">{w.targetTitle}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex-1 flex items-center gap-1.5">
                  <div className="h-px flex-1" style={{ background: 'var(--border-emphasis)' }} />
                  <Waypoints size={13} className="text-secondary" />
                  <div className="h-px flex-1" style={{ background: 'var(--border-emphasis)' }} />
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-56 shrink-0">
                <Avatar name={w.via} size={30} />
                <div className="min-w-0">
                  <div className="text-[13px] font-medium truncate">via {w.via}</div>
                  <div className="text-[11px] text-tertiary truncate">{w.relationship}</div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <Pill tone={STRENGTH_TONE[w.strength]}>{w.strength}</Pill>
                <span className="text-[11px] text-tertiary">{w.account}</span>
                {w.dealId && <ArrowRight size={15} className="text-tertiary" />}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
