// app/(planner)/layout.tsx
import "../globals.css"
import type { ReactNode } from "react"

export default function PlannerShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100svh] bg-zinc-950 text-zinc-100 antialiased">
      {children}
    </div>
  )
}
