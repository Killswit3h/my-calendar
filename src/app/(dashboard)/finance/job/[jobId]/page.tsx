import { notFound } from 'next/navigation'
import { LaborJobDetail } from '@/components/finance/LaborJobDetail'
import { isFinanceLaborEnabled } from '@/lib/finance/config'

const toYmd = (date: Date) => date.toISOString().slice(0, 10)

export const dynamic = 'force-dynamic'

export default async function FinanceJobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  if (!isFinanceLaborEnabled()) {
    notFound()
  }

  const { jobId } = await params
  const query = await searchParams

  const today = new Date()
  const defaultStart = toYmd(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)))
  const defaultEnd = toYmd(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0)))

  const startParam = query.start
  const endParam = query.end

  const start = typeof startParam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(startParam) ? startParam : defaultStart
  const end = typeof endParam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(endParam) ? endParam : defaultEnd

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <LaborJobDetail jobId={jobId} initialStart={start} initialEnd={end} />
    </div>
  )
}
