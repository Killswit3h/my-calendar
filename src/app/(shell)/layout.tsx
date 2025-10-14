import type { ReactNode } from 'react'

import AppSidebar from '@/components/ui/AppSidebar'
import TopBar from '@/components/ui/TopBar'
import { ShellHotkeys } from '@/components/ui/ShellHotkeys'

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh w-full overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(63,113,79,0.22),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(47,110,61,0.16),transparent_55%)]" />
      <AppSidebar />
      <div className="relative flex min-h-dvh flex-1 flex-col">
        <TopBar />
        <ShellHotkeys />
        <main className="relative flex-1 overflow-x-hidden bg-background">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(63,113,79,0.08),transparent_65%)]" />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
