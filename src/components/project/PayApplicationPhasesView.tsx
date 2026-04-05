"use client";

import { cn } from "@/lib/theme";
import { PAY_ITEM_LABEL } from "@/components/project/payApplicationConstants";
import type { Phase, PhaseItem } from "@/components/project/payApplicationTypes";

type PhasesViewProps = {
  phaseSearch: string;
  onPhaseSearchChange: (value: string) => void;
  phases: Phase[];
  filteredPhases: Phase[];
  onUpdatePhase: (phaseId: string, updates: Partial<Phase>) => void;
  onTogglePhaseBoolean: (phaseId: string, key: "onsiteReview" | "surveyed") => void;
  onUpdatePhaseItem: (phaseId: string, itemId: string, updates: Partial<PhaseItem>) => void;
  onAddPhase: () => void;
};

export function PayApplicationPhasesView({
  phaseSearch,
  onPhaseSearchChange,
  phases,
  filteredPhases,
  onUpdatePhase,
  onTogglePhaseBoolean,
  onUpdatePhaseItem,
  onAddPhase,
}: PhasesViewProps) {
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Phases</p>
          <p className="text-xs text-white/60">Per-phase quantities, readiness, and notes. Search by phase number/name.</p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
          <input
            type="text"
            value={phaseSearch}
            onChange={(event) => onPhaseSearchChange(event.target.value)}
            placeholder="Search phases…"
            className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60 md:w-64"
          />
          <button
            type="button"
            onClick={onAddPhase}
            className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
          >
            Add Phase
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredPhases.map((phase) => (
          <div key={phase.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="grid gap-4 lg:grid-cols-[1.1fr,1fr]">
              <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-col gap-1">
                  <p className="text-base font-semibold text-white">{phase.name}</p>
                  <p className="text-xs text-white/60">Phase prerequisites and locate details</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white/60">Locate Ticket #</p>
                    <input
                      value={phase.locateTicket}
                      onChange={(event) => onUpdatePhase(phase.id, { locateTicket: event.target.value })}
                      className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                      placeholder="Enter locate ticket #"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white/60">Date Created</p>
                    <input
                      type="date"
                      value={phase.dateCreated}
                      onChange={(event) => onUpdatePhase(phase.id, { dateCreated: event.target.value })}
                      className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs font-semibold text-white/60">Ready to Work Date</p>
                    <input
                      type="date"
                      value={phase.readyToWorkDate}
                      onChange={(event) => onUpdatePhase(phase.id, { readyToWorkDate: event.target.value })}
                      className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-white/10 bg-black/10 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white/60">Onsite Review</p>
                    <button
                      type="button"
                      onClick={() => onTogglePhaseBoolean(phase.id, "onsiteReview")}
                      className={cn(
                        "inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
                        phase.onsiteReview ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-white/80 hover:bg-white/15",
                      )}
                    >
                      {phase.onsiteReview ? "Yes" : "No"}
                    </button>
                  </div>
                  <div className="space-y-1 sm:row-span-2">
                    <p className="text-xs font-semibold text-white/60">Notes</p>
                    <textarea
                      value={phase.notes ?? ""}
                      onChange={(event) => onUpdatePhase(phase.id, { notes: event.target.value })}
                      rows={4}
                      className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                      placeholder="Add notes for this phase…"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white/60">Surveyed</p>
                    <button
                      type="button"
                      onClick={() => onTogglePhaseBoolean(phase.id, "surveyed")}
                      className={cn(
                        "inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
                        phase.surveyed ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-white/80 hover:bg-white/15",
                      )}
                    >
                      {phase.surveyed ? "Yes" : "No"}
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1.1fr,1fr]">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white/60">Status</p>
                    <input
                      value={phase.status}
                      onChange={(event) => onUpdatePhase(phase.id, { status: event.target.value })}
                      className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                      placeholder="Status"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white/60">Status Date</p>
                    <input
                      type="date"
                      value={phase.statusDate}
                      onChange={(event) => onUpdatePhase(phase.id, { statusDate: event.target.value })}
                      className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="hidden text-xs text-white/60 md:grid md:grid-cols-[1fr,1.6fr,0.8fr,0.8fr] md:gap-2">
                <span>{PAY_ITEM_LABEL}</span>
                <span>Description</span>
                <span className="text-right">Quantity</span>
                <span className="text-right">Installed</span>
              </div>
              <div className="space-y-3">
                {phase.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm md:grid md:grid-cols-[1fr,1.6fr,0.8fr,0.8fr] md:items-center md:gap-2"
                  >
                    <div className="font-semibold text-white">{item.payItem}</div>
                    <div className="text-white/70">{item.description}</div>
                    <div className="mt-2 md:mt-0 md:text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(event) =>
                          onUpdatePhaseItem(phase.id, item.id, {
                            quantity: Number.isNaN(Number(event.target.value)) ? 0 : Number(event.target.value),
                          })
                        }
                        className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-right text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                      />
                    </div>
                    <div className="text-white md:text-right">{item.installedQty.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        {!filteredPhases.length ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">No phases match your search.</div>
        ) : null}
      </div>
    </div>
  );
}
