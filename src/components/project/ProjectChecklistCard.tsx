"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/theme";
import type { ProjectType } from "@/lib/mock/projects";

type ChecklistKey =
  | "scope"
  | "changeOrders"
  | "materialCompliance"
  | "eeo"
  | "payroll"
  | "locate"
  | "onsiteReview"
  | "materials"
  | "handrail";

type ChecklistStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";

type ChecklistItem = {
  key: ChecklistKey;
  title: string;
  description: string;
  visible?: (type?: ProjectType) => boolean;
};

const STATUS_LABEL: Record<ChecklistStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
};

const STATUS_CLASS: Record<ChecklistStatus, string> = {
  NOT_STARTED: "bg-white/10 text-white",
  IN_PROGRESS: "bg-amber-500/20 text-amber-200",
  COMPLETE: "bg-emerald-500/20 text-emerald-200",
};

const ITEMS: ChecklistItem[] = [
  { key: "scope", title: "Scope of Work", description: "Review contract scope, plans, and specs." },
  {
    key: "changeOrders",
    title: "Change Orders / Conflicts",
    description: "Log any conflicts, RFIs, or potential COs to raise.",
  },
  {
    key: "materialCompliance",
    title: "Material Compliance Forms",
    description: "Verify all material compliance forms are completed/approved.",
  },
  { key: "eeo", title: "EEO Compliance", description: "Confirm EEO requirements and documentation are up to date." },
  { key: "payroll", title: "Payroll", description: "Verify payroll and certified payroll submissions." },
  {
    key: "locate",
    title: "Locate Tickets",
    description: "Confirm utility locate tickets requested/cleared.",
  },
  {
    key: "onsiteReview",
    title: "Onsite Review",
    description: "Perform onsite review / preconstruction walk-through.",
  },
  {
    key: "materials",
    title: "Materials Ordered / In Stock",
    description: "Confirm materials have been ordered or are available in stock.",
  },
  {
    key: "handrail",
    title: "Handrail Measurements Confirmed Onsite",
    description: "Confirm field measurements for handrail runs and details.",
    visible: (type) => type === "HANDRAIL",
  },
];

type Props = {
  projectType?: ProjectType;
};

export function ProjectChecklistCard({ projectType }: Props) {
  const visibleItems = useMemo(
    () => ITEMS.filter((item) => (item.visible ? item.visible(projectType) : true)),
    [projectType],
  );

  const [statusMap, setStatusMap] = useState<Record<ChecklistKey, ChecklistStatus>>(() => {
    const initial: Record<ChecklistKey, ChecklistStatus> = {
      scope: "NOT_STARTED",
      changeOrders: "NOT_STARTED",
      materialCompliance: "NOT_STARTED",
      eeo: "NOT_STARTED",
      payroll: "NOT_STARTED",
      locate: "NOT_STARTED",
      onsiteReview: "NOT_STARTED",
      materials: "NOT_STARTED",
      handrail: "NOT_STARTED",
    };
    return initial;
  });
  const [expanded, setExpanded] = useState<Record<ChecklistKey, boolean>>({} as Record<ChecklistKey, boolean>);
  const [notes, setNotes] = useState<Record<ChecklistKey, string>>({} as Record<ChecklistKey, string>);
  const [saved, setSaved] = useState<Record<ChecklistKey, boolean>>({} as Record<ChecklistKey, boolean>);

  const cycleStatus = (key: ChecklistKey) => {
    setStatusMap((prev) => {
      const order: ChecklistStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETE"];
      const next = order[(order.indexOf(prev[key]) + 1) % order.length];
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

