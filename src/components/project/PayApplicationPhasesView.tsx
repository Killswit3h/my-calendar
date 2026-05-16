"use client";

import { cn } from "@/lib/theme";
import type { ProjectPayItemView } from "@/app/projects/projects.models";
import { PAY_ITEM_LABEL } from "@/components/project/payApplicationConstants";
import type { Phase, PhaseItem } from "@/components/project/payApplicationTypes";

function sumQtyForPayItemExcludingRow(
  phases: Phase[],
  projectPayItemId: number,
  excludePhaseId: string,
  excludeItemId: string,
): number {
  let sum = 0;
  for (const ph of phases) {
    for (const it of ph.items) {
      if (it.projectPayItemId !== projectPayItemId) continue;
      if (ph.id === excludePhaseId && it.id === excludeItemId) continue;
      const q = Number(it.quantity);
      sum += Number.isFinite(q) ? q : 0;
    }
  }
  return sum;
}

function maxQtyAllowedForRow(item: PhaseItem, phaseId: string, phases: Phase[]): number {
  if (item.projectPayItemId == null) return Number.POSITIVE_INFINITY;
  const c = item.contractedQuantity;
  if (!Number.isFinite(c) || c < 0) return Number.POSITIVE_INFINITY;
  const elsewhere = sumQtyForPayItemExcludingRow(phases, item.projectPayItemId, phaseId, item.id);
  return Math.max(0, c - elsewhere);
}

type PhasesViewProps = {
  phaseSearch: string;
  onPhaseSearchChange: (value: string) => void;
  phases: Phase[];
  filteredPhases: Phase[];
  payLines: ProjectPayItemView[];
  onUpdatePhase: (phaseId: string, updates: Partial<Phase>) => void;
  onTogglePhaseBoolean: (phaseId: string, key: "onsiteReview" | "surveyed") => void;
  onUpdatePhaseItem: (phaseId: string, itemId: string, updates: Partial<PhaseItem>) => void;
  onAddPhase: () => void;
  onAddPayItemToPhase: (phaseId: string, projectPayItemId: number) => void;
  invoiceNumber: string;
};

