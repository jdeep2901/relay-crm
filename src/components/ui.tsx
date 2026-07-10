import type { ReactNode } from 'react'
import { initials } from '../lib/format'

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-card hairline rounded-lg ${onClick ? 'cursor-pointer hover:bg-hover transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

// ── Section label ────────────────────────────────────────────────────────────
export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`text-[11px] text-secondary ${className}`}>{children}</div>
}

// ── Pill ─────────────────────────────────────────────────────────────────────
type Tone = 'neutral' | 'red' | 'amber' | 'green' | 'accent'
const toneMap: Record<Tone, string> = {
  neutral: 'bg-surface text-secondary',
  red: 'bg-red-bg text-red-text',
  amber: 'bg-amber-bg text-amber-text',
  green: 'bg-green-bg text-green-text',
  accent: 'bg-[var(--accent-soft)] text-accent',
}
export function Pill({ children, tone = 'neutral', icon }: { children: ReactNode; tone?: Tone; icon?: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-[7px] py-[2px] text-[11px] leading-none ${toneMap[tone]}`}>
      {icon}
      {children}
    </span>
  )
}

// ── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 24 }: { name: string; size?: number }) {
  const hues = ['#635BFF', '#0EA5E9', '#16A34A', '#D97706', '#DB2777', '#7C3AED']
  const hue = hues[name.charCodeAt(0) % hues.length]
  return (
    <div
      className="inline-flex items-center justify-center rounded-full text-white font-medium shrink-0"
      style={{ width: size, height: size, background: hue, fontSize: size * 0.4 }}
      title={name}
    >
      {initials(name)}
    </div>
  )
}

// ── Propensity meter ─────────────────────────────────────────────────────────
export function PropensityMeter({ value, width = 40 }: { value: number; width?: number }) {
  const color = value >= 0.55 ? 'var(--status-green)' : value >= 0.3 ? 'var(--status-amber)' : 'var(--text-tertiary)'
  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="rounded-full bg-surface overflow-hidden" style={{ width, height: 4 }}>
        <div className="h-full rounded-full" style={{ width: `${value * 100}%`, background: color }} />
      </div>
      <span className="num text-[11px]" style={{ color }}>{Math.round(value * 100)}</span>
    </div>
  )
}

// ── Confidence-based provenance chip ─────────────────────────────────────────
export function StageDot({ stage }: { stage: string }) {
  const map: Record<string, string> = {
    Intro: '#9CA3AF',
    Qualification: '#0EA5E9',
    Capability: '#6366F1',
    'Problem Scoping': '#7C3AED',
    Proposal: '#D97706',
    Contracting: '#DB2777',
    Won: '#16A34A',
    Lost: '#DC2626',
    'Latent Pool': '#9CA3AF',
    Disqualified: '#DC2626',
  }
  return <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: map[stage] || '#9CA3AF' }} />
}
