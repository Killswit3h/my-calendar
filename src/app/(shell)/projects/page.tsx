"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import Board from "../../../components/planner/Board";
import { useCreatePlan, usePlan, usePlannerList } from "../../../hooks/usePlannerApi";

type PlanSummary = { id: string; name: string; description?: string | null; color?: string | null };

export default function ProjectsBoardPage() {
  const { data, isLoading, error } = usePlannerList();
  const plans = useMemo(() => data?.plans ?? [], [data?.plans]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const createPlan = useCreatePlan();
  const [showCreate, setShowCreate] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanDescription, setNewPlanDescription] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && plans.length > 0) {
      setSelectedId(plans[0].id);
    }
  }, [plans, selectedId]);

  useEffect(() => {
    if (!isLoading && plans.length === 0) {
      setShowCreate(true);
    }
  }, [isLoading, plans.length]);

  const handleCreatePlan = async (event: FormEvent) => {
    event.preventDefault();
    const name = newPlanName.trim();
    if (!name) {
      setCreateError("Enter a plan name.");
      return;
    }
    setCreateError(null);
    try {
      const result = await createPlan.mutateAsync({
        name,
        description: newPlanDescription.trim() || undefined,
      });
      const created = (result as { plan: PlanSummary }).plan;
      setSelectedId(created.id);
      setNewPlanName("");
      setNewPlanDescription("");
      setShowCreate(false);
    } catch (err: any) {
      setCreateError(err?.message ?? "Failed to create plan.");
    }
  };

  const planId = selectedId ?? undefined;
  const { q, createTask, createBucket, renameBucket, deleteBucket } = usePlan(planId);
  const plan = q.data?.plan;

  return (
    <div className="flex h-full flex-col">
      {showCreate ? (
        <div className="border-b border-white/5 bg-black/40 px-6 py-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Create a new plan</h2>
          <form
            onSubmit={handleCreatePlan}
            className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] md:items-end"
          >
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Plan name</label>
              <input
                value={newPlanName}
                onChange={(event) => setNewPlanName(event.target.value)}
                placeholder="e.g., Halley Engineering – Fall 2024"
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                disabled={createPlan.isPending}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Description (optional)</label>
              <input
                value={newPlanDescription}
                onChange={(event) => setNewPlanDescription(event.target.value)}
                placeholder="Short summary for the plan"
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                disabled={createPlan.isPending}
              />
            </div>
            <button
              type="submit"
              disabled={createPlan.isPending}
              className="mt-2 inline-flex items-center justify-center rounded-md border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/10 disabled:opacity-50 md:mt-0"
            >
              {createPlan.isPending ? "Creating…" : "Create plan"}
            </button>
          </form>
          {createError ? <p className="mt-2 text-sm text-red-400">{createError}</p> : null}
        </div>
      ) : null}

      <main className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-300">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading planner…
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-400">
            Failed to load planner list.
          </div>
        ) : plans.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No projects yet. Use the form above to create your first plan.
          </div>
        ) : planId === undefined ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-300">
            Select a plan to view the board.
          </div>
        ) : q.isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-300">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading board…
          </div>
        ) : q.error || !plan ? (
          <div className="flex h-full items-center justify-center text-sm text-red-400">
            Could not load the selected plan.
          </div>
        ) : (
          <Board
            plan={plan}
            onCreateTask={(bucketId, title) => createTask.mutate({ bucketId, title })}
            creatingTask={createTask.isPending}
            onCreateBucket={(name) => createBucket.mutateAsync({ name })}
            creatingBucket={createBucket.isPending}
            onRenameBucket={(bucketId, name) => renameBucket.mutateAsync({ bucketId, name })}
            renamingBucket={renameBucket.isPending}
            onDeleteBucket={(bucketId) => deleteBucket.mutateAsync({ bucketId })}
            deletingBucket={deleteBucket.isPending}
          />
        )}
      </main>
    </div>
  );
}
