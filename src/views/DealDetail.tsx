import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Phone, Mail, Linkedin, StickyNote, GitBranch, Sparkles, Check, Clock,
  ShieldQuestion, Waypoints, ArrowRight, Send, TrendingUp, Loader2,
} from 'lucide-react'
import { useDeal, useAcceptField, useMoveToLatent, useReviveDeal } from '../lib/queries'
import { formatCurrency, shortDate, pct } from '../lib/format'
import { isClosed } from '../lib/constants'
import { Card, Pill, Avatar, StageDot, PropensityMeter, Loading, ErrorState } from '../components/ui'
import { ProvenanceField } from '../components/ProvenanceField'
import type { TouchType } from '../data/types'

const TOUCH_ICON: Record<TouchType, typeof Phone> = {
  call: Phone, email: Mail, linkedin: Linkedin, note: StickyNote, stage: GitBranch, relay: Sparkles,
}

export function DealDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { deal, isLoading, error } = useDeal(id)
  const acceptField = useAcceptField()
  const moveToLatent = useMoveToLatent()
  const revive = useReviveDeal()
  const [latentOpen, setLatentOpen] = useState(false)
  const [reason, setReason] = useState('')

  if (isLoading) return <Loading />
  if (error) return <ErrorState error={error} />
  if (!deal) return <div className="text-secondary">Deal not found. <Link to="/pipeline" className="text-accent">Back to pipeline</Link></div>

  const touches = [...deal.touches].sort((a, b) => b.date.localeCompare(a.date))
  const isLatentStage = ['Latent Pool', 'Disqualified'].includes(deal.stage)
  const accept = (key: string) => acceptField.mutateAsync({ dealId: deal.id, key })

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[12px] text-secondary hover:text-primary mb-3">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[20px]">{deal.account}</h1>
            <Pill tone="neutral">{deal.vertical}</Pill>
            <Pill tone={deal.channel === 'Referral' ? 'green' : deal.channel === 'Cold' ? 'red' : 'neutral'}>{deal.channel}</Pill>
          </div>
          <div className="text-[13px] text-secondary mt-1">{deal.name}</div>
        </div>
        <div className="text-right">
          <div className="num text-[22px] font-medium">{formatCurrency(deal.tcv)}</div>
          <div className="flex items-center gap-1.5 justify-end mt-1 text-[12px]"><StageDot stage={deal.stage} /> {deal.stage}</div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-5 items-start">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Next step */}
          <Card className="p-4">
            <div className="flex items-center gap-1.5 mb-2 text-[11px] text-secondary">
              <ArrowRight size={13} className="text-accent" /> Next step
              {deal.nextStep.status === 'suggested' && <Pill tone="accent" icon={<Sparkles size={10} />}>Relay drafted</Pill>}
            </div>
            {deal.nextStep.status === 'empty' ? (
              <div className="text-[13px] text-amber-text">
                No next step — this is the #1 leak. Relay drafts one from the next captured call; log one via “Log a call”.
              </div>
            ) : (
              <>
                <div className="text-[14px] leading-snug">{deal.nextStep.value}</div>
                <div className="flex items-center gap-3 mt-2.5">
                  {deal.nextStepDue && (
                    <span className="inline-flex items-center gap-1 text-[12px] text-secondary"><Clock size={12} /> due {shortDate(deal.nextStepDue)}</span>
                  )}
                  {deal.nextStepOwner && (
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-secondary">
                      <Avatar name={deal.nextStepOwner} size={18} /> {deal.nextStepOwner.split(' ')[0]}
                    </span>
                  )}
                  <div className="ml-auto">
                    {deal.nextStep.status === 'confirmed' ? (
                      <span className="inline-flex items-center gap-1 text-[12px] text-green-text"><Check size={13} /> confirmed</span>
                    ) : (
                      <button
                        onClick={() => accept('next_step')}
                        disabled={acceptField.isPending}
                        className="inline-flex items-center gap-1 rounded-md bg-[var(--accent-soft)] text-accent px-2.5 py-1 text-[12px] hover:brightness-95 disabled:opacity-60"
                      >
                        {acceptField.isPending && acceptField.variables?.key === 'next_step' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Confirm
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Relay-maintained fields with provenance */}
          <Card className="p-4">
            <div className="flex items-center gap-1.5 mb-1 text-[11px] text-secondary">
              <Sparkles size={13} className="text-accent" /> Relay-maintained fields
              <span className="text-tertiary">· click a source to see the quote</span>
            </div>
            <ProvenanceField label="Problem statement" field={deal.problemStatement} onAccept={() => accept('problem_statement')} />
            <ProvenanceField label="Buying intent" field={deal.intent} onAccept={() => accept('intent')} />
            <ProvenanceField label="Budget identified" field={deal.budget} onAccept={() => accept('budget')} />
          </Card>

          {/* Contacts */}
          {deal.contacts.length > 0 && (
            <Card className="p-4">
              <div className="text-[11px] text-secondary mb-2.5">Contacts · {deal.contacts.length}</div>
              <div className="flex flex-col gap-3">
                {deal.contacts.map((c) => (
                  <div key={c.name} className="flex items-start gap-3">
                    <Avatar name={c.name} size={30} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium">{c.name}</span>
                        {c.metInPerson && <Pill tone="green">met in person</Pill>}
                      </div>
                      <div className="text-[12px] text-secondary">
                        {c.title.value || <span className="text-tertiary italic">title not captured</span>}
                        {c.seniority.value && <span className="text-tertiary"> · {c.seniority.value}</span>}
                      </div>
                      {c.warmPath && (
                        <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-accent"><Waypoints size={11} /> {c.warmPath}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Timeline */}
          <Card className="p-4">
            <div className="text-[11px] text-secondary mb-3">Activity — auto-captured</div>
            <div className="flex flex-col">
              {touches.map((t, i) => {
                const Icon = TOUCH_ICON[t.type]
                return (
                  <div key={t.id} className="flex gap-3 pb-3 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-surface flex items-center justify-center" style={{ width: 26, height: 26 }}>
                        <Icon size={13} className="text-secondary" />
                      </div>
                      {i < touches.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: 'var(--border-hairline)' }} />}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px]">{t.title}</span>
                        {t.captured === 'auto' && <Pill tone="accent" icon={<Sparkles size={9} />}>auto</Pill>}
                      </div>
                      {t.detail && <div className="text-[12px] text-secondary mt-0.5">{t.detail}</div>}
                      <div className="text-[11px] text-tertiary mt-0.5">{t.who} · {shortDate(t.date)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-5">
          {/* Propensity explainer */}
          <Card className="p-4">
            <div className="text-[11px] text-secondary mb-2">Propensity to close</div>
            <div className="flex items-center gap-2 mb-3">
              <span className="num text-[28px] font-medium" style={{ color: deal.propensity >= 0.55 ? 'var(--status-green)' : deal.propensity >= 0.3 ? 'var(--status-amber)' : 'var(--text-tertiary)' }}>
                {pct(deal.propensity)}
              </span>
              <PropensityMeter value={deal.propensity} width={64} />
            </div>
            <div className="text-[11px] text-tertiary mb-1.5">How Relay computes it</div>
            <div className="flex items-center justify-between text-[12px] py-1">
              <span className="text-secondary">{deal.stage} baseline (2yr history)</span>
              <span className="num">{pct(deal.propensityBase)}</span>
            </div>
            {deal.propensityCriteria.map((c) => (
              <div key={c.label} className="flex items-center justify-between text-[12px] py-1">
                <span className="inline-flex items-center gap-1.5">
                  {c.met ? <Check size={12} className="text-green" /> : <span className="text-tertiary">—</span>}
                  <span className="text-secondary">{c.label}</span>
                </span>
                <span className="num" style={{ color: c.delta > 0 ? 'var(--status-green)' : c.delta < 0 ? 'var(--status-red)' : 'var(--text-tertiary)' }}>
                  {c.delta === 0 ? '—' : `${c.delta > 0 ? '+' : ''}${Math.round(c.delta * 100)}%`}
                </span>
              </div>
            ))}
            <div className="hairline-t mt-1.5 pt-1.5 flex items-center justify-between text-[12px] font-medium">
              <span>Propensity</span><span className="num">{pct(deal.propensity)}</span>
            </div>
          </Card>

          {/* Ownership */}
          <Card className="p-4">
            <div className="text-[11px] text-secondary mb-2.5">Ownership</div>
            <OwnerRow label="Deal owner" name={deal.seller} tone="accent" />
            {deal.sdr && <OwnerRow label="SDR" name={deal.sdr} />}
            {deal.solutioner && <OwnerRow label="Solutioning" name={deal.solutioner} tone="green" />}
          </Card>

          {/* Follow-up composer */}
          <Card className="p-4">
            <div className="flex items-center gap-1.5 mb-2 text-[11px] text-secondary"><Send size={12} className="text-accent" /> Rich follow-up</div>
            <p className="text-[12px] text-secondary leading-snug mb-2.5">
              Relay assembles case studies + M1 intel + a custom demo — not a one-line “want to talk?” nudge.
            </p>
            <button className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-accent text-white px-3 py-2 text-[12px] hover:brightness-110">
              <Sparkles size={13} /> Draft follow-up
            </button>
          </Card>

          {/* Latent gate */}
          {isLatentStage ? (
            <Card className="p-4">
              <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-amber-text"><ShieldQuestion size={13} /> Latent-pool review</div>
              <p className="text-[12px] text-secondary leading-snug">
                Relay flags this as thin follow-up. {deal.latentReason && `Reason on file: “${deal.latentReason}.”`} Needs sign-off before it stays latent.
              </p>
              <div className="flex gap-2 mt-2.5">
                <button
                  onClick={() => revive.mutate({ dealId: deal.id })}
                  disabled={revive.isPending}
                  className="flex-1 rounded-md bg-[var(--accent-soft)] text-accent px-2 py-1.5 text-[12px] inline-flex items-center justify-center gap-1 disabled:opacity-60"
                >
                  {revive.isPending ? <Loader2 size={12} className="animate-spin" /> : <TrendingUp size={12} />} Revive
                </button>
                <span className="flex-1 rounded-md hairline px-2 py-1.5 text-[12px] text-secondary inline-flex items-center justify-center gap-1">
                  <Check size={12} /> Confirmed latent
                </span>
              </div>
            </Card>
          ) : !isClosed(deal.stage) ? (
            latentOpen ? (
              <Card className="p-4 fade-up">
                <div className="text-[11px] text-secondary mb-1.5">Why is this going latent?</div>
                <p className="text-[12px] text-amber-text mb-2">
                  Relay counted {deal.touches.length} touches. Sign-off rule: a reason is required before a lead the team worked is written off.
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (required)…"
                  className="w-full hairline rounded-md p-2 text-[12px] bg-card outline-none resize-none"
                  rows={2}
                />
                {moveToLatent.isError && (
                  <div className="mt-1.5 text-[11px] text-red-text">{(moveToLatent.error as Error).message}</div>
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => moveToLatent.mutate({ dealId: deal.id, reason }, { onSuccess: () => { setLatentOpen(false); setReason('') } })}
                    disabled={moveToLatent.isPending || !reason.trim()}
                    className="flex-1 rounded-md bg-surface text-secondary px-2 py-1.5 text-[12px] inline-flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {moveToLatent.isPending ? <Loader2 size={12} className="animate-spin" /> : <ShieldQuestion size={12} />} Move to latent
                  </button>
                  <button onClick={() => { setLatentOpen(false); setReason('') }} className="rounded-md hairline px-2.5 py-1.5 text-[12px] text-secondary">Cancel</button>
                </div>
              </Card>
            ) : (
              <button
                onClick={() => setLatentOpen(true)}
                className="text-[12px] text-tertiary hover:text-secondary text-left inline-flex items-center gap-1.5"
              >
                <ShieldQuestion size={13} /> Move to latent pool…
              </button>
            )
          ) : null}
        </div>
      </div>
    </div>
  )
}

function OwnerRow({ label, name, tone }: { label: string; name: string; tone?: 'accent' | 'green' }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <Avatar name={name} size={22} />
      <div className="min-w-0">
        <div className="text-[12px] font-medium truncate">{name}</div>
        <div className="text-[10px] text-tertiary">{label}</div>
      </div>
      {tone && <span className="ml-auto"><Pill tone={tone}>owner</Pill></span>}
    </div>
  )
}