export function PayApplicationPhasesView({
  phaseSearch,
  onPhaseSearchChange,
  phases,
  filteredPhases,
  payLines,
  onUpdatePhase,
  onTogglePhaseBoolean,
  onUpdatePhaseItem,
  onAddPhase,
  onAddPayItemToPhase,
  invoiceNumber,
}: PhasesViewProps) {
  const trimmedInvoice = invoiceNumber.trim();
  const addablePayLines = payLines.filter((l) => {
    if (l.id.startsWith("temp-")) return false;
    const n = Number(l.id);
    return Number.isInteger(n) && n > 0;
  });

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Phases</p>
          <p className="text-xs text-white/60">
            Per-phase quantities (capped by contract), phase line notes, and readiness. Search by phase number/name.
          </p>
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
                  <div className="flex flex-nowrap items-center gap-2">
                    <span className="text-lg font-semibold text-white">
                      {trimmedInvoice || (
                        <span className="italic text-white/40">Set invoice #</span>
                      )}
                    </span>
                    <input
                      type="text"
                      value={phase.invoiceSuffix}
                      onChange={(event) =>
                        onUpdatePhase(phase.id, {
                          invoiceSuffix: event.target.value
                            .replace(/[^A-Za-z]/g, "")
                            .toUpperCase()
                            .slice(0, 3),
                        })
                      }
                      maxLength={3}
                      size={Math.max(phase.invoiceSuffix.length, 1)}
                      aria-label="Invoice letter"
                      placeholder="A"
                      className="h-7 w-auto min-w-[1.75rem] rounded-md border border-white/20 bg-black/30 px-1.5 text-center text-base font-semibold uppercase leading-none text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                    />
                  </div>
                  <p className="text-sm font-medium text-white/80">{phase.name}</p>
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
              <div className="hidden text-xs text-white/60 xl:grid xl:grid-cols-[minmax(0,0.75fr),minmax(0,1fr),minmax(0,1fr),5.5rem,4.5rem] xl:gap-2">
                <span>{PAY_ITEM_LABEL}</span>
                <span>Contract line</span>
                <span>Phase line description</span>
                <span className="text-right">Quantity</span>
                <span className="text-right">Installed</span>
              </div>
              <div className="space-y-3">
                {phase.items.map((item) => {
                  const maxQ = maxQtyAllowedForRow(item, phase.id, phases);
                  const hasCap = item.projectPayItemId != null && Number.isFinite(maxQ);
                  const curQ = Number(item.quantity);
                  const safeCur = Number.isFinite(curQ) ? curQ : 0;
                  const elsewhere =
                    item.projectPayItemId != null
                      ? sumQtyForPayItemExcludingRow(phases, item.projectPayItemId, phase.id, item.id)
                      : 0;
                  const allocatedTotal = elsewhere + safeCur;
                  const cap = item.contractedQuantity;

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm xl:grid xl:grid-cols-[minmax(0,0.75fr),minmax(0,1fr),minmax(0,1fr),5.5rem,4.5rem] xl:items-start xl:gap-2"
                    >
                      <div className="font-semibold text-white">{item.payItem}</div>
                      <div>
                        <p className="text-xs text-white/50 xl:hidden">Contract line</p>
                        <div className="text-white/70">{item.description}</div>
                      </div>
                      <div className="mt-2 xl:mt-0">
                        <label className="mb-1 block text-xs text-white/50 xl:sr-only" htmlFor={`phase-line-desc-${item.id}`}>
                          Phase line description
                        </label>
                        <textarea
                          id={`phase-line-desc-${item.id}`}
                          value={item.lineDescription ?? ""}
                          onChange={(event) =>
                            onUpdatePhaseItem(phase.id, item.id, { lineDescription: event.target.value })
                          }
                          rows={2}
                          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                          placeholder="Notes for this pay item in this phase…"
                        />
                      </div>
                      <div className="mt-2 xl:mt-0 xl:text-right">
                        <p className="text-xs text-white/50 xl:hidden">Quantity</p>
                        <input
                          type="number"
                          min={0}
                          max={hasCap ? maxQ : undefined}
                          step="0.01"
                          value={item.quantity}
                          onChange={(event) => {
                            const raw = Number(event.target.value);
                            let next = Number.isNaN(raw) ? 0 : raw;
                            if (hasCap) next = Math.min(Math.max(0, next), maxQ);
                            else next = Math.max(0, next);
                            onUpdatePhaseItem(phase.id, item.id, { quantity: next });
                          }}
                          aria-label={`Phase quantity for ${item.payItem}`}
                          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-right text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60 xl:w-full"
                        />
                      </div>
                      <div className="mt-2 text-white xl:mt-0 xl:text-right">
                        <p className="text-xs text-white/50 xl:hidden">Installed</p>
                        {item.installedQty.toLocaleString()}
                      </div>
                      {item.projectPayItemId != null && Number.isFinite(cap) ? (
                        <p className="text-xs text-white/50 xl:col-span-full">
                          Allocated across phases: {allocatedTotal.toLocaleString()} / {cap.toLocaleString()} (contracted)
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-1 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:gap-3">
                <label className="text-xs font-semibold text-white/60 shrink-0" htmlFor={`add-pay-${phase.id}`}>
                  Add pay item
                </label>
                <select
                  id={`add-pay-${phase.id}`}
                  aria-label={`Add a saved contract pay item to ${phase.name}`}
                  className="w-full max-w-md rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                  value=""
                  onChange={(event) => {
                    const v = event.target.value;
                    if (!v) return;
                    onAddPayItemToPhase(phase.id, Number(v));
                    event.currentTarget.selectedIndex = 0;
                  }}
                >
                  <option value="">Choose a pay item…</option>
                  {addablePayLines
                    .filter((l) => !phase.items.some((it) => it.projectPayItemId === Number(l.id)))
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.payItemNumber} —{" "}
                        {l.payItemDescription.length > 70
                          ? `${l.payItemDescription.slice(0, 70)}…`
                          : l.payItemDescription}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        ))}
        {!filteredPhases.length ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
            {phases.length === 0
              ? "No phases yet. Use Add Phase to start, then Save phases when ready."
              : "No phases match your search."}
          </div>
        ) : null}
      </div>
    </div>
  );
}
