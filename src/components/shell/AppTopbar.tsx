// src/components/shell/AppTopbar.tsx
"use client"

import { useState } from 'react'
import { Search, Plus, Sun, Moon, User, Settings } from 'lucide-react'
import { cn } from '@/lib/theme'

interface AppTopbarProps {
  onThemeToggle: () => void
  theme: 'light' | 'dark'
}

export function AppTopbar({ onThemeToggle, theme }: AppTopbarProps) {
  const [searchValue, setSearchValue] = useState('')

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl px-6">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 pl-10 text-sm ring-offset-bg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-card/80 transition-colors">
          <Plus className="h-4 w-4" />
          <span className="sr-only">Quick Add</span>
        </button>
        
        <button
          onClick={onThemeToggle}
          className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-card/80 transition-colors"
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </button>

        <button className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-card/80 transition-colors">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </button>

        <button className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-card/80 transition-colors">
          <User className="h-4 w-4" />
          <span className="sr-only">User menu</span>
        </button>
      </div>
    </header>
  )
}
