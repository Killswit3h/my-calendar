"use client";

import { useState } from "react";
import { FinanceWarning } from "@/lib/finance/types";

export function WarningsChip({
  count, items,
}: { count: number; items: { code: FinanceWarning; detail: string }[] }) {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;
  return (
    <>
      <button
        type="button"
        className="rounded-full px-2 py-1 text-xs bg-amber-600/20 text-amber-300 hover:bg-green-600/20 hover:text-green-200 transition"
        onClick={() => setOpen(true)}
        title="Click to view warnings"
      >
        {count} warning{count > 1 ? "s" : ""}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-neutral-900 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-100">Warnings</h3>
              <button className="px-2 py-1 text-neutral-300 hover:text-white" onClick={() => setOpen(false)}>Close</button>
            </div>
            <ul className="space-y-2">
              {items.map((w, i) => (
                <li key={i} className="rounded-md bg-neutral-800 p-2 text-sm text-neutral-200">
                  <div className="font-mono text-xs opacity-70">{w.code}</div>
                  <div>{w.detail}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
