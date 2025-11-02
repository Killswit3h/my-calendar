'use client';

import { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { useChecklist } from '@/src/hooks/usePlannerApi';

export default function TaskChecklist({ planId, taskId }: { planId: string; taskId: string }) {
  const { q, add, patch, remove } = useChecklist(taskId, planId);
  const [text, setText] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);

  if (q.isLoading) return <div className="text-slate-300">Loading…</div>;
  if (q.error) return <div className="text-red-400">Failed to load checklist</div>;

  const items = q.data?.items ?? [];
  const completedItems = items.filter((item: any) => item.done);
  const activeItems = items.filter((item: any) => !item.done);

  const handleAdd = () => {
    const value = text.trim();
    if (!value) return;
    add.mutate(value);
    setText('');
  };

  const renderItem = (item: any, completed: boolean) => (
    <li
      key={item.id}
      className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-2 py-2"
    >
      <button
        type="button"
        onClick={() => patch.mutate({ itemId: item.id, data: { done: !item.done } })}
        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
          completed ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border-slate-600 text-slate-400'
        }`}
        aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {completed ? <Check className="h-3 w-3" /> : null}
      </button>
      <input
        value={item.title}
        onChange={(event) => patch.mutate({ itemId: item.id, data: { title: event.target.value } })}
        className={`flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm outline-none ${
          completed ? 'text-slate-500 line-through' : 'text-white'
        }`}
      />
      <button
        type="button"
        onClick={() => remove.mutate(item.id)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
        aria-label="Delete checklist item"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          {completedItems.length}/{items.length} completed
        </span>
        {completedItems.length > 0 ? (
          <button
            type="button"
            className="text-emerald-400 hover:text-emerald-300"
            onClick={() => setShowCompleted((value) => !value)}
          >
            {showCompleted ? 'Hide completed' : `Show completed (${completedItems.length})`}
          </button>
        ) : null}
      </div>

      <ul className="space-y-2">
        {activeItems.map((item: any) => renderItem(item, false))}
      </ul>

      {completedItems.length > 0 && showCompleted ? (
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-slate-500">Completed</div>
          <ul className="space-y-2">
            {completedItems.map((item: any) => renderItem(item, true))}
          </ul>
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleAdd();
        }}
        className="flex gap-2"
      >
        <input
          className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
          placeholder="New checklist item"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <button
          type="submit"
          className="rounded-md border border-emerald-500 px-3 py-1 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10"
        >
          Add
        </button>
      </form>
    </div>
  );
}
