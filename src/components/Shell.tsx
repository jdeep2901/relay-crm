import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, Kanban, Inbox, Waypoints, Building2, Search, Sparkles, Command } from 'lucide-react'
import { AskRelay } from './AskRelay'
import { Avatar } from './ui'
import { CURRENT_USER } from '../data/mock'
import { CAPTURE } from '../data/mock'

const NAV = [
  { to: '/', label: 'Today', icon: Home, end: true },
  { to: '/pipeline', label: 'Pipeline', icon: Kanban },
  { to: '/capture', label: 'Capture', icon: Inbox, badge: CAPTURE.filter((c) => !c.reviewed).length },
  { to: '/relationships', label: 'Warm paths', icon: Waypoints },
  { to: '/accounts', label: 'Accounts', icon: Building2 },
]

export function Shell({ children }: { children: ReactNode }) {
  const [askOpen, setAskOpen] = useState(false)
  const location = useLocation()

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

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 hairline-r bg-card flex flex-col" style={{ borderRight: '0.5px solid var(--border-hairline)' }}>
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
          className="mx-3 mb-3 flex items-center gap-2 rounded-md hairline px-2.5 py-2 text-secondary hover:bg-hover transition-colors"
        >
          <Search size={14} />
          <span className="text-[12px]">Ask Relay…</span>
          <span className="ml-auto flex items-center gap-0.5 text-[10px] text-tertiary">
            <Command size={10} />K
          </span>
        </button>

        <nav className="px-2 flex flex-col gap-0.5">
          {NAV.map((n) => (
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
          <Avatar name={CURRENT_USER.name} size={28} />
          <div className="min-w-0">
            <div className="text-[12px] font-medium truncate">{CURRENT_USER.name}</div>
            <div className="text-[10px] text-tertiary truncate">{CURRENT_USER.role}</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main key={location.pathname} className="flex-1 overflow-y-auto fade-up">
        <div className="max-w-5xl mx-auto px-8 py-7">{children}</div>
      </main>

      <AskRelay open={askOpen} onClose={() => setAskOpen(false)} />
    </div>
  )
}
