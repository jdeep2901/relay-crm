import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Home, Kanban, Inbox, Waypoints, Building2, Search, Sparkles, Command, Mic, LogOut,
  CalendarClock, PanelLeftClose, PanelLeftOpen, Settings2,
} from 'lucide-react'
import { AskRelay } from './AskRelay'
import { LogCall } from './LogCall'
import { Avatar } from './ui'
import { useAuth } from '../lib/auth'
import { useCaptures, useDeals } from '../lib/queries'
import { TODAY_ISO } from '../lib/format'

export function Shell({ children }: { children: ReactNode }) {
  const [askOpen, setAskOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('relay-nav-collapsed') === '1')
  const location = useLocation()
  const { userName, signOut } = useAuth()
  const { data: captures } = useCaptures()
  const { data: deals } = useDeals()
  const unreviewed = captures?.filter((c) => !c.reviewed).length ?? 0
  const weekEnd = new Date(new Date(TODAY_ISO + 'T00:00:00').getTime() + 7 * 86_400_000).toISOString().slice(0, 10)
  const upcoming = deals?.filter((d) => d.nextMeetingDate && d.nextMeetingDate >= TODAY_ISO && d.nextMeetingDate <= weekEnd).length ?? 0

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem('relay-nav-collapsed', c ? '0' : '1')
      return !c
    })
  }

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
    { to: '/precall', label: 'Pre-call', icon: CalendarClock, badge: upcoming },
    { to: '/capture', label: 'Capture', icon: Inbox, badge: unreviewed },
    { to: '/relationships', label: 'Warm paths', icon: Waypoints, badge: 0 },
    { to: '/accounts', label: 'Accounts', icon: Building2, badge: 0 },
    { to: '/admin', label: 'Admin', icon: Settings2, badge: 0 },
  ]

  return (
    <div className="flex h-full">
      <aside
        className={`${collapsed ? 'w-14' : 'w-56'} shrink-0 bg-card flex flex-col transition-all duration-200`}
        style={{ borderRight: '0.5px solid var(--border-hairline)' }}
      >
        <div className={`py-4 flex items-center ${collapsed ? 'justify-center px-0' : 'gap-2 px-4'}`}>
          <div className="rounded-md flex items-center justify-center shrink-0" style={{ width: 26, height: 26, background: 'var(--accent)' }}>
            <Sparkles size={15} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[14px] font-medium leading-none">Relay</div>
              <div className="text-[10px] text-tertiary mt-0.5">MathCo · GTM</div>
            </div>
          )}
        </div>

        <button
          onClick={() => setAskOpen(true)}
          title="Ask Relay (⌘K)"
          className={`${collapsed ? 'mx-2 justify-center' : 'mx-3'} mb-2 flex items-center gap-2 rounded-md hairline px-2.5 py-2 text-secondary hover:bg-hover transition-colors`}
        >
          <Search size={14} className="shrink-0" />
          {!collapsed && (
            <>
              <span className="text-[12px]">Ask Relay…</span>
              <span className="ml-auto flex items-center gap-0.5 text-[10px] text-tertiary"><Command size={10} />K</span>
            </>
          )}
        </button>

        <button
          onClick={() => setLogOpen(true)}
          title="Log a call"
          className={`${collapsed ? 'mx-2 justify-center' : 'mx-3'} mb-3 flex items-center gap-2 rounded-md px-2.5 py-2 text-white hover:brightness-110 transition-all`}
          style={{ background: 'var(--accent)' }}
        >
          <Mic size={14} className="shrink-0" />
          {!collapsed && <span className="text-[12px]">Log a call</span>}
        </button>

        <nav className="px-2 flex flex-col gap-0.5">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              title={collapsed ? n.label : undefined}
              className={({ isActive }) =>
                `relative flex items-center rounded-md py-1.5 text-[13px] transition-colors ${
                  collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5'
                } ${isActive ? 'bg-surface text-primary font-medium' : 'text-secondary hover:bg-hover'}`
              }
            >
              <n.icon size={15} className="shrink-0" />
              {!collapsed && n.label}
              {n.badge ? (
                collapsed ? (
                  <span className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
                ) : (
                  <span className="ml-auto num rounded-full bg-accent text-white text-[10px] px-1.5 py-0.5 leading-none">{n.badge}</span>
                )
              ) : null}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`mt-3 ${collapsed ? 'mx-2 justify-center' : 'mx-3'} flex items-center gap-2 rounded-md px-2.5 py-1.5 text-tertiary hover:text-secondary hover:bg-hover transition-colors`}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          {!collapsed && <span className="text-[12px]">Collapse</span>}
        </button>

        <div className={`mt-auto p-3 hairline-t flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
          <Avatar name={userName} size={28} />
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-medium truncate">{userName}</div>
                <div className="text-[10px] text-tertiary truncate">Growth / GTM lead</div>
              </div>
              <button onClick={() => signOut()} title="Sign out" className="text-tertiary hover:text-secondary p-1">
                <LogOut size={14} />
              </button>
            </>
          )}
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
