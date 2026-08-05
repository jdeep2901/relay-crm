import { useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Kanban, Inbox, Sparkles, LogOut,
  PanelLeftClose, PanelLeftOpen, Settings2, Flame, BookOpen,
} from 'lucide-react'
import { Avatar } from './ui'
import { useAuth } from '../lib/auth'
import { useCaptures } from '../lib/queries'

export function Shell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('relay-nav-collapsed') === '1')
  const location = useLocation()
  const { userName, signOut, session } = useAuth()
  const { data: captures } = useCaptures()
  const unreviewed = captures?.filter((c) => !c.reviewed).length ?? 0

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem('relay-nav-collapsed', c ? '0' : '1')
      return !c
    })
  }

  // Only surface screens that are live and part of the workflow.
  // Routes for hidden screens still resolve by URL — they're just off the nav.
  const isOwner = ['allam.jaideep@gmail.com', 'jaideep', 'jd'].includes(
    (session?.user?.email ?? '').toLowerCase(),
  )
  const nav = [
    { to: '/priority', label: 'Priority', icon: Flame, badge: 0 },
    { to: '/capture', label: 'Capture', icon: Inbox, badge: unreviewed },
    { to: '/pipeline', label: 'Pipeline', icon: Kanban, badge: 0 },
    { to: '/guide', label: 'User guide', icon: BookOpen, badge: 0 },
    ...(isOwner ? [{ to: '/admin', label: 'Admin', icon: Settings2, badge: 0 }] : []),
  ]

  return (
    <div className="flex h-full">
      <aside
        className={`${collapsed ? 'w-14' : 'w-56'} shrink-0 bg-card flex flex-col transition-all duration-200`}
        style={{ borderRight: '0.5px solid var(--border-hairline)' }}
      >
        <div className={`py-4 mb-2 flex items-center ${collapsed ? 'justify-center px-0' : 'gap-2 px-4'}`}>
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

        <nav className="px-2 flex flex-col gap-0.5">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
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
    </div>
  )
}
