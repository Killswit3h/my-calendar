'use client';
import { useState } from 'react';
import { usePlan } from '@/src/hooks/usePlannerApi';

export default function AssigneesEditor({ planId, taskId, assignees }: { planId: string; taskId: string; assignees: string[] }) {
  const { toggleAssign } = usePlan(planId);
  const [userId, setUserId] = useState('');

  return (
    <div className="space-y-2">
      <div className="flex -space-x-2">
        {assignees.map(a => (
          <div key={a} className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-900 bg-slate-600 text-[10px] font-semibold text-white">
            {initials(a)}
          </div>
        ))}
      </div>
      <form
        onSubmit={(e)=>{ e.preventDefault(); if (!userId.trim()) return; toggleAssign.mutate({ taskId, userId: userId.trim() }); setUserId(''); }}
        className="flex gap-2"
      >
        <input
          className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white outline-none"
          placeholder="Add userId (e.g., pedro@work)"
          value={userId}
          onChange={(e)=>setUserId(e.target.value)}
        />
        <button className="rounded-md border border-slate-700 px-3 py-1 text-slate-300 hover:bg-slate-800">Add</button>
      </form>
    </div>
  );
}
function initials(s: string) {
  const parts = s.replace(/[@._-]+/g,' ').trim().split(' ');
  const pick = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  return pick.toUpperCase() || (s[0]?.toUpperCase() ?? '?');
}
