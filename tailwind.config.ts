import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'var(--bg-page)',
        card: 'var(--bg-card)',
        surface: 'var(--bg-surface)',
        hover: 'var(--bg-hover)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',
        hairline: 'var(--border-hairline)',
        emphasis: 'var(--border-emphasis)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        red: 'var(--status-red)',
        'red-bg': 'var(--status-red-bg)',
        'red-text': 'var(--status-red-text)',
        amber: 'var(--status-amber)',
        'amber-bg': 'var(--status-amber-bg)',
        'amber-text': 'var(--status-amber-text)',
        green: 'var(--status-green)',
        'green-bg': 'var(--status-green-bg)',
        'green-text': 'var(--status-green-text)',
      },
      borderRadius: { sm: '6px', md: '8px', lg: '12px', xl: '16px' },
      fontfamily: {},
    },
  },
  plugins: [],
} satisfies Config
