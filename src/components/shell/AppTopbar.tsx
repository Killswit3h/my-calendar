"use client";
import { useState } from "react";

interface AppTopbarProps {
  onMenuClick?: () => void;
}

export default function AppTopbar({ onMenuClick }: AppTopbarProps) {
  const [searchValue, setSearchValue] = useState("");

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-[rgb(var(--color-card))] transition-colors text-white"
        aria-label="Open menu"
      >
        <span className="text-base">☰</span>
      </button>

      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--color-muted))]">🔍</span>
          <input
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <span className="text-[rgb(var(--color-muted))] text-sm">Quick Add</span>
        <button className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent))]/90 transition-colors text-black">
          <span className="text-base">+</span>
        </button>
        <button className="h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-[rgb(var(--color-card))] transition-colors text-white">
          <span className="text-base">👤</span>
        </button>
      </div>
    </header>
  );
}