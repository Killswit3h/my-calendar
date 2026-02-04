import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { ActionDrawer } from '@/components/ui/ActionDrawer'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { BackButton } from '@/components/ui/BackButton'
import { Toolbar } from '@/components/ui/Toolbar'
import { DOCUMENT_FIXTURES, type DocumentFixture } from '@/lib/fixtures/modules'

const columns: TableColumn<DocumentFixture>[] = [
  { key: 'id', header: 'Doc ID', width: 140 },
  { key: 'project', header: 'Project', width: 260 },
  { key: 'type', header: 'Type', width: 160 },
  { key: 'owner', header: 'Owner', width: 160 },
  { key: 'updatedAt', header: 'Updated', width: 160 },
]

export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Documents"
        description="Centralized library for RFIs, submittals, and plan sets."
        actions={
          <div className="flex flex-wrap gap-2">
            <BackButton />
            <ActionDrawer
              triggerLabel="Upload"
              title="Upload documents"
              description="Attach plan sets, submittals, RFIs, or photos."
            >
              <form className="flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">Title</span>
                  <input type="text" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" placeholder="Document title" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">Project</span>
                  <input type="text" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" placeholder="Project ID" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">File</span>
                  <input type="file" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40 file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-accent-foreground" />
                </label>
              </form>
            </ActionDrawer>
          </div>
        }
      />
      <Toolbar>
        <div className="text-sm text-muted">Latest uploads synced from RFIs, submittals, and plan sets.</div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <button type="button" className="focus-ring rounded-full border border-border/60 px-3 py-1 transition hover:border-border hover:text-foreground">
            Filter types
          </button>
          <button type="button" className="focus-ring rounded-full border border-transparent bg-[var(--gfc-green)] px-3 py-1 text-xs font-medium text-white transition hover:opacity-90">
            Sync now
          </button>
        </div>
      </Toolbar>
      <DataTable
        data={DOCUMENT_FIXTURES}
        columns={columns}
        emptyMessage={
          <EmptyState
            title="No documents"
            description="Upload your first document set to get started."
            action={<OpenCalendarLink />}
          />
        }
      />
    </div>
  )
}
