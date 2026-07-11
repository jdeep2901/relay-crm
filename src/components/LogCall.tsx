import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, X, Sparkles, Loader2, CircleAlert } from 'lucide-react'
import { useDeals, useLogCall } from '../lib/queries'

// Manual capture for 1-1 calls with no notetaker. True to the thesis: you paste
// raw notes, Relay extracts the fields — you never fill a form.
export function LogCall({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { data: deals } = useDeals()
  const logCall = useLogCall()

  const [title, setTitle] = useState('')
  const [dealId, setDealId] = useState('')
  const [account, setAccount] = useState('')
  const [raw, setRaw] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  function reset() {
    setTitle(''); setDealId(''); setAccount(''); setRaw(''); setError(null)
  }

  async function submit() {
    setError(null)
    if (!raw.trim()) { setError('Paste your call notes or a transcript first.'); return }
    try {
      const linked = deals?.find((d) => d.id === dealId)
      const res = await logCall.mutateAsync({
        rawText: raw,
        title: title.trim() || (linked ? `${linked.account} · logged call` : 'Logged call'),
        dealId: dealId || undefined,
        accountName: linked?.account ?? (account.trim() || undefined),
      })
      reset()
      onClose()
      navigate('/capture', { state: { focus: res.captureId } })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const busy = logCall.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-black/25" onClick={busy ? undefined : onClose}>
      <div className="w-full max-w-xl bg-card hairline rounded-xl overflow-hidden fade-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 px-4 py-3 hairline-b">
          <Mic size={16} className="text-accent" />
          <span className="text-[14px] font-medium">Log a call</span>
          <span className="text-[11px] text-tertiary">· 1-1 with no notetaker</span>
          <button onClick={onClose} disabled={busy} className="ml-auto text-tertiary hover:text-secondary disabled:opacity-40"><X size={16} /></button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[11px] text-secondary">
              Link to deal
              <select
                value={dealId} onChange={(e) => setDealId(e.target.value)}
                className="mt-1 w-full hairline rounded-md px-2 py-2 text-[12px] bg-card outline-none"
              >
                <option value="">— new / prospect —</option>
                {deals?.map((d) => <option key={d.id} value={d.id}>{d.account} · {d.name}</option>)}
              </select>
            </label>
            {dealId ? (
              <label className="text-[11px] text-secondary">
                Title
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Call summary"
                  className="mt-1 w-full hairline rounded-md px-2.5 py-2 text-[12px] bg-card outline-none" />
              </label>
            ) : (
              <label className="text-[11px] text-secondary">
                Prospect / account
                <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="e.g. Kargil"
                  className="mt-1 w-full hairline rounded-md px-2.5 py-2 text-[12px] bg-card outline-none" />
              </label>
            )}
          </div>

          <label className="text-[11px] text-secondary">
            Raw notes or transcript
            <textarea
              value={raw} onChange={(e) => setRaw(e.target.value)} rows={7} disabled={busy}
              placeholder="Paste whatever you have — messy is fine. Relay pulls out the problem statement, intent, budget signal, contacts, and drafts the next step."
              className="mt-1 w-full hairline rounded-md p-2.5 text-[13px] bg-card outline-none resize-none leading-snug"
            />
          </label>

          {error && (
            <div className="flex items-center gap-1.5 text-[12px] text-red-text bg-red-bg rounded-md px-2.5 py-1.5">
              <CircleAlert size={13} /> {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-tertiary">Nothing is written to a deal until you accept in Capture.</span>
            <button
              onClick={submit} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent text-white px-3.5 py-2 text-[13px] hover:brightness-110 disabled:opacity-60"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {busy ? 'Relay is reading…' : 'Extract fields'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
