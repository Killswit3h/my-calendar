// src/app/(shell)/layout.tsx
"use client"

import { ReactNode } from 'react'
import { AppSidebar } from '@/components/shell/AppSidebar'
import { AppTopbar } from '@/components/shell/AppTopbar'
import { useTheme } from '@/components/providers/ThemeProvider'

export default function ShellLayout({ children }: { children: ReactNode }) {
  const { resolvedTheme, setTheme } = useTheme()

  const handleThemeToggle = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="flex h-screen bg-bg">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar onThemeToggle={handleThemeToggle} theme={resolvedTheme} />
        <main id="main-content" className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}