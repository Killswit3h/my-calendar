'use client';
import { usePlan, usePlanLabels } from '@/hooks/usePlannerApi';

export default function LabelsEditor({ planId, taskId, current }: { planId: string; taskId: string; current: { id: string }[] }) {
  const { toggleLabel } = usePlan(planId);
  const { data, isLoading, error } = usePlanLabels(planId);
  if (isLoading) return <div className="text-slate-300 text-sm">Loading labels…</div>;
  if (error) return <div className="text-red-400 text-sm">Failed to load labels</div>;
  const labels = data?.labels ?? [];
  const currentSet = new Set(current.map(l => l.id));
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((l: any) => {
        const active = currentSet.has(l.id);
        return (
          <button
            key={l.id}
            onClick={() => toggleLabel.mutate({ taskId, labelId: l.id })}
            className={`rounded px-2 py-1 text-xs ${active ? 'ring-2 ring-emerald-400' : ''}`}
            style={{ backgroundColor: l.color, color: '#0f172a' }}
          >
            {l.name}
          </button>
        );
      })}
    </div>
  );
}
