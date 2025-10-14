import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { PageHeader } from '@/components/ui/PageHeader'
import { PROJECT_FIXTURES } from '@/lib/fixtures/modules'
import { ProjectTabs } from '@/components/projects/ProjectTabs'
import { ActionDrawer } from '@/components/ui/ActionDrawer'
import { BackButton } from '@/components/ui/BackButton'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'gantt', label: 'Gantt' },
  { key: 'drawings', label: 'Drawings' },
  { key: 'rfis', label: 'RFIs' },
  { key: 'submittals', label: 'Submittals' },
]

export default async function ProjectLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = PROJECT_FIXTURES.find(item => item.id === id) ?? PROJECT_FIXTURES[0]
  if (!project) notFound()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={project.name}
        description={`Managed by ${project.superintendent} · Target completion ${project.completion}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <BackButton />
            <ActionDrawer
              triggerLabel="Add task"
              title="Create project task"
              description={`Assign a quick follow-up for ${project.name}.`}
            >
              <form className="flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">Task name</span>
                  <input type="text" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" placeholder="Task title" />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted">Assignee</span>
                    <input type="text" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" placeholder="Owner" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted">Due date</span>
                    <input type="date" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" />
                  </label>
                </div>
              </form>
            </ActionDrawer>
          </div>
        }
      />
      <ProjectTabs projectId={id} tabs={TABS} />
      <section>{children}</section>
    </div>
  )
}
