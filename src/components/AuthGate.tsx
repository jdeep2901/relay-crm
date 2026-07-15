import { useState, type ReactNode } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from '../lib/auth'

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-tertiary">
        <Loader2 size={18} className="animate-spin" />
      </div>
    )
  }
  if (!session) return <Login />
  return <>{children}</>
}

function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await signIn(email.trim(), password)
    if (error) setError(error)
    setBusy(false)
  }

  return (
    <div className="h-full flex items-center justify-center px-4 bg-page">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="rounded-md flex items-center justify-center" style={{ width: 30, height: 30, background: 'var(--accent)' }}>
            <Sparkles size={17} className="text-white" />
          </div>
          <div>
            <div className="text-[16px] font-medium leading-none">Relay</div>
            <div className="text-[10px] text-tertiary mt-1">MathCo · GTM</div>
          </div>
        </div>

        <form onSubmit={submit} className="bg-card hairline rounded-xl p-6 flex flex-col gap-3">
          <div>
            <div className="text-[15px] font-medium">Sign in</div>
            <div className="text-[12px] text-secondary mt-0.5">Your pipeline is private — data loads only after you log in.</div>
          </div>
          <label className="text-[11px] text-secondary">
            Name
            <input
              type="text" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
              placeholder="e.g. swetha"
              className="mt-1 w-full hairline rounded-md px-2.5 py-2 text-[13px] bg-card outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="text-[11px] text-secondary">
            Password
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="mt-1 w-full hairline rounded-md px-2.5 py-2 text-[13px] bg-card outline-none focus:border-[var(--accent)]"
            />
          </label>
          {error && <div className="text-[12px] text-red-text bg-red-bg rounded-md px-2.5 py-1.5">{error}</div>}
          <button
            type="submit" disabled={busy}
            className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-accent text-white px-3 py-2 text-[13px] hover:brightness-110 disabled:opacity-60"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
