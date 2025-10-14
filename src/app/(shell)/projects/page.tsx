import Link from 'next/link'

import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { ActionDrawer } from '@/components/ui/ActionDrawer'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { BackButton } from '@/components/ui/BackButton'
import { Toolbar } from '@/components/ui/Toolbar'
import { PROJECT_FIXTURES, type ProjectFixture } from '@/lib/fixtures/modules'

type ProjectRow = ProjectFixture & { href: string }

const columns: TableColumn<ProjectRow>[] = [
  {
    key: 'id',
    header: 'Project ID',
    hrefKey: 'href',
    width: 160,
    minWidth: 140,
  },
  { key: 'name', header: 'Name', width: 280 },
  { key: 'status', header: 'Status', width: 120 },
  { key: 'superintendent', header: 'Superintendent', width: 180 },
  { key: 'startDate', header: 'Start', width: 140 },
  { key: 'completion', header: 'Planned Finish', width: 140 },
]

export default function ProjectsPage() {
  const rows: ProjectRow[] = PROJECT_FIXTURES.map(project => ({ ...project, href: `/projects/${project.id}` }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Projects"
        description="Portfolio view of active, planning, and closeout projects."
        actions={
          <div className="flex flex-wrap gap-2">
            <BackButton />
            <ActionDrawer
              triggerLabel="New project"
              title="Create project shell"
              description="Stub in a project so scheduling and billing can begin."
            >
              <form className="flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">Project name</span>
                  <input type="text" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" placeholder="Project title" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">Owner</span>
                  <input type="text" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" placeholder="Owner or client" />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted">Start date</span>
                    <input type="date" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted">End date</span>
                    <input type="date" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" />
                  </label>
                </div>
              </form>
            </ActionDrawer>
          </div>
        }
      />
      <Toolbar>
        <div className="flex items-center gap-2 text-sm text-muted">
          <span>Filter:</span>
          <button type="button" className="focus-ring rounded-full border border-border/60 px-3 py-1 text-xs uppercase tracking-wide text-muted transition hover:border-border hover:text-foreground">
            Active
          </button>
          <button type="button" className="focus-ring rounded-full border border-transparent bg-foreground/10 px-3 py-1 text-xs uppercase tracking-wide text-foreground/80 transition hover:bg-foreground/15">
            All
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="hidden sm:inline">Views:</span>
          <button type="button" className="focus-ring rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted transition hover:border-border hover:text-foreground">
            Table
          </button>
          <button type="button" className="focus-ring rounded-full border border-transparent px-3 py-1 text-xs font-medium text-white transition hover:opacity-90 bg-[var(--gfc-green)]">
            Timeline
          </button>
        </div>
      </Toolbar>
      <DataTable
        data={rows}
        columns={columns}
        toolbar={null}
        isLoading={false}
        emptyMessage={
          <EmptyState
            title="No projects"
            description="Start by logging your first project."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link href="/projects?create=1" className="btn">Create project</Link>
                <OpenCalendarLink className="border-dashed" />
              </div>
            }
          />
        }
      />
    </div>
  )
}
