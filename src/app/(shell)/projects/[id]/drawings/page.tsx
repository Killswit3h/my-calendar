import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Toolbar } from '@/components/ui/Toolbar'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'

const DRAWINGS = [
  { id: 'DWG-101', title: 'Plan Set Revision C', discipline: 'Civil', version: 'Rev C', updated: '2024-09-18' },
  { id: 'DWG-114', title: 'Shop Drawing – Gate Assembly', discipline: 'Fabrication', version: 'Rev A', updated: '2024-09-16' },
]

type DrawingFixture = (typeof DRAWINGS)[number]
type DrawingRow = DrawingFixture & { href: string }

const columns: TableColumn<DrawingRow>[] = [
  { key: 'id', header: 'ID', width: 120 },
  { key: 'title', header: 'Title', width: 280, hrefKey: 'href' },
  { key: 'discipline', header: 'Discipline', width: 140 },
  { key: 'version', header: 'Version', width: 120 },
  { key: 'updated', header: 'Updated', width: 140 },
]

export default function ProjectDrawingsPage() {
  const rows: DrawingRow[] = DRAWINGS.map(drawing => ({ ...drawing, href: `#${drawing.id}` }))
  return (
    <div className="space-y-4">
      <Toolbar>
        <div className="text-sm text-muted">{rows.length} drawings available</div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <button type="button" className="focus-ring rounded-full border border-border/60 px-3 py-1 transition hover:border-border hover:text-foreground">
            Request update
          </button>
        </div>
      </Toolbar>
      <DataTable
        data={rows}
        columns={columns}
        skeletonCount={3}
        emptyMessage={
          <EmptyState
            title="No drawings uploaded"
            description="Sync your drawing set to collaborate here."
            action={<OpenCalendarLink />}
          />
        }
      />
    </div>
  )
}
