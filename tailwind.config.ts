import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.tsx'
  ],
  theme: {
    extend: {
      colors: {
        fg: 'var(--fg)',
        'fg-muted': 'var(--fg-muted)',
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        elevated: 'var(--elevated)',
        border: 'var(--border)',
        'border-subtle': 'var(--border-subtle)',
        accent: {
          400: 'var(--accent-400)',
          500: 'var(--accent-500)',
          600: 'var(--accent-600)'
        },
        status: {
          danger: 'var(--danger)',
          warn: 'var(--warn)',
          success: 'var(--success)'
        }
      },
      borderRadius: {
        control: '12px',
        card: '12px',
        modal: '16px',
        pill: '999px'
      },
      boxShadow: {
        level1: '0 2px 6px rgba(0,0,0,.25)',
        level2: '0 8px 20px rgba(0,0,0,.35)',
        level3: '0 24px 60px rgba(0,0,0,.45)'
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.45' }],
        sm: ['14px', { lineHeight: '1.45' }],
        base: ['16px', { lineHeight: '1.45' }],
        lg: ['20px', { lineHeight: '1.2' }],
        xl: ['24px', { lineHeight: '1.2' }],
        '2xl': ['32px', { lineHeight: '1.2' }]
      },
      fontWeight: { normal: '400', medium: '500', semibold: '600' },
      transitionDuration: { hover: '160ms', open: '240ms' },
      screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' }
    }
  },
  plugins: []
}
export default config
