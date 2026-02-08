"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import CalendarWithData from "@/components/CalendarWithData"
import AppSidebar from "@/components/shell/AppSidebar"

export const runtime = 'nodejs'
export const dynamic = "force-dynamic"

export default function FullScreenCalendarPage() {
  const pathname = usePathname()
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    setNavOpen(false)
  }, [pathname])

  return (
    <div className="cal-shell">
      <div className="p-4 space-y-4">
        <CalendarWithData
          calendarId="cme9wqhpe0000ht8sr5o3a6wf"
          onOpenSidebar={() => setNavOpen(v => !v)}
        />
      </div>
      {navOpen ? (
        <div className="fixed inset-0 z-40 flex">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-transparent"
            onClick={() => setNavOpen(false)}
          />
          <div className="relative z-50 h-full w-[260px]">
            <AppSidebar
              current={pathname ?? "/"}
              forceExpanded
              onCollapse={() => setNavOpen(false)}
              className="h-full border-r border-white/10 bg-black/40 backdrop-blur-xl"
              onNavigate={() => setNavOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
