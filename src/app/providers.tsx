"use client"

import { useTheme as useNextTheme } from 'next-themes'
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { createAppTheme, type Accent } from '../theme'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { ToastViewport } from '@/components/ui/Toast'

interface AccentCtx {
  accent: Accent
  setAccent: (accent: Accent) => void
}

const AccentColorContext = createContext<AccentCtx>({ accent: 'forest', setAccent: () => {} })

export function useAccentColor() {
  return useContext(AccentColorContext)
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
})

function MuiBridge({ accent, children }: { accent: Accent; children: React.ReactNode }) {
  const { resolvedTheme } = useNextTheme()
  const mode = resolvedTheme === 'light' || resolvedTheme === 'dark' ? resolvedTheme : 'light'
  const theme = useMemo(() => createAppTheme(accent, mode), [accent, mode])

  useEffect(() => {
    document.documentElement.dataset.mode = mode
  }, [mode])

  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [accent, setAccent] = useState<Accent>('forest')

  useEffect(() => {
    const stored = window.localStorage.getItem('accent-color')
    if (stored === 'forest' || stored === 'blue' || stored === 'gray') {
      setAccent(stored)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('accent-color', accent)
  }, [accent])

  return (
    <AccentColorContext.Provider value={{ accent, setAccent }}>
      <ThemeProvider>
        <MuiBridge accent={accent}>
          <CssBaseline enableColorScheme />
          <QueryClientProvider client={queryClient}>
            {children}
            <ToastViewport />
            {process.env.NODE_ENV !== 'production' ? <ReactQueryDevtools initialIsOpen={false} /> : null}
          </QueryClientProvider>
        </MuiBridge>
      </ThemeProvider>
    </AccentColorContext.Provider>
  )
}
