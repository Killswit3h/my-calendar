import type { Rfi as RfiRecord } from '@prisma/client'

import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Toolbar } from '@/components/ui/Toolbar'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { PROJECT_FIXTURES } from '@/lib/fixtures/modules'
import { getPrisma } from '@/lib/db'

const FALLBACK_RFIS = [
  { id: 'RFI-204', question: 'Confirm post embedment depth', assignedTo: 'Design', status: 'Pending response', sent: '2024-09-19' },
  { id: 'RFI-205', question: 'Clarify crash cushion spec', assignedTo: 'FDOT', status: 'Open', sent: '2024-09-17' },
]

type RfiRow = {
  id: string
  question: string
  assignedTo: string | null
  status: string
  sent: string
}

const columns: TableColumn<RfiRow>[] = [
  { key: 'id', header: 'RFI', width: 120 },
  { key: 'question', header: 'Subject', width: 260 },
  { key: 'assignedTo', header: 'Assigned', width: 160 },
  { key: 'status', header: 'Status', width: 160 },
  { key: 'sent', header: 'Sent', width: 140 },
]

export default async function ProjectRfisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = PROJECT_FIXTURES.find(item => item.id === id) ?? PROJECT_FIXTURES[0]
  const useFixtures = process.env.PLAYWRIGHT_TEST === '1'
  let rfisDb: RfiRecord[] = []
  if (!useFixtures && project) {
    const prisma = await getPrisma()
    try {
      rfisDb = await prisma.rfi.findMany({
        where: { project: project.name },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    } catch {
      rfisDb = []
    }
  }

  const rows: RfiRow[] = rfisDb.length
    ? rfisDb.map((item: RfiRecord): RfiRow => ({
        id: item.id,
        question: item.subject,
        assignedTo: item.assignedTo,
        status: item.status,
        sent: item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : '-',
      }))
    : FALLBACK_RFIS

  return (
    <div className="space-y-4">
      <Toolbar>
        <div className="text-sm text-muted">{rows.length} RFIs tracked for {project.name}</div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <button type="button" className="focus-ring rounded-full border border-border/60 px-3 py-1 transition hover:border-border hover:text-foreground">
            Export RFIs
          </button>
        </div>
      </Toolbar>
      <DataTable
        data={rows}
        columns={columns}
        skeletonCount={4}
        emptyMessage={
          <EmptyState
            title="All clear"
            description="No RFIs logged for this project."
            action={<OpenCalendarLink />}
          />
        }
      />
    </div>
  )
}
