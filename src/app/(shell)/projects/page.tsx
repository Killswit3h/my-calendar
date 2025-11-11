"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"

import { useCreatePlan, usePlannerList } from "@/hooks/usePlannerApi"

type PlanSummary = { id: string; name: string; description?: string | null; color?: string | null; createdAt?: string | null }

export default function ProjectsLandingPage() {
  const { data, isLoading, error } = usePlannerList()
  const router = useRouter()
  const createPlan = useCreatePlan()
  const plans = useMemo(() => (data?.plans as PlanSummary[]) ?? [], [data?.plans])
  const hasPlans = plans.length > 0

  const [query, setQuery] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && plans.length === 0) {
      setShowCreate(true)
    }
  }, [isLoading, plans.length])

  useEffect(() => {
    if (!isLoading && !error && hasPlans) {
      router.replace(`/projects/${plans[0].id}`)
    }
  }, [isLoading, error, hasPlans, plans, router])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return plans
    return plans.filter(plan => plan.name.toLowerCase().includes(term))
  }, [plans, query])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setCreateError("Plan name is required.")
      return
    }
    setCreateError(null)
    try {
      await createPlan.mutateAsync({
        name: trimmed,
        description: description.trim() || undefined,
      })
      setName("")
      setDescription("")
      setShowCreate(false)
    } catch (err: any) {
      setCreateError(err?.message ?? "Failed to create plan.")
    }
  }

  if (!isLoading && !error && hasPlans) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-10 text-neutral-200">
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Opening projects…
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-200 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Planner</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-neutral-50">Projects</h1>
              <p className="text-sm text-neutral-500">One-column list of customers. Tap a row to open its workspace.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(prev => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-100 transition hover:border-white"
            >
              <Plus className="h-4 w-4" />
              New plan
            </button>
          </div>
          <label className="block">
            <span className="sr-only">Search projects</span>
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="🔎 Search customers..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-sm text-neutral-50 placeholder:text-neutral-500 outline-none focus:border-white/40 focus:ring-2 focus:ring-white/5"
            />
          </label>
        </header>

        {showCreate ? (
          <section className="rounded-2xl border border-neutral-900 bg-neutral-900/60 p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs uppercase text-neutral-500">Plan name</label>
                <input
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="e.g., Halley Engineering"
                  className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-white/30"
                  disabled={createPlan.isPending}
                />
              </div>
              <div>
                <label className="text-xs uppercase text-neutral-500">Description</label>
                <input
                  value={description}
                  onChange={event => setDescription(event.target.value)}
                  placeholder="Short summary for the plan"
                  className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none focus:border-white/30"
                  disabled={createPlan.isPending}
                />
              </div>
              {createError ? <p className="text-sm text-rose-400">{createError}</p> : null}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={createPlan.isPending}
                  className="rounded-full border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/10 disabled:opacity-60"
                >
                  {createPlan.isPending ? "Creating…" : "Create plan"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false)
                    setCreateError(null)
                  }}
                  className="text-sm text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-sm text-neutral-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading projects…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-900 bg-rose-950/40 px-4 py-6 text-sm text-rose-200">Failed to load planner list.</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-neutral-900 bg-neutral-900/40 px-4 py-6 text-sm text-neutral-500">No projects found.</div>
        ) : (
          <ul className="space-y-4">
            {filtered.map(plan => (
              <li
                key={plan.id}
                className="rounded-2xl border border-neutral-900 bg-neutral-900/60 p-4 transition hover:border-neutral-700 hover:bg-neutral-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-50">{plan.name}</h2>
                    <p className="text-sm text-neutral-400">{plan.description?.trim() || "No description provided."}</p>
                    {plan.createdAt ? <p className="text-xs text-neutral-600">Created {formatRelative(plan.createdAt)}</p> : null}
                  </div>
                  <Link
                    href={`/projects/${plan.id}`}
                    className="inline-flex items-center justify-center rounded-full border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-100 transition hover:border-white hover:text-white"
                  >
                    View ▸
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}

function formatRelative(value?: string | null) {
  if (!value) return "recently"
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
