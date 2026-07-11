import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, Kanban, Inbox, Waypoints, Building2, Search, Sparkles, Command, Mic, LogOut } from 'lucide-react'
import { AskRelay } from './AskRelay'
import { LogCall } from './LogCall'
import { Avatar } from './ui'
import { useAuth } from '../lib/auth'
import { useCaptures } from '../lib/queries'

export function Shell({ children }: { children: ReactNode }) {
  const [askOpen, setAskOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const location = useLocation()
  const { userName, signOut } = useAuth()
  const { data: captures } = useCaptures()
  const unreviewed = captures?.filter((c) => !c.reviewed).length ?? 0

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setAskOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const nav = [
    { to: '/', label: 'Today', icon: Home, end: true, badge: 0 },
    { to: '/pipeline', label: 'Pipeline', icon: Kanban, badge: 0 },
    { to: '/capture', label: 'Capture', icon: Inbox, badge: unreviewed },
    { to: '/relationships', label: 'Warm paths', icon: Waypoints, badge: 0 },
    { to: '/accounts', label: 'Accounts', icon: Building2, badge: 0 },
  ]

  return (
    <div className="flex h-full">
      <aside className="w-56 shrink-0 bg-card flex flex-col" style={{ borderRight: '0.5px solid var(--border-hairline)' }}>
        <div className="px-4 py-4 flex items-center gap-2">
          <div className="rounded-md flex items-center justify-center" style={{ width: 26, height: 26, background: 'var(--accent)' }}>
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <div className="text-[14px] font-medium leading-none">Relay</div>
            <div className="text-[10px] text-tertiary mt-0.5">MathCo · GTM</div>
          </div>
        </div>

        <button
          onClick={() => setAskOpen(true)}
          className="mx-3 mb-2 flex items-center gap-2 rounded-md hairline px-2.5 py-2 text-secondary hover:bg-hover transition-colors"
        >
          <Search size={14} />
          <span className="text-[12px]">Ask Relay…</span>
          <span className="ml-auto flex items-center gap-0.5 text-[10px] text-tertiary"><Command size={10} />K</span>
        </button>

        <button
          onClick={() => setLogOpen(true)}
          className="mx-3 mb-3 flex items-center gap-2 rounded-md px-2.5 py-2 text-white hover:brightness-110 transition-all"
          style={{ background: 'var(--accent)' }}
        >
          <Mic size={14} />
          <span className="text-[12px]">Log a call</span>
        </button>

        <nav className="px-2 flex flex-col gap-0.5">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                  isActive ? 'bg-surface text-primary font-medium' : 'text-secondary hover:bg-hover'
                }`
              }
            >
              <n.icon size={15} />
              {n.label}
              {n.badge ? (
                <span className="ml-auto num rounded-full bg-accent text-white text-[10px] px-1.5 py-0.5 leading-none">{n.badge}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto p-3 hairline-t flex items-center gap-2">
          <Avatar name={userName} size={28} />
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-medium truncate">{userName}</div>
            <div className="text-[10px] text-tertiary truncate">Growth / GTM lead</div>
          </div>
          <button onClick={() => signOut()} title="Sign out" className="text-tertiary hover:text-secondary p-1">
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      <main key={location.pathname} className="flex-1 overflow-y-auto fade-up">
        <div className="max-w-5xl mx-auto px-8 py-7">{children}</div>
      </main>

      <AskRelay open={askOpen} onClose={() => setAskOpen(false)} />
      <LogCall open={logOpen} onClose={() => setLogOpen(false)} />
    </div>
  )
}
