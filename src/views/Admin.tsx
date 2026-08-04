import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Download, RefreshCw, Gauge, Loader2, Check, CircleAlert, Sparkles, Clock, Terminal,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Card, Pill, Loading } from '../components/ui'

type Status = {
  counts: { pending: number; extracted: number; internal: number; unreviewed: number; deals: number; linked: number }
  runs: { job: string; status: string; detail: Record<string, unknown> | null; triggered_by: string; started_at: string; finished_at: string | null }[]
}

async function callAdmin(action: string) {
  const { data, error } = await supabase.functions.invoke(`relay-admin?action=${action}`, { method: 'GET' })
  if (error) throw error
  return data
}

export function Admin() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery<Status>({
    queryKey: ['admin-status'],
    queryFn: () => callAdmin('status'),
    refetchInterval: 20_000,
  })
  const [busy, setBusy] = useState<string | null>(null)
  const [result, setResult] = useState<{ job: string; text: string; ok: boolean } | null>(null)

  const run = async (job: string, label: string) => {
    setBusy(job); setResult(null)
    try {
      const r = await callAdmin(job)
      const bits = Object.entries(r as Record<string, unknown>)
        .filter(([k]) => !['ok'].includes(k))
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
        .join(' · ')
      setResult({ job, text: `${label} — ${bits || 'done'}`, ok: true })
    } catch (e) {
      setResult({ job, text: `${label} failed: ${String(e)}`, ok: false })
    } finally {
      setBusy(null)
      qc.invalidateQueries({ queryKey: ['admin-status'] })
      qc.invalidateQueries({ queryKey: ['deals'] })
      qc.invalidateQueries({ queryKey: ['captures'] })
    }
  }

  if (isLoading) return <Loading />
  const c = data?.counts

  const actions = [
    { job: 'pull-transcripts', label: 'Pull transcripts', icon: Download,
      desc: 'Fetch new GoodMeetings calls into staging. Runs daily at 11:00 UTC — this forces it now.' },
    { job: 'sync-deals', label: 'Sync deals from Monday', icon: RefreshCw,
      desc: 'Refresh the deal list and linkage dropdown from the Monday board.' },
    { job: 'refresh-propensity', label: 'Recompute propensity', icon: Gauge,
      desc: 'Re-apply stage baselines and accepted criteria across all deals.' },
  ]

  return (
    <div>
      <h1 className="text-[20px] mb-1">Admin</h1>
      <p className="text-[13px] text-secondary mb-5">
        Trigger the pipeline on demand. Everything here runs server-side — no laptop required.
      </p>

      {/* status */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        <Stat label="Transcripts pending" value={c?.pending ?? 0} tone={c?.pending ? 'amber' : undefined} />
        <Stat label="Extracted" value={c?.extracted ?? 0} />
        <Stat label="Awaiting review" value={c?.unreviewed ?? 0} tone={c?.unreviewed ? 'accent' : undefined} />
        <Stat label="Deals" value={c?.deals ?? 0} />
        <Stat label="Calls deal-linked" value={c?.linked ?? 0} />
      </div>

      {/* actions */}
      <div className="flex flex-col gap-2 mb-5">
        {actions.map((a) => (
          <Card key={a.job} className="p-4 flex items-center gap-4">
            <div className="rounded-md flex items-center justify-center shrink-0"
              style={{ width: 34, height: 34, background: 'var(--accent-soft)' }}>
              <a.icon size={16} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium">{a.label}</div>
              <div className="text-[12px] text-secondary mt-0.5">{a.desc}</div>
            </div>
            <button
              onClick={() => run(a.job, a.label)}
              disabled={!!busy}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-accent text-white px-3 py-1.5 text-[12px] hover:brightness-110 disabled:opacity-50"
            >
              {busy === a.job ? <Loader2 size={13} className="animate-spin" /> : <a.icon size={13} />}
              {busy === a.job ? 'Running…' : 'Run now'}
            </button>
          </Card>
        ))}
      </div>

      {result && (
        <div className={`rounded-md p-3 mb-5 text-[12px] flex items-start gap-2 ${result.ok ? 'bg-[var(--status-green-bg)]' : 'bg-[var(--status-red-bg)]'}`}>
          {result.ok ? <Check size={14} className="text-green-text mt-0.5 shrink-0" />
                     : <CircleAlert size={14} className="text-red-text mt-0.5 shrink-0" />}
          <span style={{ color: result.ok ? 'var(--status-green-text)' : 'var(--status-red-text)' }}>{result.text}</span>
        </div>
      )}

      {/* extraction — the one step that needs Claude */}
      <div className="rounded-lg p-4 mb-5 bg-card" style={{ border: '1px solid var(--accent)' }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles size={14} className="text-accent" />
          <span className="text-[13px] font-medium">Extraction queue</span>
          {c?.pending ? <Pill tone="amber">{c.pending} waiting</Pill> : <Pill tone="green">clear</Pill>}
        </div>
        <p className="text-[12px] text-secondary leading-relaxed">
          Tagging transcripts against the taxonomy runs on Claude, not on the server — there’s no API key in the
          pipeline by design. Pulling stages the transcripts automatically; the extraction happens in a Claude
          session. {c?.pending ? `There are ${c.pending} transcripts staged and ready.` : 'Nothing is waiting right now.'}
        </p>
        {!!c?.pending && (
          <div className="mt-2.5 rounded-md bg-surface p-2.5 flex items-center gap-2">
            <Terminal size={13} className="text-tertiary shrink-0" />
            <code className="text-[11.5px] text-primary">Process the {c.pending} pending Relay transcripts</code>
          </div>
        )}
      </div>

      {/* recent runs */}
      <div className="text-[11px] text-secondary mb-2">Recent runs</div>
      <Card className="p-0 overflow-hidden">
        {(data?.runs ?? []).length === 0 && <div className="p-4 text-[12px] text-tertiary">No runs yet.</div>}
        {(data?.runs ?? []).map((r, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: i ? '0.5px solid var(--border-hairline)' : 'none' }}>
            <span className="text-[12px] font-medium w-[150px] shrink-0">{r.job.replace(/-/g, ' ')}</span>
            {r.status === 'ok' ? <Pill tone="green" icon={<Check size={9} />}>ok</Pill>
              : r.status === 'error' ? <Pill tone="red">error</Pill>
              : <Pill tone="amber">running</Pill>}
            <span className="text-[11px] text-secondary flex-1 truncate">
              {r.detail ? Object.entries(r.detail).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' · ') : ''}
            </span>
            <span className="text-[11px] text-tertiary shrink-0 inline-flex items-center gap-1">
              <Clock size={10} />{new Date(r.started_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </span>
            <span className="text-[10px] text-tertiary shrink-0 w-[110px] truncate text-right">{r.triggered_by}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'amber' | 'accent' }) {
  const color = tone === 'amber' ? 'var(--status-amber-text)' : tone === 'accent' ? 'var(--accent)' : 'var(--text-primary)'
  return (
    <div className="bg-surface rounded-lg px-3.5 py-3">
      <div className="text-[11px] text-secondary">{label}</div>
      <div className="num text-[22px] font-medium mt-0.5" style={{ color }}>{value}</div>
    </div>
  )
}
