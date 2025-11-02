'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import dayjs, { Dayjs } from 'dayjs';
import { usePlan } from '@/src/hooks/usePlannerApi';

export default function PlannerTimelinePage() {
  const params = useParams();
  const planId = typeof params?.planId === 'string' ? params.planId : undefined;
  const { q } = usePlan(planId);

  if (!planId) return <div className="p-6 text-red-400">Missing plan reference</div>;
  if (q.isLoading) return <div className="p-6 text-slate-300">Loading…</div>;
  if (q.error || !q.data?.plan) return <div className="p-6 text-red-400">Failed to load</div>;

  const plan = q.data.plan;
  const start = dayjs().startOf('week');
  const days = Array.from({ length: 21 }, (_, i) => start.add(i, 'day'));

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-white text-lg font-semibold">Timeline</div>
        <div className="flex gap-2">
          <Link href={`/planner/${planId}`} className="rounded-md border border-slate-700 px-3 py-1 text-emerald-400">
            Board
          </Link>
          <Link href={`/planner/${planId}/calendar`} className="rounded-md border border-slate-700 px-3 py-1 text-emerald-400">
            Calendar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-2">
        <div />
        <div className="grid grid-cols-21 gap-[2px]">
          {days.map((d) => (
            <div key={d.toString()} className="text-center text-xs text-slate-400">
              {d.format('MM/DD')}
            </div>
          ))}
        </div>

        {plan.buckets.map((bucket: any) => (
          <Row key={bucket.id} name={bucket.name} tasks={bucket.tasks} start={start} />
        ))}
      </div>
    </div>
  );
}

type TimelineTask = { id: string; title: string; startAt?: string | null; dueAt?: string | null };

function Row({ name, tasks, start }: { name: string; tasks: TimelineTask[]; start: Dayjs }) {
  return (
    <>
      <div className="sticky left-0 self-start rounded-md bg-slate-900 p-2 text-sm text-white">{name}</div>
      <div className="relative min-h-14 rounded-md border border-slate-800 bg-slate-950">
        {tasks.map((task) => {
          const startDate = dayjs(task.startAt ?? task.dueAt ?? start);
          const endDate = dayjs(task.dueAt ?? task.startAt ?? start.add(1, 'day'));
          const offsetDays = Math.max(0, startDate.diff(start, 'day'));
          const durationDays = Math.max(1, endDate.diff(startDate, 'day') || 1);
          return (
            <div
              key={task.id}
              className="absolute top-2 h-8 rounded-md bg-slate-700 px-2 text-xs text-white"
              style={{ left: `${(offsetDays / 21) * 100}%`, width: `${(durationDays / 21) * 100}%` }}
              title={task.title}
            >
              <div className="truncate leading-8">{task.title}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
