"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CalendarDays, Users } from "lucide-react"

const priorityTone: Record<string, string> = {
  URGENT: "bg-rose-500/20 text-rose-200",
  IMPORTANT: "bg-amber-500/20 text-amber-200",
  MEDIUM: "bg-sky-500/20 text-sky-200",
  LOW: "bg-neutral-500/20 text-neutral-200",
}

export type PlannerPlanViewModel = {
  id: string
  name: string
  description: string | null
  createdAt: string
  buckets: Array<{
    id: string
    name: string
    tasks: Array<{
      id: string
      title: string
      description: string | null
      priority: string | null
      progress: string | null
      startAt: string | null
      dueAt: string | null
      labels: Array<{ id: string; name: string; color: string }>
      assignees: string[]
    }>
  }>
}

type Props = {
  plan: PlannerPlanViewModel
  showBackLink?: boolean
}

export default function ProjectDetailClient({ plan, showBackLink = true }: Props) {
  const [taskFilter, setTaskFilter] = useState("")

  const filteredBuckets = useMemo(() => {
    const term = taskFilter.trim().toLowerCase()
    if (!term) return plan.buckets
    return plan.buckets.map(bucket => ({
      ...bucket,
      tasks: bucket.tasks.filter(task => task.title.toLowerCase().includes(term)),
    }))
  }, [plan.buckets, taskFilter])

  const totalTasks = plan.buckets.reduce((sum, bucket) => sum + bucket.tasks.length, 0)

  return (
    <div className="space-y-8">
      {showBackLink ? (
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 transition hover:text-neutral-100"
        >
          ← Projects
        </Link>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-neutral-900 bg-neutral-900/60 p-5">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Project</p>
          <h1 className="text-3xl font-semibold text-neutral-50">{plan.name}</h1>
          <p className="text-sm text-neutral-500">{plan.description ?? "No description provided."}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            <span className="inline-flex items-center gap-1 rounded-full border border-neutral-800 px-3 py-1">
              <CalendarDays className="h-3.5 w-3.5" />
              Created {formatRelative(plan.createdAt)}
            </span>
            <span className="rounded-full border border-neutral-800 px-3 py-1">
              {totalTasks} task{totalTasks === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase text-neutral-500">Filter tasks</label>
          <input
            value={taskFilter}
            onChange={event => setTaskFilter(event.target.value)}
            placeholder="🔎 Search tasks..."
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-neutral-100 outline-none focus:border-white/40"
          />
        </div>
      </section>

      <section className="space-y-6">
        {filteredBuckets.map(bucket => (
          <div key={bucket.id} className="rounded-2xl border border-neutral-900 bg-neutral-950/60">
            <div className="flex items-center justify-between border-b border-neutral-900 px-4 py-3">
              <h3 className="text-sm font-semibold text-neutral-100">{bucket.name}</h3>
              <span className="text-xs text-neutral-500">{bucket.tasks.length}</span>
            </div>
            {bucket.tasks.length === 0 ? (
              <p className="px-4 py-6 text-sm text-neutral-500">No tasks in this section.</p>
            ) : (
              <ul className="divide-y divide-neutral-900">
                {bucket.tasks.map(task => (
                  <li key={task.id} className="space-y-2 px-4 py-4 text-sm text-neutral-200">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium text-neutral-50">{task.title}</p>
                      <span className="text-xs text-neutral-500">{task.progress ?? "—"}</span>
                    </div>
                    {task.description ? <p className="text-xs text-neutral-400">{task.description}</p> : null}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                      {task.dueAt ? <span>Due {formatDate(task.dueAt)}</span> : null}
                      {task.startAt ? <span>Start {formatDate(task.startAt)}</span> : null}
                      {task.assignees.length ? (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {task.assignees.length} assignee{task.assignees.length === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {task.priority ? (
                        <span className={`rounded-full px-2 py-0.5 text-[11px] ${priorityTone[task.priority] ?? "bg-neutral-500/20 text-neutral-200"}`}>
                          {task.priority}
                        </span>
                      ) : null}
                      {task.labels.map(label => (
                        <span
                          key={label.id}
                          className="rounded-full px-2 py-0.5 text-[11px]"
                          style={{ backgroundColor: label.color, color: "#08130c" }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}

function formatRelative(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "recently"
  const diff = Date.now() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months === 1) return "1 month ago"
  if (months < 12) return `${months} months ago`
  const years = Math.floor(months / 12)
  return years === 1 ? "1 year ago" : `${years} years ago`
}

function formatDate(value: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}
