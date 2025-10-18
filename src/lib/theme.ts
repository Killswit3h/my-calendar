import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const THEME_STORAGE_KEY = 'gfc-theme'

export const BRAND_COLORS = {
  accent: '#2F6E3D',
  accent600: '#24532D',
  accent200: '#C3E6CC',
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number, options: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1, ...options }).format(value)
}

export function percentChange(current: number, previous: number) {
  if (!previous) return 0
  return ((current - previous) / previous) * 100
}
