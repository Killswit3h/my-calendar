type Task = {
  id: string; title: string;
  priority: 'URGENT'|'IMPORTANT'|'MEDIUM'|'LOW';
  progress: 'NOT_STARTED'|'IN_PROGRESS'|'COMPLETED';
  dueAt: string | null; order: number;
};
type Bucket = { id: string; name: string; order: number; tasks: Task[]; };
type Plan = { id: string; name: string; description?: string | null; color?: string | null; buckets: Bucket[]; };

export default function Board({ plan }: { plan: Plan }) {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-slate-800 p-4">
        <h1 className="text-xl font-semibold text-white">{plan.name}</h1>
        {plan.description ? <p className="mt-1 text-slate-300">{plan.description}</p> : null}
      </header>
      <main className="flex-1 overflow-x-auto">
        <div className="flex gap-4 p-4">
          {plan.buckets.map(b => <div key={b.id}><BucketColumn bucket={b as any} /></div>)}
        </div>
      </main>
    </div>
  );
}

function BucketColumn({ bucket }: { bucket: Bucket }) {
  return (
    <div className="w-80 shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{bucket.name}</h3>
      </div>
      <div className="space-y-3">
        {bucket.tasks.map(t => (
          <div key={t.id} className="rounded-xl border border-slate-700 bg-slate-800 p-3 hover:border-slate-500">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-medium text-white">{t.title}</h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-600 text-white">{t.priority}</span>
            </div>
            {t.dueAt && <div className="mt-2 text-xs text-slate-300">Due {new Date(t.dueAt).toLocaleDateString()}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
