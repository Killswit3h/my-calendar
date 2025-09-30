// Central app design tokens (TypeScript side) used by Tailwind and UI primitives

export const Typography = {
  fontStack: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif`,
  sizes: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '32px',
  },
  weights: { regular: '400', medium: '500', semibold: '600' },
  lineHeights: { tight: '1.2', normal: '1.45' },
} as const;

export const Spacing = {
  // 8-pt grid with some mid steps
  s8: '8px',
  s12: '12px',
  s16: '16px',
  s24: '24px',
  s32: '32px',
} as const;

export const Radii = {
  control: '12px',
  card: '12px',
  modal: '16px',
  pill: '999px',
} as const;

export const Shadows = {
  level1: '0 2px 6px rgba(0,0,0,.25)',
  level2: '0 8px 20px rgba(0,0,0,.35)',
  level3: '0 24px 60px rgba(0,0,0,.45)',
} as const;

export const Motion = {
  hoverMs: 160,
  openMs: 240,
  easing: 'cubic-bezier(.2,.8,.2,1)',
} as const;

export const Breakpoints = { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' } as const;

export const ColorRoles = {
  // These reference CSS variables in tokens.css
  fg: 'var(--fg)',
  fgMuted: 'var(--fg-muted)',
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  elevated: 'var(--elevated)',
  border: 'var(--border)',
  borderSubtle: 'var(--border-subtle)',
  accent400: 'var(--accent-400)',
  accent500: 'var(--accent-500)',
  accent600: 'var(--accent-600)',
  danger: 'var(--danger)',
  warn: 'var(--warn)',
  success: 'var(--success)',
  ring: 'var(--ring-outline)',
} as const;

export const Density = {
  comfortable: { row: 44, control: 44 },
  compact: { row: 32, control: 36 },
} as const;

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

