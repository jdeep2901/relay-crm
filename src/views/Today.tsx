import { useNavigate } from 'react-router-dom'
import { Sparkles, Clock, CalendarClock, ArrowRight, CircleAlert, Inbox, Target } from 'lucide-react'
import { useDeals, useCaptures, usePrecallBriefs } from '../lib/queries'
import { shortDate, relDate, TODAY_ISO } from '../lib/format'
import { isClosed } from '../lib/constants'
import { Card, Pill, Avatar, StageDot, Loading, ErrorState } from '../components/ui'

export function Today() {
  const navigate = useNavigate()
  const { data: deals, isLoading, error } = useDeals()
  const { data: captures } = useCaptures()
  const { data: briefs } = usePrecallBriefs()

  if (isLoading) return <Loading />
  if (error) return <ErrorState error={error} />
  if (!deals) return null

  const weekEnd = new Date(new Date(TODAY_ISO + 'T00:00:00').getTime() + 7 * 86_400_000).toISOString().slice(0, 10)
  const thisWeek = deals
    .filter((d) => d.nextMeetingDate && d.nextMeetingDate >= TODAY_ISO && d.nextMeetingDate <= weekEnd)
    .sort((a, b) => (a.nextMeetingDate! < b.nextMeetingDate! ? -1 : 1))
  const active = deals.filter((d) => !isClosed(d.stage))
  const briefsReady = thisWeek.filter((d) => briefs?.[d.id]).length
  const unreviewed = captures?.filter((c) => !c.reviewed).length ?? 0

  return (
    <div>
      <div className="flex items-end justify-between mb-1">
        <h1 className="text-[20px]">Today</h1>
        <div className="text-[12px] text-tertiary">Jul 14 · 2026</div>
      </div>
      <p className="text-[13px] text-secondary mb-5">
        Live from Monday. You have {thisWeek.length} meetings this week — Relay has briefs ready for {briefsReady}.
      </p>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <Stat label="Active threads" value={String(active.length)} sub={`${deals.length} synced from Monday`} />
        <Stat label="Meetings this week" value={String(thisWeek.length)} sub="next 7 days" tone="accent" />
        <Stat label="Pre-call briefs ready" value={String(briefsReady)} sub="researched + questions" tone="green" />
        <Stat label="Waiting in Capture" value={String(unreviewed)} sub="ready to accept" tone="amber" />
      </div>

      {/* This week's meetings — the pre-call hook */}
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock size={14} className="text-accent" />
        <h2 className="text-[14px]">This week’s meetings</h2>
        <button onClick={() => navigate('/precall')} className="ml-auto text-[12px] text-accent hover:underline inline-flex items-center gap-1">
          Open pre-call planning <ArrowRight size={13} />
        </button>
      </div>

      {thisWeek.length === 0 ? (
        <div className="text-secondary text-[13px] mb-6">No meetings in the next 7 days.</div>
      ) : (
        <div className="flex flex-col gap-2 mb-6">
          {thisWeek.map((d) => {
            const brief = briefs?.[d.id]
            return (
              <Card key={d.id} className="p-3.5 flex items-center gap-3.5" onClick={() => navigate('/precall')}>
                <div className="rounded-md flex items-center justify-center shrink-0 bg-surface" style={{ width: 40, height: 40 }}>
                  <div className="text-center leading-none">
                    <div className="text-[10px] text-tertiary uppercase">{new Date(d.nextMeetingDate! + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</div>
                    <div className="num text-[15px] font-medium">{new Date(d.nextMeetingDate! + 'T00:00:00').getDate()}</div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium truncate">{d.account}</span>
                    <Pill tone="neutral">{d.vertical}</Pill>
                    <span className="text-[12px] text-tertiary truncate">· {d.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StageDot stage={d.stage} />
                    <span className="text-[11px] text-secondary">{d.stage}</span>
                  </div>
                </div>
                {brief ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-soft)] text-accent px-2.5 py-1.5 text-[12px] shrink-0">
                    <Target size={13} /> {brief.smartQuestions.length} questions ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-tertiary shrink-0">
                    <Sparkles size={11} /> brief queued
                  </span>
                )}
                <Avatar name={d.seller} size={22} />
              </Card>
            )
          })}
        </div>
      )}

      {unreviewed > 0 && (
        <Card className="mb-4 p-4 flex items-center gap-4" onClick={() => navigate('/capture')}>
          <div className="rounded-md flex items-center justify-center shrink-0" style={{ width: 38, height: 38, background: 'var(--accent-soft)' }}>
            <Inbox size={18} className="text-accent" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-medium">{unreviewed} conversations captured — ready to accept</div>
            <div className="text-[12px] text-secondary mt-0.5">Review &amp; accept in one pass. Every field has a source quote.</div>
          </div>
          <ArrowRight size={18} className="text-tertiary" />
        </Card>
      )}

      <div className="mt-2 text-[12px] text-tertiary flex items-center gap-1.5">
        <CircleAlert size={12} /> Most fields (problem statement, intent, budget) are still empty in Monday — they’ll fill from call transcripts as those flow in.
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
