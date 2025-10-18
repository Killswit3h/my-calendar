import type { ReactNode } from 'react'

export function StatGrid({ children }: { children: ReactNode }) {
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</section>
}
