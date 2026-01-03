// Removed module; redirect to 404
import { notFound } from "next/navigation";
export default function Page() {
  notFound();
}
import { notFound } from 'next/navigation'
import { LaborDashboard } from '@/components/finance/LaborDashboard'
import { isFinanceLaborEnabled } from '@/lib/finance/config'

const toYmd = (date: Date) => date.toISOString().slice(0, 10)

export const dynamic = 'force-dynamic'

export default function FinanceLaborPage() {
  if (!isFinanceLaborEnabled()) {
    notFound()
  }

  const today = new Date()
  const startOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
  const endOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0))

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <LaborDashboard initialStart={toYmd(startOfMonth)} initialEnd={toYmd(endOfMonth)} />
    </div>
  )
}
