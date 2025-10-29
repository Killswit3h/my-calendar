'use client';
import useSWR from 'swr';
import Link from 'next/link';

type Plan = { id: string; name: string; description?: string; color?: string; createdAt: string };
const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function PlannerHome() {
  const { data, error, isLoading } = useSWR<{plans: Plan[]}>('/api/planner', fetcher);

  if (isLoading) return <div className="p-6 text-slate-300">Loading…</div>;
  if (error) return <div className="p-6 text-red-400">Failed to load plans</div>;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold text-white">Planner</h1>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.plans?.map(p => (
          <li key={p.id} className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white">{p.name}</h2>
              {p.color ? <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} /> : null}
            </div>
            {p.description ? <p className="mt-2 text-slate-300">{p.description}</p> : null}
            <Link className="mt-3 inline-block text-sm text-emerald-400 hover:underline" href={`/planner/${p.id}`}>
              Open board
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
