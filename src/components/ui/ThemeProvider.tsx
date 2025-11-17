'use client'

import * as React from 'react'
import { ThemeProvider as NextThemes } from 'next-themes'

type ThemeProviderProps = {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemes attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
    </NextThemes>
  )
}
