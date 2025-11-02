'use client';
import { FormEvent, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Plan = { id: string; name: string; description?: string; color?: string; createdAt: string };
const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function PlannerHome() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<{ plans: Plan[] }>('/api/planner', fetcher);
  const plans = data?.plans ?? [];
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Enter a plan name to continue.');
      return;
    }
    setCreating(true);
    setFormError(null);
    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, description: description.trim() || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = (json as any)?.error ?? 'Failed to create plan';
        throw new Error(typeof message === 'string' ? message : 'Failed to create plan');
      }
      const created = (json as { plan: Plan }).plan;
      setName('');
      setDescription('');
      await mutate();
      router.push(`/planner/${created.id}`);
    } catch (err: any) {
      setFormError(err?.message ?? 'Failed to create plan');
    } finally {
      setCreating(false);
    }
  };

  if (isLoading) return <div className="p-6 text-slate-300">Loading…</div>;
  if (error) return <div className="p-6 text-red-400">Failed to load plans</div>;

  return (
    <div className="space-y-8 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-white">Planner</h1>
        <p className="text-sm text-slate-400">
          Create boards for each project, then jump into the board view to add sections and tasks.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <h2 className="text-sm font-semibold text-white">Create a new plan</h2>
        <form onSubmit={handleCreate} className="mt-4 grid gap-3 md:grid-cols-[1fr_minmax(0,1fr)_auto] md:items-end">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g., Halley Engineering – Fall 2024"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
              disabled={creating}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400">Description (optional)</label>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Short summary for the plan"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
              disabled={creating}
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="mt-2 inline-flex items-center justify-center rounded-md border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/10 disabled:opacity-50 md:mt-0"
          >
            {creating ? 'Creating…' : 'Create plan'}
          </button>
        </form>
        {formError ? <p className="mt-2 text-sm text-red-400">{formError}</p> : null}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Existing plans</h2>
        {plans.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-slate-300">
            No plans yet. Create a plan above to get started.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => {
              const name = p.name === 'Planner Demo' ? 'Planner' : p.name;
              return (
              <li key={p.id} className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white">{name}</h3>
                  {p.color ? <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} /> : null}
                </div>
                {p.description ? <p className="mt-2 text-slate-300">{p.description}</p> : null}
                <Link className="mt-3 inline-block text-sm text-emerald-400 hover:underline" href={`/planner/${p.id}`}>
                  Open board
                </Link>
              </li>
            );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
