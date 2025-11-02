'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePlan } from '@/src/hooks/usePlannerApi';

export default function PlannerCalendarPage() {
  const params = useParams();
  const planId = typeof params?.planId === 'string' ? params.planId : undefined;
  const { q } = usePlan(planId);
  const [cursor, setCursor] = useState(() => new Date());

  if (!planId) return <div className="p-6 text-red-400">Missing plan reference</div>;
  if (q.isLoading) return <div className="p-6 text-slate-300">Loading…</div>;
  if (q.error || !q.data?.plan) return <div className="p-6 text-red-400">Failed to load</div>;

  const plan = q.data.plan;
  const tasks: any[] = plan.buckets.flatMap((bucket: any) => bucket.tasks);
  const matrix = useMemo(() => buildMonthMatrix(cursor), [cursor]);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-lg font-semibold text-white">
          {cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-md border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800"
            onClick={() => setCursor(addMonths(cursor, -1))}
          >
            {'<'}
          </button>
          <button
            className="rounded-md border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800"
            onClick={() => setCursor(new Date())}
          >
            Today
          </button>
          <button
            className="rounded-md border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800"
            onClick={() => setCursor(addMonths(cursor, 1))}
          >
            {'>'}
          </button>
          <Link
            href={`/planner/${planId}`}
            className="rounded-md border border-slate-700 px-3 py-1 text-sm text-emerald-400 hover:bg-slate-800"
          >
            Board
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs text-slate-400">
            {day}
          </div>
        ))}
        {matrix.map((day) => {
          const dayStr = day.toISOString().slice(0, 10);
          const items = tasks.filter((t) => t.dueAt && t.dueAt.slice(0, 10) === dayStr);
          const inMonth = day.getMonth() === cursor.getMonth();
          return (
            <div
              key={day.getTime()}
              className={`min-h-28 rounded-lg border p-2 ${inMonth ? 'border-slate-700 bg-slate-900' : 'border-slate-800 bg-slate-950'}`}
            >
              <div className="mb-1 text-right text-[10px] text-slate-400">{day.getDate()}</div>
              <ul className="space-y-1">
                {items.map((t) => (
                  <li key={t.id} className="truncate rounded-md bg-slate-800 px-2 py-1 text-[11px] text-white">
                    {t.title}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function addMonths(date: Date, delta: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + delta);
  return copy;
}

function buildMonthMatrix(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const cells: Date[] = [];
  for (let i = 0; i < 42; i += 1) {
    const cell = new Date(start);
    cell.setDate(start.getDate() + i);
    cells.push(cell);
  }
  return cells;
}
