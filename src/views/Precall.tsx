import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarClock, Sparkles, Target, HelpCircle, AlertTriangle, ExternalLink,
  ArrowRight, Building2, Lightbulb, Loader2,
} from 'lucide-react'
import { useDeals, usePrecallBriefs } from '../lib/queries'
import { shortDate, relDate, TODAY_ISO } from '../lib/format'
import { Card, Avatar, Pill, StageDot, Loading, ErrorState } from '../components/ui'
import type { Deal, PrecallBrief } from '../data/types'

export function Precall() {
  const navigate = useNavigate()
  const { data: deals, isLoading, error } = useDeals()
  const { data: briefs } = usePrecallBriefs()
  const [selectedId, setSelectedId] = useState<string | undefined>()

  const meetings = useMemo(() => {
    if (!deals) return []
    return deals
      .filter((d) => d.nextMeetingDate && d.nextMeetingDate >= TODAY_ISO)
      .sort((a, b) => (a.nextMeetingDate! < b.nextMeetingDate! ? -1 : 1))
  }, [deals])

  if (isLoading) return <Loading />
  if (error) return <ErrorState error={error} />

  const selected = meetings.find((m) => m.id === selectedId) ?? meetings[0]
  const selectedBrief = selected ? briefs?.[selected.id] : undefined

  // Group meetings by date for the rail
  const groups: { date: string; deals: Deal[] }[] = []
  for (const m of meetings) {
    const g = groups.find((x) => x.date === m.nextMeetingDate)
    if (g) g.deals.push(m)
    else groups.push({ date: m.nextMeetingDate!, deals: [m] })
  }
  const briefedCount = meetings.filter((m) => briefs?.[m.id]).length

  return (
    <div>
      <div className="flex items-end justify-between mb-1">
        <h1 className="text-[20px]">Pre-call planning</h1>
        <div className="text-[12px] text-tertiary">{meetings.length} upcoming meetings · {briefedCount} briefed</div>
      </div>
      <p className="text-[13px] text-secondary mb-5">
        Relay researches every prospect ahead of the meeting and turns it into discovery questions that get them to open up — research-led, not pitch-led.
      </p>

      {meetings.length === 0 ? (
        <div className="text-secondary text-[13px]">No upcoming meetings scheduled.</div>
      ) : (
        <div className="grid grid-cols-[300px_1fr] gap-4 items-start">
          {/* Meeting rail */}
          <div className="flex flex-col gap-3">
            {groups.map((g) => (
              <div key={g.date}>
                <div className="flex items-center gap-1.5 px-1 mb-1.5 text-[11px] text-tertiary">
                  <CalendarClock size={11} /> {shortDate(g.date)} · {relDate(g.date)}
                </div>
                <div className="flex flex-col gap-1.5">
                  {g.deals.map((d) => {
                    const hasBrief = !!briefs?.[d.id]
                    const active = selected?.id === d.id
                    return (
                      <button
                        key={d.id}
                        onClick={() => setSelectedId(d.id)}
                        className={`text-left rounded-lg p-2.5 hairline transition-colors ${active ? 'bg-surface' : 'bg-card hover:bg-hover'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium truncate flex-1">{d.account}</span>
                          <Pill tone="neutral">{d.vertical}</Pill>
                        </div>
                        <div className="text-[11px] text-tertiary truncate mt-0.5">{d.name}</div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <StageDot stage={d.stage} />
                          <span className="text-[11px] text-secondary">{d.stage}</span>
                          {hasBrief
                            ? <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-accent"><Sparkles size={9} /> brief</span>
                            : <span className="ml-auto text-[10px] text-tertiary">no brief yet</span>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Brief panel */}
          {selected && (
            <BriefPanel key={selected.id} deal={selected} brief={selectedBrief} onOpenDeal={() => navigate(`/deal/${selected.id}`)} />
          )}
        </div>
      )}
    </div>
  )
}

function BriefPanel({ deal, brief, onOpenDeal }: { deal: Deal; brief?: PrecallBrief; onOpenDeal: () => void }) {
  return (
    <Card className="p-5 self-start fade-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4 pb-4 hairline-b">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-medium">{deal.account}</h2>
            <Pill tone="neutral">{deal.vertical}</Pill>
            <Pill tone={deal.channel === 'Referral' ? 'green' : deal.channel === 'Cold' ? 'red' : 'neutral'}>{deal.channel}</Pill>
          </div>
          <div className="text-[12px] text-secondary mt-1 flex items-center gap-2">
            <span>Meeting with {deal.name}</span>
            <span className="text-tertiary">·</span>
            <span className="inline-flex items-center gap-1"><CalendarClock size={11} /> {deal.nextMeetingDate && shortDate(deal.nextMeetingDate)}</span>
            <span className="text-tertiary">·</span>
            <span className="inline-flex items-center gap-1"><Avatar name={deal.seller} size={16} /> {deal.seller.split(' ')[0]}</span>
          </div>
        </div>
        <button onClick={onOpenDeal} className="shrink-0 inline-flex items-center gap-1 text-[12px] text-accent hover:underline">
          Open deal <ArrowRight size={13} />
        </button>
      </div>

      {!brief ? (
        <div className="flex items-center gap-2 text-[13px] text-secondary py-8 justify-center">
          <Loader2 size={15} className="animate-spin" /> Relay is preparing this brief — check back shortly.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Company */}
          {brief.companySummary && (
            <section>
              <SectionLabel icon={Building2}>Company</SectionLabel>
              <p className="text-[13px] leading-relaxed text-primary">{brief.companySummary}</p>
              {brief.companySignals.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2.5">
                  {brief.companySignals.map((s, i) => (
                    <div key={i} className="rounded-md bg-surface px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={10} className="text-accent" />
                        <span className="text-[12px] font-medium">{s.label}</span>
                        {s.source && <span className="text-[10px] text-tertiary ml-auto">{s.source}</span>}
                      </div>
                      <div className="text-[12px] text-secondary mt-0.5 leading-snug">{s.detail}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Prospect */}
          {brief.prospectSummary && (
            <section>
              <SectionLabel icon={Target}>Prospect</SectionLabel>
              <p className="text-[13px] leading-relaxed text-primary">{brief.prospectSummary}</p>
            </section>
          )}

          {/* Angle — the hero callout */}
          {brief.angle && (
            <section>
              <div className="rounded-lg p-3.5" style={{ background: 'var(--accent-soft)' }}>
                <div className="flex items-center gap-1.5 mb-1 text-[11px] font-medium text-accent">
                  <Lightbulb size={13} /> The way in
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>{brief.angle}</p>
              </div>
            </section>
          )}

          {/* Smart questions — the star */}
          {brief.smartQuestions.length > 0 && (
            <section>
              <SectionLabel icon={HelpCircle}>Smart questions to open them up</SectionLabel>
              <div className="flex flex-col gap-2">
                {brief.smartQuestions.map((q, i) => (
                  <div key={i} className="flex gap-2.5">
                    <span className="num text-[12px] text-accent shrink-0 mt-0.5 w-4 text-right">{i + 1}</span>
                    <div>
                      <div className="text-[13px] text-primary leading-snug">{q.q}</div>
                      {q.why && <div className="text-[11px] text-tertiary mt-0.5">↳ {q.why}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Watchouts */}
          {brief.watchouts.length > 0 && (
            <section>
              <SectionLabel icon={AlertTriangle}>Watch-outs</SectionLabel>
              <ul className="flex flex-col gap-1">
                {brief.watchouts.map((w, i) => (
                  <li key={i} className="text-[12px] text-secondary flex gap-1.5">
                    <span className="text-amber-text">•</span> {w}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Sources */}
          {brief.sources.length > 0 && (
            <section>
              <SectionLabel icon={ExternalLink}>Sources</SectionLabel>
              <div className="flex flex-col gap-1">
                {brief.sources.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noreferrer" className="text-[12px] text-accent hover:underline inline-flex items-center gap-1 truncate">
                    <ExternalLink size={10} className="shrink-0" /> {s.title}
                  </a>
                ))}
              </div>
              <div className="text-[10px] text-tertiary mt-2">Relay generated this from public research. Verify facts before quoting in the room.</div>
            </section>
          )}
        </div>
      )}
    </Card>
  )
}

function SectionLabel({ icon: Icon, children }: { icon: typeof Target; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-secondary">
      <Icon size={13} className="text-accent" /> {children}
    </div>
  )
}
