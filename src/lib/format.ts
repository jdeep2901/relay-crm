export function formatCurrency(n: number): string {
  if (n < 1000) return `$${n}`
  if (n < 1_000_000) return `$${Math.round(n / 1000)}K`
  return `$${(n / 1_000_000).toFixed(2)}M`
}

// The pipeline's "today" anchor. Data is seeded relative to this date.
export const TODAY_ISO = '2026-07-11'

export function daysAgo(iso: string): number {
  if (!iso) return 0
  const then = new Date(iso + 'T00:00:00').getTime()
  const now = new Date(TODAY_ISO + 'T00:00:00').getTime()
  return Math.round((now - then) / 86_400_000)
}

export function relDate(iso: string): string {
  const d = daysAgo(iso)
  if (d === 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 0) return `in ${Math.abs(d)}d`
  if (d < 14) return `${d}d ago`
  if (d < 60) return `${Math.round(d / 7)}w ago`
  return `${Math.round(d / 30)}mo ago`
}

export function shortDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

export function initials(name: string): string {
  return name
    .replace(/\(.*\)/, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}
