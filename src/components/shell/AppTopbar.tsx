"use client";
import { useState } from "react";

interface AppTopbarProps {
  onMenuClick?: () => void;
}

export default function AppTopbar({ onMenuClick }: AppTopbarProps) {
  const [searchValue, setSearchValue] = useState("");

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-gray-700 bg-gray-900 px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-gray-800 transition-colors text-white"
        aria-label="Open menu"
      >
        <span className="text-base">☰</span>
      </button>

      {/* Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400">🔍</span>
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
        <span className="text-gray-400 text-sm">Quick Add</span>
        <button className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 transition-colors text-black">
          <span className="text-base">+</span>
        </button>
        <button className="h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors text-white">
          <span className="text-base">👤</span>
        </button>
      </div>
    </header>
  );
}