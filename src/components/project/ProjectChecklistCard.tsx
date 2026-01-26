"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/theme";
import type { ProjectType } from "@/lib/mock/projects";
import {
  CHECKLIST_ITEMS,
  CHECKLIST_STATUS_ORDER,
  STATUS_CLASS,
  STATUS_LABEL,
} from "@/components/project/ProjectChecklistCard.data";
import type {
  ChecklistKey,
  ChecklistStatus,
} from "@/components/project/ProjectChecklistCard.types";

type Props = {
  projectType?: ProjectType;
};

export function ProjectChecklistCard({ projectType }: Props) {
  const visibleItems = useMemo(
    () => CHECKLIST_ITEMS.filter((item) => (item.visible ? item.visible(projectType) : true)),
    [projectType],
  );

  const [statusMap, setStatusMap] = useState<Record<ChecklistKey, ChecklistStatus>>(() =>
    CHECKLIST_ITEMS.reduce(
      (acc, item) => ({
        ...acc,
        [item.key]: "NOT_STARTED",
      }),
      {} as Record<ChecklistKey, ChecklistStatus>,
    ),
  );
  const [expanded, setExpanded] = useState<Record<ChecklistKey, boolean>>({} as Record<ChecklistKey, boolean>);
  const [notes, setNotes] = useState<Record<ChecklistKey, string>>({} as Record<ChecklistKey, string>);
  const [saved, setSaved] = useState<Record<ChecklistKey, boolean>>({} as Record<ChecklistKey, boolean>);

  const cycleStatus = (key: ChecklistKey) => {
    setStatusMap((prev) => {
      const next = CHECKLIST_STATUS_ORDER[(CHECKLIST_STATUS_ORDER.indexOf(prev[key]) + 1) % CHECKLIST_STATUS_ORDER.length];
      return { ...prev, [key]: next };
    });
  };

  const toggleNotes = (key: ChecklistKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNotes = (key: ChecklistKey) => {
    setSaved((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setSaved((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-white">Operational Checklist</h2>
        <p className="text-sm text-white/60">Work through each item before mobilization.</p>
      </header>
      <div className="divide-y divide-white/10">
        {visibleItems.map((item) => (
          <div key={item.key} className="py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold">{item.title}</p>
                <p className="text-sm text-white/60">{item.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => cycleStatus(item.key)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
                    STATUS_CLASS[statusMap[item.key]],
                  )}
                >
                  {STATUS_LABEL[statusMap[item.key]]}
                </button>
                <button
                  type="button"
                  onClick={() => toggleNotes(item.key)}
                  className="text-xs font-medium text-white/70 hover:text-white"
                >
                  {expanded[item.key] ? "Hide notes" : "View notes"}
                </button>
              </div>
            </div>
            {expanded[item.key] ? (
              <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                <textarea
                  value={notes[item.key] ?? ""}
                  onChange={(event) => setNotes((prev) => ({ ...prev, [item.key]: event.target.value }))}
                  rows={3}
                  placeholder="Add notes or observations…"
                  className="w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSaveNotes(item.key)}
                    className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
                  >
                    Save
                  </button>
                  {saved[item.key] ? <span className="text-xs text-emerald-300">Saved</span> : null}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

