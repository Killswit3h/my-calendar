"use client";

import { usePathname } from "next/navigation";

export default function AppTopbar() {
  const pathname = usePathname();
  const showCalendarSearch = pathname?.startsWith("/calendar");

  return (
    <header className="sticky top-0 z-20 px-4 py-3 border-b border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto w-full flex items-center gap-3">
        {showCalendarSearch ? (
          <input
            placeholder="Search…"
            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-md px-3 py-2 outline-none focus:border-white/20"
          />
        ) : null}
        <div className="ml-auto flex items-center gap-3">
          <button className="btn">Quick Add</button>
          <div className="size-9 rounded-full bg-white/10" aria-label="User" />
        </div>
      </div>
    </header>
  );
}
