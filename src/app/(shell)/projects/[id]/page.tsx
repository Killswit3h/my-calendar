import { notFound } from "next/navigation"
import { Prisma } from "@prisma/client"

import { getPrisma } from "@/lib/db"
import ProjectDetailClient, { PlannerPlanViewModel } from "./ProjectDetailClient"

const planSelect = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  buckets: {
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      order: true,
      tasks: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          progress: true,
          startAt: true,
          dueAt: true,
          order: true,
          bucketId: true,
          labels: { select: { label: { select: { id: true, name: true, color: true } } } },
          assignees: { select: { userId: true } },
        },
      },
    },
  },
} satisfies Prisma.PlannerPlanSelect

type PlanPayload = Prisma.PlannerPlanGetPayload<{ select: typeof planSelect }>

function normalizePlan(plan: PlanPayload): PlannerPlanViewModel {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description ?? null,
    createdAt: plan.createdAt.toISOString(),
    buckets: plan.buckets.map(bucket => ({
      id: bucket.id,
      name: bucket.name,
      tasks: bucket.tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description ?? null,
        priority: task.priority ?? null,
        progress: task.progress ?? null,
        startAt: task.startAt ? task.startAt.toISOString() : null,
        dueAt: task.dueAt ? task.dueAt.toISOString() : null,
        labels: task.labels.map(entry => entry.label),
        assignees: task.assignees.map(entry => entry.userId),
      })),
    })),
  }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const prisma = await getPrisma()
  const plan = await prisma.plannerPlan.findUnique({
    where: { id },
    select: planSelect,
  })

  if (!plan) notFound()

  const normalized = normalizePlan(plan)

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-200 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <ProjectDetailClient plan={normalized} />
      </div>
    </main>
  )
}
