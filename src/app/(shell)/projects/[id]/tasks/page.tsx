import { notFound } from 'next/navigation'

import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Toolbar } from '@/components/ui/Toolbar'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { PROJECT_FIXTURES } from '@/lib/fixtures/modules'

type TaskRow = {
  id: string
  name: string
  owner: string
  status: string
  start: string
  due: string
}

const TASKS: TaskRow[] = [
  { id: 'TSK-401', name: 'Auger foundations – Zone A', owner: 'Crew A', status: 'In progress', start: '2024-09-16', due: '2024-09-20' },
  { id: 'TSK-405', name: 'Set posts – Zone B', owner: 'Crew B', status: 'Queued', start: '2024-09-21', due: '2024-09-24' },
  { id: 'TSK-412', name: 'QC punchlist walk', owner: 'QC Team', status: 'Scheduled', start: '2024-09-25', due: '2024-09-25' },
]

const columns: TableColumn<TaskRow>[] = [
  { key: 'id', header: 'Task ID', width: 140 },
  { key: 'name', header: 'Task', width: 260 },
  { key: 'owner', header: 'Owner', width: 160 },
  { key: 'status', header: 'Status', width: 120 },
  { key: 'start', header: 'Start', width: 140 },
  { key: 'due', header: 'Due', width: 140 },
]

export default async function ProjectTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = PROJECT_FIXTURES.find(item => item.id === id)
  if (!project) notFound()

  return (
    <div className="flex flex-col gap-6">
      <Toolbar>
        <div className="text-sm text-muted">Upcoming tasks for {project.name}</div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <button type="button" className="focus-ring rounded-full border border-border/60 px-3 py-1 transition hover:border-border hover:text-foreground">
            Export schedule
          </button>
        </div>
      </Toolbar>
      <DataTable
        data={TASKS}
        columns={columns}
        skeletonCount={4}
        emptyMessage={
          <EmptyState
            title="No tasks"
            description="Add tasks or connect your Primavera schedule."
            action={<OpenCalendarLink />}
          />
        }
      />
    </div>
  )
}
