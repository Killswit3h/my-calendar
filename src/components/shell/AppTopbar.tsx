"use client";
import { useState } from "react";

interface AppTopbarProps {
  onMenuClick?: () => void;
}

export default function AppTopbar({ onMenuClick }: AppTopbarProps) {
  const [searchValue, setSearchValue] = useState("");

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-black/10 bg-white/80 backdrop-blur-xl px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-black/5 transition-colors"
        aria-label="Open menu"
      >
        <span className="text-base">☰</span>
      </button>

      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500">🔍</span>
          <input
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="flex h-10 w-full rounded-md border border-black/10 bg-white px-3 py-2 pl-10 text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-accent))] focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-black/5 transition-colors">
          <span className="text-base">➕</span>
          <span className="sr-only">Quick Add</span>
        </button>
        
        <button className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-black/5 transition-colors">
          <span className="text-base">🌙</span>
          <span className="sr-only">Toggle theme</span>
        </button>

        <button className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-black/5 transition-colors">
          <span className="text-base">⚙️</span>
          <span className="sr-only">Settings</span>
        </button>

        <button className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-black/5 transition-colors">
          <span className="text-base">👤</span>
          <span className="sr-only">User menu</span>
        </button>
      </div>
    </header>
  );
}